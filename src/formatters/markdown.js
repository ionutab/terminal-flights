/**
 * Markdown Formatter for Flight Prices with Multi-Language Support
 */

import { formatAirportName } from "../data/airports.js";
import { formatDisplayDate, getDayOfWeek, getDayOfWeekIndex } from "../utils/dates.js";
import { getTranslations, t } from "../i18n/translations.js";

/**
 * Calculates statistical metrics from flight results
 * @param {Array<{ price: number, dayOfWeek: string, date: string }>} flights
 * @param {string} [language='en']
 * @returns {object}
 */
export function calculateStatistics(flights, language = "en") {
  if (!flights || flights.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      cheapestFlight: null,
      dayAnalysis: [],
      bestDay: null
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

  // Day of week index aggregation (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  // Re-order starting from Monday (1..6, 0)
  const mondayFirstIndices = [1, 2, 3, 4, 5, 6, 0];
  const dayStats = {};
  for (const idx of mondayFirstIndices) {
    dayStats[idx] = { count: 0, total: 0, min: Infinity, minFlight: null };
  }

  for (const f of flights) {
    const dayIdx = getDayOfWeekIndex(f.date);
    if (dayStats[dayIdx]) {
      dayStats[dayIdx].count++;
      dayStats[dayIdx].total += f.price;
      if (f.price < dayStats[dayIdx].min) {
        dayStats[dayIdx].min = f.price;
        dayStats[dayIdx].minFlight = f;
      }
    }
  }

  const dayAnalysis = mondayFirstIndices
    .filter((idx) => dayStats[idx].count > 0)
    .map((idx) => {
      const count = dayStats[idx].count;
      const dayAvg = Math.round(dayStats[idx].total / count);
      // Sample date for this day of week index to get localized name
      const sampleDate = dayStats[idx].minFlight ? dayStats[idx].minFlight.date : "2026-09-07";
      const localizedDayName = getDayOfWeek(sampleDate, language);

      return {
        dayIndex: idx,
        day: localizedDayName,
        avg: dayAvg,
        min: dayStats[idx].min,
        count,
        minFlight: dayStats[idx].minFlight
      };
    });

  // Best day of week (lowest average price)
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
 * Generates comprehensive GitHub-Flavored Markdown report in the specified language
 * @param {object} data
 * @param {object} [options]
 * @param {number} [options.topN=10]
 * @param {'date'|'price'} [options.sortBy='date']
 * @param {string} [options.language='en']
 * @returns {string}
 */
export function generateMarkdownReport(data, options = {}) {
  const language = options.language || data.language || "en";
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

  const i18n = getTranslations(language);

  if (flights.length === 0) {
    return `# ✈️ ${i18n.reportTitle}: ${origin} ➔ ${destination}\n\n*${i18n.noFlightsFound}*`;
  }

  const stats = calculateStatistics(flights, language);
  const originDisplay = formatAirportName(origin);
  const destDisplay = formatAirportName(destination);
  const currSymbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : `${currency} `;

  // Price thresholds for deal rating
  const p25 = stats.min + (stats.median - stats.min) * 0.5;
  const p75 = stats.median + (stats.max - stats.median) * 0.5;

  const getDealBadge = (price) => {
    if (price <= p25) return i18n.ratingGreat;
    if (price <= p75) return i18n.ratingAverage;
    return i18n.ratingExpensive;
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
  lines.push(`# ✈️ ${i18n.reportTitle}: ${originDisplay} ➔ ${destDisplay}`);
  lines.push("");

  // Metadata Table
  lines.push(`| ${i18n.parameter} | ${i18n.details} |`);
  lines.push("| :--- | :--- |");
  lines.push(`| **${i18n.route}** | \`${origin}\` (${originDisplay}) ➔ \`${destination}\` (${destDisplay}) |`);
  lines.push(`| **${i18n.tripType}** | ${roundTrip ? t(i18n.roundTrip, { days: tripDurationDays }) : i18n.oneWay} |`);
  lines.push(`| **${i18n.flightPreference}** | ${directOnly ? i18n.directOnly : i18n.allFlights} |`);
  lines.push(`| **${i18n.searchRange}** | \`${startDate}\` - \`${endDate}\` (${t(i18n.daysScanned, { count: flights.length })}) |`);
  lines.push(`| **${i18n.currency}** | ${currency} (${currSymbol.trim()}) |`);
  lines.push(`| **${i18n.reportGenerated}** | ${now} |`);
  lines.push("");

  // Key Findings & Summary
  lines.push(`## ${i18n.summaryTitle}`);
  lines.push("");

  const cheapestDay = getDayOfWeek(stats.cheapestFlight.date, language);
  lines.push(
    "- " +
    t(i18n.cheapestTicket, {
      price: `${currSymbol}${stats.cheapestFlight.price} ${currency}`,
      dayOfWeek: cheapestDay,
      date: stats.cheapestFlight.date,
      url: stats.cheapestFlight.bookingUrl
    })
  );

  lines.push(
    "- " +
    t(i18n.priceRange, {
      min: `${currSymbol}${stats.min}`,
      max: `${currSymbol}${stats.max} ${currency}`
    })
  );

  lines.push(
    "- " +
    t(i18n.averagePrice, {
      avg: `${currSymbol}${stats.avg} ${currency}`,
      median: `${currSymbol}${stats.median} ${currency}`
    })
  );

  if (stats.bestDay) {
    lines.push(
      "- " +
      t(i18n.bestDayToFly, {
        day: stats.bestDay.day,
        avg: `${currSymbol}${stats.bestDay.avg} ${currency}`,
        min: `${currSymbol}${stats.bestDay.min} ${currency}`
      })
    );
  }
  lines.push("");

  // Top Deals Table
  const topTitle = t(i18n.topDealsTitle, { count: Math.min(topN, flights.length) });
  lines.push(`## ${topTitle}`);
  lines.push("");
  lines.push(
    `| ${i18n.rank} | ${i18n.date} | ${i18n.dayOfWeek} | ${i18n.dayOfYear} | ${i18n.price} | ${i18n.savingsVsAvg} | ${i18n.bookingLink} |`
  );
  lines.push("| :---: | :--- | :--- | :---: | :---: | :---: | :--- |");

  topCheapest.forEach((f, idx) => {
    const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
    const diff = stats.avg - f.price;
    const pct = stats.avg > 0 ? Math.round((diff / stats.avg) * 100) : 0;
    const savingsStr =
      pct > 0
        ? t(i18n.saveAmount, { pct, diff: `${currSymbol}${diff}` })
        : i18n.averageBadge;

    const dateFormatted = formatDisplayDate(f.date, language);
    const dayName = getDayOfWeek(f.date, language);
    const dayLabel = t(i18n.dayLabel);

    lines.push(
      `| ${rankEmoji} | **${f.date}** (${dateFormatted}) | ${dayName} | ${dayLabel} | **${currSymbol}${f.price} ${currency}** | ${savingsStr} | [${i18n.viewFlight}](${f.bookingUrl}) |`
    );
  });
  lines.push("");

  // Day of Week Analysis
  if (stats.dayAnalysis && stats.dayAnalysis.length > 0) {
    lines.push(`## ${i18n.dayAnalysisTitle}`);
    lines.push("");
    lines.push(
      `| ${i18n.dayOfWeek} | ${i18n.avgPrice} | ${i18n.minPrice} | ${i18n.cheapestDateFound} | ${i18n.flights} | ${i18n.trend} |`
    );
    lines.push("| :--- | :---: | :---: | :--- | :---: | :--- |");

    for (const d of stats.dayAnalysis) {
      const trend = d.avg <= stats.avg ? i18n.trendCheap : i18n.trendExpensive;
      const minDateStr = d.minFlight ? `${d.minFlight.date} (${currSymbol}${d.minFlight.price})` : "-";
      lines.push(
        `| **${d.day}** | ${currSymbol}${d.avg} ${currency} | **${currSymbol}${d.min} ${currency}** | ${minDateStr} | ${d.count} | ${trend} |`
      );
    }
    lines.push("");
  }

  // Full Calendar Table
  const sortByLabel = sortBy === "price" ? i18n.sortByPrice : i18n.sortByDate;
  const calTitle = t(i18n.calendarTitle, {
    count: calendarFlights.length,
    sortBy: sortByLabel
  });
  lines.push(`## ${calTitle}`);
  lines.push("");
  lines.push(
    `| ${i18n.date} | ${i18n.dayOfWeek} | ${i18n.dayOfYear} | ${i18n.price} (${currency}) | ${i18n.rating} | ${i18n.link} |`
  );
  lines.push("| :--- | :--- | :---: | :---: | :---: | :--- |");

  for (const f of calendarFlights) {
    const badge = getDealBadge(f.price);
    const dateFormatted = formatDisplayDate(f.date, language);
    const dayName = getDayOfWeek(f.date, language);
    const dayLabel = t(i18n.dayLabel);

    lines.push(
      `| \`${f.date}\` (${dateFormatted}) | ${dayName} | ${dayLabel} | **${currSymbol}${f.price} ${currency}** | ${badge} | [${i18n.book}](${f.bookingUrl}) |`
    );
  }
  lines.push("");

  lines.push("---");
  lines.push(`*${i18n.footerNote}*`);

  return lines.join("\n");
}
