/**
 * Markdown Formatter for Flight Prices
 */

import { formatAirportName } from "../data/airports.js";
import { formatDisplayDate } from "../utils/dates.js";

/**
 * Calculates statistical metrics from flight results
 * @param {Array<{ price: number, dayOfWeek: string, date: string }>} flights
 * @returns {object}
 */
export function calculateStatistics(flights) {
  if (!flights || flights.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      cheapestFlight: null,
      dayStats: {}
    };
  }

  const prices = flights.map((f) => f.price).sort((a, b) => a - b);
  const sum = prices.reduce((acc, p) => acc + p, 0);
  const avg = Math.round(sum / prices.length);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 !== 0 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);

  // Cheapest flight
  const cheapestFlight = flights.reduce((minF, f) => (!minF || f.price < minF.price ? f : minF), null);

  // Day of week aggregation
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayStats = {};
  for (const d of dayOrder) {
    dayStats[d] = { count: 0, total: 0, min: Infinity, minFlight: null };
  }

  for (const f of flights) {
    if (dayStats[f.dayOfWeek]) {
      dayStats[f.dayOfWeek].count++;
      dayStats[f.dayOfWeek].total += f.price;
      if (f.price < dayStats[f.dayOfWeek].min) {
        dayStats[f.dayOfWeek].min = f.price;
        dayStats[f.dayOfWeek].minFlight = f;
      }
    }
  }

  const dayAnalysis = dayOrder
    .filter((d) => dayStats[d].count > 0)
    .map((d) => {
      const count = dayStats[d].count;
      const dayAvg = Math.round(dayStats[d].total / count);
      return {
        day: d,
        avg: dayAvg,
        min: dayStats[d].min,
        count,
        minFlight: dayStats[d].minFlight
      };
    });

  // Best day of week
  const bestDay = [...dayAnalysis].sort((a, b) => a.avg - b.avg)[0] || null;

  return {
    count: flights.length,
    min,
    max,
    avg,
    median,
    cheapestFlight,
    dayAnalysis,
    bestDay
  };
}

/**
 * Generates comprehensive GitHub-Flavored Markdown report
 * @param {object} data
 * @param {object} [options]
 * @param {number} [options.topN=10]
 * @param {'date'|'price'} [options.sortBy='date']
 * @returns {string}
 */
