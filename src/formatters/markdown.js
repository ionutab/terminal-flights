/**
 * Markdown Formatter for Flight Prices with Multi-Language Support, Optional Links, and Pretty Column Alignment
 */

import { formatAirportName } from "../data/airports.js";
import { formatDisplayDate, getDayOfWeek, getDayOfWeekIndex } from "../utils/dates.js";
import { getTranslations, t } from "../i18n/translations.js";

/**
 * Formats a GitHub-Flavored Markdown table with vertically aligned column borders
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {('left'|'center'|'right')[]} [alignments=[]]
 * @returns {string}
 */
export function formatMarkdownTable(headers, rows, alignments = []) {
  if (!headers || headers.length === 0) return "";

  // Compute maximum width for each column across headers and all rows
  const colWidths = headers.map((h, i) => {
    let max = (h || "").length;
    for (const row of rows) {
      if (row && row[i] !== undefined) {
        max = Math.max(max, String(row[i]).length);
      }
    }
    return Math.max(max, 3);
  });

  const padCell = (content, width, align = "left") => {
    const str = content === null || content === undefined ? "" : String(content);
    const pad = Math.max(0, width - str.length);
    if (align === "right") {
      return " ".repeat(pad) + str;
    }
    if (align === "center") {
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return " ".repeat(left) + str + " ".repeat(right);
    }
    return str + " ".repeat(pad);
  };

  const formatSeparator = (width, align = "left") => {
    const innerWidth = Math.max(3, width);
    if (align === "center") {
      return ":" + "-".repeat(Math.max(1, innerWidth - 2)) + ":";
    }
    if (align === "right") {
      return "-".repeat(Math.max(1, innerWidth - 1)) + ":";
    }
    return ":" + "-".repeat(Math.max(1, innerWidth - 1));
  };

  const headerLine = `| ${headers.map((h, i) => padCell(h, colWidths[i], alignments[i] || "left")).join(" | ")} |`;
  const separatorLine = `| ${headers.map((_, i) => formatSeparator(colWidths[i], alignments[i] || "left")).join(" | ")} |`;
  const rowLines = rows.map(
    (row) => `| ${headers.map((_, i) => padCell(row[i] || "", colWidths[i], alignments[i] || "left")).join(" | ")} |`
  );

  return [headerLine, separatorLine, ...rowLines].join("\n");
}

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
 * @param {boolean} [options.showLinks=false] - Only include Google Flights links when explicitly enabled
 * @returns {string}
 */
