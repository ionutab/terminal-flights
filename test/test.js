/**
 * Automated test suite for Quick Plane Prices
 */

import { searchFlightPrices } from "../src/api/flights.js";
import { resolveAirport, formatAirportName } from "../src/data/airports.js";
import { parseDuration, formatIsoDate, getDayOfWeek, getDayOfYear } from "../src/utils/dates.js";
import { generateMarkdownReport, calculateStatistics } from "../src/formatters/markdown.js";
import { getTranslations } from "../src/i18n/translations.js";

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

  const dowEn = getDayOfWeek("2026-09-18", "en");
  assert(dowEn === "Friday", "Day of week for 2026-09-18 in English is Friday");

  const dowDe = getDayOfWeek("2026-09-18", "de");
  assert(dowDe === "Freitag", "Day of week for 2026-09-18 in German is Freitag");

  const dowEs = getDayOfWeek("2026-09-18", "es");
  assert(dowEs === "Viernes", "Day of week for 2026-09-18 in Spanish is Viernes");

  const doy = getDayOfYear("2026-01-01");
  assert(doy === 1, "Day of year for 2026-01-01 is 1");

  // 3. Translations Dictionary Tests
  console.log("\n--- 3. i18n Translations Dictionary ---");
  const transEn = getTranslations("en");
  assert(transEn.reportTitle === "Flight Prices", "English translations reportTitle");

  const transDe = getTranslations("de");
  assert(transDe.reportTitle === "Flugpreise", "German translations reportTitle");

  const transEs = getTranslations("es");
  assert(transEs.reportTitle === "Precios de Vuelos", "Spanish translations reportTitle");

  const transFr = getTranslations("fr");
  assert(transFr.reportTitle === "Prix des Vols", "French translations reportTitle");

  // 4. Live Flight Search Tests (One-Way)
  console.log("\n--- 4. Live Flight Search (One-Way 1m) ---");
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

  // 5. Live Flight Search (Round-Trip)
  console.log("\n--- 5. Live Flight Search (Round-Trip 7d) ---");
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

  // 6. Markdown Report Generation Tests (Multi-Language & Optional Links)
  console.log("\n--- 6. Markdown Formatter Tests ---");
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
      { date: "2026-09-10", dayOfWeek: "Thursday", dayOfYear: 253, price: 100, currency: "EUR", bookingUrl: "https://flights.google.com/test1" },
      { date: "2026-09-11", dayOfWeek: "Friday", dayOfYear: 254, price: 50, currency: "EUR", bookingUrl: "https://flights.google.com/test2" },
      { date: "2026-09-12", dayOfWeek: "Saturday", dayOfYear: 255, price: 75, currency: "EUR", bookingUrl: "https://flights.google.com/test3" }
    ]
  };

  const mdNoLinks = generateMarkdownReport(mockData, { language: "en", showLinks: false });
  assert(mdNoLinks.includes("# ✈️ Flight Prices:"), "English report title");
  assert(mdNoLinks.includes("€50 EUR"), "English price display");
  assert(mdNoLinks.includes("Friday"), "English day of week");
  assert(!mdNoLinks.includes("https://flights.google.com"), "No Google Flights links by default when showLinks=false");
  assert(!mdNoLinks.includes("Booking Link"), "No Booking Link column by default");
  assert(!mdNoLinks.includes("Day of Year"), "No Day of Year column in tables");
  assert(!mdNoLinks.includes("Day 254"), "No Day of Year label in output");

  const mdWithLinks = generateMarkdownReport(mockData, { language: "en", showLinks: true });
  assert(mdWithLinks.includes("https://flights.google.com/test2"), "Google Flights link present when showLinks=true");
  assert(mdWithLinks.includes("Booking Link"), "Booking Link column present when showLinks=true");

  const mdDe = generateMarkdownReport(mockData, { language: "de", showLinks: true });
  assert(mdDe.includes("# ✈️ Flugpreise:"), "German report title");
  assert(mdDe.includes("Freitag"), "German day of week");
  assert(mdDe.includes("Wochentags-Preisanalyse"), "German day of week analysis title");
  assert(mdDe.includes("Günstigstes Ticket:"), "German cheapest ticket header");
  assert(mdDe.includes("Auf Google Flights buchen"), "German Google Flights link text");
  assert(mdDe.includes("Bewertung"), "German Rating column header");
  assert(mdDe.includes("🟢 Top-Angebot"), "German Great Deal rating badge");
  assert(mdDe.includes("🔴 Teuer"), "German Expensive rating badge");

  const mdEs = generateMarkdownReport(mockData, { language: "es", showLinks: false });
  assert(mdEs.includes("# ✈️ Precios de Vuelos:"), "Spanish report title");
  assert(mdEs.includes("Viernes"), "Spanish day of week");
  assert(mdEs.includes("Billete más barato:"), "Spanish cheapest ticket header");
  assert(mdEs.includes("Valoración"), "Spanish Rating column header");
  assert(mdEs.includes("🟢 Gran Oferta"), "Spanish Great Deal rating badge");

  const mdFr = generateMarkdownReport(mockData, { language: "fr", showLinks: false });
  assert(mdFr.includes("Évaluation"), "French Rating column header");
  assert(mdFr.includes("🟢 Super Offre"), "French Great Deal rating badge");

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
