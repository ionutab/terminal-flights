/**
 * Automated test suite for Quick Plane Prices
 */

import { searchFlightPrices } from "../src/api/flights.js";
import { resolveAirport, formatAirportName } from "../src/data/airports.js";
import { parseDuration, formatIsoDate, getDayOfWeek, getDayOfYear } from "../src/utils/dates.js";
import { generateMarkdownReport, calculateStatistics } from "../src/formatters/markdown.js";

async function runTests() {
  console.log("🚀 Running Quick Plane Prices Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Airport Resolution Tests
  console.log("--- 1. Airport Resolution ---");
  const ber = resolveAirport("BER");
  assert(ber.code === "BER" && ber.city === "Berlin", "Resolve IATA code BER");

  const london = resolveAirport("London");
  assert(london.code === "LHR" || london.code === "LGW" || london.code === "STN", "Resolve city name London");

  const jfk = resolveAirport("jfk");
  assert(jfk.code === "JFK", "Resolve lowercase iata jfk");

  const formatted = formatAirportName("BCN");
  assert(formatted.includes("Barcelona") && formatted.includes("BCN"), "Format airport name BCN");

  // 2. Duration & Date Tests
  console.log("\n--- 2. Duration & Date Utilities ---");
  const dur1m = parseDuration("1m");
  assert(dur1m.days >= 30, "Parse duration 1m");

  const dur2m = parseDuration("2m");
  assert(dur2m.days >= 60, "Parse duration 2m");

  const dur14d = parseDuration("14d");
  assert(dur14d.days === 14, "Parse duration 14d");

  const dur2w = parseDuration("2w");
  assert(dur2w.days === 14, "Parse duration 2w");

  const dow = getDayOfWeek("2026-09-18");
  assert(dow === "Friday", "Day of week for 2026-09-18 is Friday");

  const doy = getDayOfYear("2026-01-01");
  assert(doy === 1, "Day of year for 2026-01-01 is 1");

  // 3. Live Flight Search Tests (One-Way)
  console.log("\n--- 3. Live Flight Search (One-Way 1m) ---");
  try {
    const res1 = await searchFlightPrices({
      origin: "BER",
      destination: "BCN",
      durationDays: 30,
      currency: "EUR"
    });

    assert(res1.flights.length >= 25, `Fetched ${res1.flights.length} flight dates for BER->BCN`);
    assert(res1.flights.every((f) => f.price > 0 && f.currency === "EUR"), "All flights have positive price in EUR");
    assert(res1.flights.every((f) => f.dayOfWeek && f.dayOfYear), "All flights have day of week and day of year");
  } catch (err) {
    assert(false, `Live search failed: ${err.message}`);
  }

  // 4. Live Flight Search (Round-Trip)
  console.log("\n--- 4. Live Flight Search (Round-Trip 7d) ---");
  try {
    const resRT = await searchFlightPrices({
      origin: "MAD",
      destination: "CDG",
      durationDays: 20,
      roundTrip: true,
      tripDurationDays: 7,
      currency: "EUR"
    });

    assert(resRT.flights.length >= 15, `Fetched ${resRT.flights.length} round-trip dates for MAD->CDG`);
    assert(resRT.flights.every((f) => f.returnDate), "All round-trip flights have return date");
  } catch (err) {
    assert(false, `Round-trip search failed: ${err.message}`);
  }

  // 5. Markdown Report Generation Tests
  console.log("\n--- 5. Markdown Formatter Tests ---");
  const mockData = {
    origin: "BER",
    destination: "BCN",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    roundTrip: false,
    tripDurationDays: 7,
    currency: "EUR",
    directOnly: false,
    flights: [
      { date: "2026-09-10", dayOfWeek: "Thursday", dayOfYear: 253, price: 100, currency: "EUR", bookingUrl: "https://flights.google.com" },
      { date: "2026-09-11", dayOfWeek: "Friday", dayOfYear: 254, price: 50, currency: "EUR", bookingUrl: "https://flights.google.com" },
      { date: "2026-09-12", dayOfWeek: "Saturday", dayOfYear: 255, price: 75, currency: "EUR", bookingUrl: "https://flights.google.com" }
    ]
  };

  const md = generateMarkdownReport(mockData);
  assert(md.includes("# ✈️ Flight Prices:"), "Markdown includes title");
  assert(md.includes("€50 EUR") || md.includes("50 EUR"), "Markdown includes cheapest price");
  assert(md.includes("Friday"), "Markdown includes day of week");
  assert(md.includes("Day 254"), "Markdown includes day of year");
  assert(md.includes("Day of the Week Price Analysis"), "Markdown includes day of week analysis");

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