export function generateMarkdownReport(data, options = {}) {
  const { topN = 10, sortBy = "date" } = options;
  const {
    origin,
    destination,
    startDate,
    endDate,
    roundTrip,
    tripDurationDays,
    currency = "EUR",
    directOnly,
    flights = []
  } = data;

  if (flights.length === 0) {
    return `# ✈️ Flight Price Report: ${origin} ➔ ${destination}\n\n*No flight prices found for this route and date range.*`;
  }

  const stats = calculateStatistics(flights);
  const originDisplay = formatAirportName(origin);
  const destDisplay = formatAirportName(destination);
  const currSymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : `${currency} `;

  // Price thresholds for deal rating
  const p25 = stats.min + (stats.median - stats.min) * 0.5;
  const p75 = stats.median + (stats.max - stats.median) * 0.5;

  const getDealBadge = (price) => {
    if (price <= p25) return "🟢 Great Deal";
    if (price <= p75) return "🟡 Average";
    return "🔴 Expensive";
  };

  // Top cheapest flights
  const cheapestSorted = [...flights].sort((a, b) => a.price - b.price);
  const topCheapest = cheapestSorted.slice(0, topN);

  // Full flights list sorted according to option
  const calendarFlights = [...flights].sort((a, b) => {
    if (sortBy === "price") {
      return a.price - b.price;
    }
    return a.date.localeCompare(b.date);
  });

  const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const lines = [];

  // Title
  lines.push(`# ✈️ Flight Prices: ${originDisplay} ➔ ${destDisplay}`);
  lines.push("");

  // Metadata Table
  lines.push("| Parameter | Details |");
  lines.push("| :--- | :--- |");
  lines.push(`| **Route** | \`${origin}\` (${originDisplay}) ➔ \`${destination}\` (${destDisplay}) |`);
  lines.push(`| **Trip Type** | ${roundTrip ? `Round-Trip (${tripDurationDays} days)` : "One-Way"} |`);
  lines.push(`| **Flight Preference** | ${directOnly ? "Direct / Non-stop only" : "All flights"} |`);
  lines.push(`| **Search Range** | \`${startDate}\` to \`${endDate}\` (${flights.length} days scanned) |`);
  lines.push(`| **Currency** | ${currency} (${currSymbol.trim()}) |`);
  lines.push(`| **Report Generated** | ${now} |`);
  lines.push("");

  // Key Findings & Summary
  lines.push("## 📊 Summary & Key Insights");
  lines.push("");
  lines.push(`- 🏆 **Cheapest Ticket:** **${currSymbol}${stats.cheapestFlight.price} ${currency}** on **${stats.cheapestFlight.dayOfWeek}, ${stats.cheapestFlight.date}** (Day ${stats.cheapestFlight.dayOfYear} of year) — [Book on Google Flights](${stats.cheapestFlight.bookingUrl})`);
  lines.push(`- 🏷️ **Price Range:** **${currSymbol}${stats.min}** to **${currSymbol}${stats.max} ${currency}**`);
  lines.push(`- 📈 **Average Price:** **${currSymbol}${stats.avg} ${currency}** (Median: **${currSymbol}${stats.median} ${currency}**)`);
  if (stats.bestDay) {
    lines.push(`- 📅 **Best Day to Fly:** **${stats.bestDay.day}** (average **${currSymbol}${stats.bestDay.avg} ${currency}**, lowest **${currSymbol}${stats.bestDay.min} ${currency}**)`);
  }
  lines.push("");

  // Top Deals Table
  lines.push(`## 🏆 Top ${Math.min(topN, flights.length)} Cheapest Dates`);
  lines.push("");
  lines.push("| Rank | Date | Day of Week | Day of Year | Price | Savings vs Avg | Booking Link |");
  lines.push("| :---: | :--- | :--- | :---: | :---: | :---: | :--- |");

  topCheapest.forEach((f, idx) => {
    const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
    const diff = stats.avg - f.price;
    const pct = stats.avg > 0 ? Math.round((diff / stats.avg) * 100) : 0;
    const savingsStr = pct > 0 ? `🔥 -${pct}% (save ${currSymbol}${diff})` : "Average";
    const dateFormatted = formatDisplayDate(f.date);

    lines.push(`| ${rankEmoji} | **${f.date}** (${dateFormatted.split(", ")[1]}) | ${f.dayOfWeek} | Day ${f.dayOfYear} | **${currSymbol}${f.price} ${currency}** | ${savingsStr} | [View Flight ↗](${f.bookingUrl}) |`);
  });
  lines.push("");

  // Day of Week Analysis
  if (stats.dayAnalysis && stats.dayAnalysis.length > 0) {
    lines.push("## 🗓️ Day of the Week Price Analysis");
    lines.push("");
    lines.push("| Day of Week | Avg Price | Min Price | Cheapest Date Found | Flights | Trend |");
    lines.push("| :--- | :---: | :---: | :--- | :---: | :--- |");

    for (const d of stats.dayAnalysis) {
      const trend = d.avg <= stats.avg ? "🟢 Cheap" : "🔴 Prickly";
      const minDateStr = d.minFlight ? `${d.minFlight.date} (${currSymbol}${d.minFlight.price})` : "-";
      lines.push(`| **${d.day}** | ${currSymbol}${d.avg} ${currency} | **${currSymbol}${d.min} ${currency}** | ${minDateStr} | ${d.count} | ${trend} |`);
    }
    lines.push("");
  }

  // Full Calendar Table
  lines.push(`## 📅 Complete Price Calendar (${calendarFlights.length} Dates, Sorted by ${sortBy === "price" ? "Price" : "Date"})`);
  lines.push("");
  lines.push("| Date | Day of Week | Day of Year | Price (EUR) | Rating | Link |");
  lines.push("| :--- | :--- | :---: | :---: | :---: | :--- |");

  for (const f of calendarFlights) {
    const badge = getDealBadge(f.price);
    const dateFormatted = formatDisplayDate(f.date);
    lines.push(`| \`${f.date}\` (${dateFormatted.split(", ")[1]}) | ${f.dayOfWeek} | Day ${f.dayOfYear} | **${currSymbol}${f.price} ${currency}** | ${badge} | [Book ↗](${f.bookingUrl}) |`);
  }
  lines.push("");

  lines.push("---");
  lines.push(`*Prices fetched live from Google Flights API. Real-time availability and airline fares are subject to change.*`);

  return lines.join("\n");
}