export function generateMarkdownReport(data, options = {}) {
  const language = options.language || data.language || "en";
  const showLinks = options.showLinks ?? options.googleFlights ?? options.links ?? false;
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

  // 1. Metadata Table
  const metaHeaders = [i18n.parameter, i18n.details];
  const metaRows = [
    [`**${i18n.route}**`, `\`${origin}\` (${originDisplay}) ➔ \`${destination}\` (${destDisplay})`],
    [`**${i18n.tripType}**`, roundTrip ? t(i18n.roundTrip, { days: tripDurationDays }) : i18n.oneWay],
    [`**${i18n.flightPreference}**`, directOnly ? i18n.directOnly : i18n.allFlights],
    [`**${i18n.searchRange}**`, `\`${startDate}\` - \`${endDate}\` (${t(i18n.daysScanned, { count: flights.length })})`],
    [`**${i18n.currency}**`, `${currency} (${currSymbol.trim()})`],
    [`**${i18n.reportGenerated}**`, now]
  ];
  lines.push(formatMarkdownTable(metaHeaders, metaRows, ["left", "left"]));
  lines.push("");

  // 2. Key Findings & Summary
  lines.push(`## ${i18n.summaryTitle}`);
  lines.push("");

  const cheapestDay = getDayOfWeek(stats.cheapestFlight.date, language);
  let cheapestLine =
    "- " +
    t(i18n.cheapestTicket, {
      price: `${currSymbol}${stats.cheapestFlight.price} ${currency}`,
      dayOfWeek: cheapestDay,
      date: stats.cheapestFlight.date
    });

  if (showLinks && stats.cheapestFlight.bookingUrl) {
    cheapestLine += ` — [${i18n.bookOnGoogleFlights}](${stats.cheapestFlight.bookingUrl})`;
  }
  lines.push(cheapestLine);

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

  // 3. Top Deals Table
  const topTitle = t(i18n.topDealsTitle, { count: Math.min(topN, flights.length) });
  lines.push(`## ${topTitle}`);
  lines.push("");

  const topHeaders = showLinks
    ? [i18n.rank, i18n.date, i18n.dayOfWeek, i18n.price, i18n.savingsVsAvg, i18n.bookingLink]
    : [i18n.rank, i18n.date, i18n.dayOfWeek, i18n.price, i18n.savingsVsAvg];

  const topAlignments = showLinks
    ? ["center", "left", "left", "center", "left", "left"]
    : ["center", "left", "left", "center", "left"];

  const topRows = topCheapest.map((f, idx) => {
    const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
    const diff = stats.avg - f.price;
    const pct = stats.avg > 0 ? Math.round((diff / stats.avg) * 100) : 0;
    const savingsStr =
      pct > 0
        ? t(i18n.saveAmount, { pct, diff: `${currSymbol}${diff}` })
        : i18n.averageBadge;

    const dayName = getDayOfWeek(f.date, language);

    if (showLinks) {
      return [
        rankEmoji,
        `**${f.date}**`,
        dayName,
        `**${currSymbol}${f.price} ${currency}**`,
        savingsStr,
        `[${i18n.viewFlight}](${f.bookingUrl})`
      ];
    }
    return [
      rankEmoji,
      `**${f.date}**`,
      dayName,
      `**${currSymbol}${f.price} ${currency}**`,
      savingsStr
    ];
  });

  lines.push(formatMarkdownTable(topHeaders, topRows, topAlignments));
  lines.push("");

  // 4. Day of Week Analysis
  if (stats.dayAnalysis && stats.dayAnalysis.length > 0) {
    lines.push(`## ${i18n.dayAnalysisTitle}`);
    lines.push("");

    const dayHeaders = [
      i18n.dayOfWeek,
      i18n.avgPrice,
      i18n.minPrice,
      i18n.cheapestDateFound,
      i18n.flights,
      i18n.trend
    ];
    const dayAlignments = ["left", "center", "center", "left", "center", "left"];
    const dayRows = stats.dayAnalysis.map((d) => {
      const trend = d.avg <= stats.avg ? i18n.trendCheap : i18n.trendExpensive;
      const minDateStr = d.minFlight ? `${d.minFlight.date} (${currSymbol}${d.minFlight.price})` : "-";
      return [
        `**${d.day}**`,
        `${currSymbol}${d.avg} ${currency}`,
        `**${currSymbol}${d.min} ${currency}**`,
        minDateStr,
        `${d.count}`,
        trend
      ];
    });

    lines.push(formatMarkdownTable(dayHeaders, dayRows, dayAlignments));
    lines.push("");
  }

  // 5. Full Calendar Table
  const sortByLabel = sortBy === "price" ? i18n.sortByPrice : i18n.sortByDate;
  const calTitle = t(i18n.calendarTitle, {
    count: calendarFlights.length,
    sortBy: sortByLabel
  });
  lines.push(`## ${calTitle}`);
  lines.push("");

  const calHeaders = showLinks
    ? [i18n.date, i18n.dayOfWeek, `${i18n.price} (${currency})`, i18n.rating, i18n.link]
    : [i18n.date, i18n.dayOfWeek, `${i18n.price} (${currency})`, i18n.rating];

  const calAlignments = showLinks
    ? ["left", "left", "center", "center", "left"]
    : ["left", "left", "center", "center"];

  const calRows = calendarFlights.map((f) => {
    const badge = getDealBadge(f.price);
    const dayName = getDayOfWeek(f.date, language);

    if (showLinks) {
      return [
        `\`${f.date}\``,
        dayName,
        `**${currSymbol}${f.price} ${currency}**`,
        badge,
        `[${i18n.book}](${f.bookingUrl})`
      ];
    }
    return [
      `\`${f.date}\``,
      dayName,
      `**${currSymbol}${f.price} ${currency}**`,
      badge
    ];
  });

  lines.push(formatMarkdownTable(calHeaders, calRows, calAlignments));
  lines.push("");

  lines.push("---");
  lines.push(`*${i18n.footerNote}*`);

  return lines.join("\n");
}
