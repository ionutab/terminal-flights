/**
 * Date calculation and parsing utilities
 */

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/**
 * Format a Date object to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatIsoDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a UTC Date object
 * @param {string} isoStr
 * @returns {Date}
 */
export function parseIsoDate(isoStr) {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Add days to a Date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const res = new Date(date.getTime());
  res.setUTCDate(res.getUTCDate() + days);
  return res;
}

/**
 * Add months to a Date
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
export function addMonths(date, months) {
  const res = new Date(date.getTime());
  res.setUTCMonth(res.getUTCMonth() + months);
  return res;
}

/**
 * Get day name from date string or Date
 * @param {string|Date} d
 * @returns {string}
 */
export function getDayOfWeek(d) {
  const date = typeof d === "string" ? parseIsoDate(d) : d;
  return DAY_NAMES[date.getUTCDay()];
}

/**
 * Format date for friendly display (e.g. "Fri, 18 Sep 2026")
 * @param {string|Date} d
 * @returns {string}
 */
export function formatDisplayDate(d) {
  const date = typeof d === "string" ? parseIsoDate(d) : d;
  const dayName = DAY_NAMES[date.getUTCDay()].slice(0, 3);
  const dayNum = String(date.getUTCDate()).padStart(2, "0");
  const monthName = MONTH_SHORT[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Calculate day of year (e.g. "Day 261 of 2026")
 * @param {string|Date} d
 * @returns {number}
 */
export function getDayOfYear(d) {
  const date = typeof d === "string" ? parseIsoDate(d) : d;
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date.getTime() - startOfYear.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Parse duration string (e.g. "1m", "2m", "3m", "6m", "1w", "30d", "60d")
 * Returns number of days
 * @param {string|number} input
 * @returns {{ days: number, label: string }}
 */
export function parseDuration(input) {
  if (!input) {
    return { days: 30, label: "1 month (30 days)" };
  }

  const str = String(input).trim().toLowerCase();

  // Match months: e.g. "1m", "2m", "3months", "1month", "2 mon"
  const monthMatch = str.match(/^(\d+)\s*(?:m|mo|mon|month|months)$/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    const days = Math.round(months * 30.5);
    return {
      days,
      months,
      label: `${months} month${months > 1 ? "s" : ""} (~${days} days)`
    };
  }

  // Match weeks: e.g. "1w", "2w", "3weeks"
  const weekMatch = str.match(/^(\d+)\s*(?:w|wk|wks|week|weeks)$/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    const days = weeks * 7;
    return {
      days,
      weeks,
      label: `${weeks} week${weeks > 1 ? "s" : ""} (${days} days)`
    };
  }

  // Match days: e.g. "14d", "30d", "60days", "45"
  const dayMatch = str.match(/^(\d+)\s*(?:d|day|days)?$/);
  if (dayMatch) {
    const val = parseInt(dayMatch[1], 10);
    // If small number <= 12 and no unit specified, assume months
    if (!str.endsWith("d") && !str.endsWith("day") && !str.endsWith("days") && val <= 12) {
      const days = Math.round(val * 30.5);
      return {
        days,
        months: val,
        label: `${val} month${val > 1 ? "s" : ""} (~${days} days)`
      };
    }
    return {
      days: val,
      label: `${val} days`
    };
  }

  throw new Error(`Invalid duration format: "${input}". Examples: "1m" (1 month), "2m" (2 months), "30d" (30 days), "2w" (2 weeks).`);
}

/**
 * Split a large date range into chunks of up to maxChunkDays (Google Flights max is 60)
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number} maxChunkDays
 * @returns {Array<{ from: string, to: string, fromDate: Date, toDate: Date }>}
 */
export function splitDateRange(startDate, endDate, maxChunkDays = 60) {
  const chunks = [];
  let currentFrom = new Date(startDate.getTime());

  while (currentFrom < endDate) {
    let currentTo = addDays(currentFrom, maxChunkDays - 1);
    if (currentTo > endDate) {
      currentTo = new Date(endDate.getTime());
    }

    chunks.push({
      from: formatIsoDate(currentFrom),
      to: formatIsoDate(currentTo),
      fromDate: new Date(currentFrom.getTime()),
      toDate: new Date(currentTo.getTime())
    });

    currentFrom = addDays(currentTo, 1);
  }

  return chunks;
}
