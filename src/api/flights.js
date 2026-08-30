/**
 * Google Flights API Client
 * Reverse-engineers Google Flights RPC for real-time calendar price data.
 */

import { addDays, formatIsoDate, getDayOfWeek, getDayOfYear, parseIsoDate, splitDateRange } from "../utils/dates.js";

const BASE_URL = "https://www.google.com/_/FlightsFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetCalendarGraph";

const USER_AGENTS = [
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Builds Google Flights web deep link
 * @param {string} origin
 * @param {string} dest
 * @param {string} departDate
 * @param {string} [returnDate]
 * @param {string} [currency]
 * @returns {string}
 */
export function buildGoogleFlightsUrl(origin, dest, departDate, returnDate = null, currency = "EUR") {
  let query = `Flights from ${origin} to ${dest} on ${departDate}`;
  if (returnDate) {
    query += ` through ${returnDate}`;
  }
  const params = new URLSearchParams();
  params.set("q", query);
  if (currency) {
    params.set("curr", currency.toUpperCase());
  }
  params.set("hl", "en");
  return `https://www.google.com/travel/flights?${params.toString()}`;
}

/**
 * Encodes the Protobuf/JSON payload for Google Flights GetCalendarGraph
 * @param {object} params
 * @param {string} params.origin
 * @param {string} params.destination
 * @param {string} params.fromDate
 * @param {string} params.toDate
 * @param {boolean} [params.roundTrip]
 * @param {number} [params.tripDurationDays]
 * @param {boolean} [params.directOnly]
 * @returns {string} URL-encoded payload
 */
function encodeRequestPayload({
  origin,
  destination,
  fromDate,
  toDate,
  roundTrip = false,
  tripDurationDays = 7,
  directOnly = false
}) {
  const maxStops = directOnly ? 1 : 0; // 1 = non-stop, 0 = any

  let formattedSegments = [];

  if (!roundTrip) {
    // One-way segment
    const departureBlock = [[[[origin.toUpperCase(), 0]]]];
    const arrivalBlock = [[[[destination.toUpperCase(), 0]]]];
    formattedSegments = [
      [
        departureBlock[0],
        arrivalBlock[0],
        null, // time restrictions
        maxStops,
        null, // airlines include
        null, // airlines exclude
        fromDate,
        null, // max duration
        null,
        null,
        null,
        null,
        null,
        null,
        3
      ]
    ];
  } else {
    // Round-trip segments
    const d1 = parseIsoDate(fromDate);
    const returnTravelDate = formatIsoDate(addDays(d1, tripDurationDays));

    const dep1 = [[[[origin.toUpperCase(), 0]]]];
    const arr1 = [[[[destination.toUpperCase(), 0]]]];
    const dep2 = [[[[destination.toUpperCase(), 0]]]];
    const arr2 = [[[[origin.toUpperCase(), 0]]]];

    formattedSegments = [
      [
        dep1[0],
        arr1[0],
        null,
        maxStops,
        null,
        null,
        fromDate,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        3
      ],
      [
        dep2[0],
        arr2[0],
        null,
        maxStops,
        null,
        null,
        returnTravelDate,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        3
      ]
    ];
  }

  const tripType = roundTrip ? 1 : 2; // 1 = round trip, 2 = one way

  const base = [
    null,
    [
      null,
      null,
      tripType,
      null,
      [],
      1, // economy seat
      [1, 0, 0, 0], // passengers: [adults, children, lap, seat]
      null, // price limit
      null,
      null,
      null, // bags
      null,
      null,
      formattedSegments,
      null,
      null,
      null,
      1
    ],
    [fromDate, toDate]
  ];

  if (roundTrip) {
    base.push(null, [tripDurationDays, tripDurationDays]);
  }

  const formattedJson = JSON.stringify(base);
  const wrapped = [null, formattedJson];
  return encodeURIComponent(JSON.stringify(wrapped));
}

/**
 * Fetches a single chunk of flight prices (up to 60 days)
 * @param {object} options
 * @returns {Promise<Array<{ date: string, returnDate?: string, price: number, currency: string }>>}
 */
async function fetchCalendarChunk({
  origin,
  destination,
  fromDate,
  toDate,
  roundTrip = false,
  tripDurationDays = 7,
  directOnly = false,
  currency = "EUR",
  language = "en",
  retries = 3
}) {
  const encodedPayload = encodeRequestPayload({
    origin,
    destination,
    fromDate,
    toDate,
    roundTrip,
    tripDurationDays,
    directOnly
  });

  const url = `${BASE_URL}?curr=${encodeURIComponent(currency.toUpperCase())}&hl=${encodeURIComponent(language)}&gl=DE`;

  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "user-agent": getRandomUserAgent(),
          "accept-language": "en-US,en;q=0.9",
          "origin": "https://www.google.com",
          "referer": "https://www.google.com/travel/flights"
        },
        body: `f.req=${encodedPayload}`,
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      const clean = text.replace(/^\)\]\}\x27\s*/, "");
      const outer = JSON.parse(clean);

      const results = [];
      for (const row of outer) {
        if (Array.isArray(row) && row[0] === "wrb.fr" && typeof row[2] === "string") {
          const inner = JSON.parse(row[2]);
          const items = inner[inner.length - 1];

          if (Array.isArray(items)) {
            for (const item of items) {
              if (!Array.isArray(item) || item.length < 3) continue;

              const departDate = item[0];
              const returnDate = roundTrip ? item[1] : undefined;

              // Parse price from item[2][0][1]
              let price = null;
              if (Array.isArray(item[2]) && item[2].length > 0) {
                const priceWrapper = item[2][0];
                if (Array.isArray(priceWrapper) && priceWrapper.length >= 2) {
                  price = priceWrapper[1];
                }
              }

              if (typeof price === "number" && price > 0 && typeof departDate === "string") {
                results.push({
                  date: departDate,
                  returnDate,
                  price,
                  currency: currency.toUpperCase()
                });
              }
            }
          }
        }
      }

      return results;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }

  throw new Error(`Failed to fetch flight prices for ${origin} -> ${destination} (${fromDate} to ${toDate}): ${lastError?.message}`);
}

/**
 * Main search function: searches flight prices for arbitrary duration with automatic chunking
 * @param {object} options
 * @param {string} options.origin - Origin airport IATA code (e.g. "BER")
 * @param {string} options.destination - Destination airport IATA code (e.g. "BCN")
 * @param {Date} [options.startDate] - Search start date (default: tomorrow)
 * @param {number} [options.durationDays] - Search duration window in days (default: 30)
 * @param {boolean} [options.roundTrip] - Whether to search round trip (default: false)
 * @param {number} [options.tripDurationDays] - Round-trip duration in days (default: 7)
 * @param {boolean} [options.directOnly] - Filter for direct flights only (default: false)
 * @param {string} [options.currency] - Currency (default: "EUR")
 * @param {function} [options.onProgress] - Optional progress callback
 * @returns {Promise<{
 *   origin: string,
 *   destination: string,
 *   startDate: string,
 *   endDate: string,
 *   roundTrip: boolean,
 *   tripDurationDays: number,
 *   currency: string,
 *   directOnly: boolean,
 *   flights: Array<{
 *     date: string,
 *     returnDate?: string,
 *     dayOfWeek: string,
 *     dayOfYear: number,
 *     price: number,
 *     currency: string,
 *     bookingUrl: string
 *   }>
 * }>}
 */
export async function searchFlightPrices({
  origin,
  destination,
  startDate = null,
  durationDays = 30,
  roundTrip = false,
  tripDurationDays = 7,
  directOnly = false,
  currency = "EUR",
  onProgress = null
}) {
  const orig = origin.trim().toUpperCase();
  const dest = destination.trim().toUpperCase();

  // Start date defaults to tomorrow
  const start = startDate ? new Date(startDate.getTime()) : addDays(new Date(), 1);
  const end = addDays(start, durationDays);

  const chunks = splitDateRange(start, end, 55); // Use 55-day chunks for safety

  if (onProgress) {
    onProgress({ totalChunks: chunks.length, completedChunks: 0 });
  }

  const chunkPromises = chunks.map(async (chunk, index) => {
    const results = await fetchCalendarChunk({
      origin: orig,
      destination: dest,
      fromDate: chunk.from,
      toDate: chunk.to,
      roundTrip,
      tripDurationDays,
      directOnly,
      currency
    });

    if (onProgress) {
      onProgress({ totalChunks: chunks.length, completedChunks: index + 1 });
    }

    return results;
  });

  const chunkResults = await Promise.all(chunkPromises);

  // Flatten and deduplicate by departure date
  const dateMap = new Map();
  for (const chunkList of chunkResults) {
    for (const item of chunkList) {
      if (!dateMap.has(item.date) || item.price < dateMap.get(item.date).price) {
        dateMap.set(item.date, item);
      }
    }
  }

  // Sort chronologically
  const sortedRaw = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Enrich with day of week, day of year, booking URL
  const enriched = sortedRaw.map((item) => {
    const dayOfWeek = getDayOfWeek(item.date);
    const dayOfYear = getDayOfYear(item.date);
    const bookingUrl = buildGoogleFlightsUrl(
      orig,
      dest,
      item.date,
      item.returnDate,
      currency
    );

    return {
      date: item.date,
      returnDate: item.returnDate,
      dayOfWeek,
      dayOfYear,
      price: item.price,
      currency: item.currency,
      bookingUrl
    };
  });

  return {
    origin: orig,
    destination: dest,
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
    durationDays,
    roundTrip,
    tripDurationDays,
    currency: currency.toUpperCase(),
    directOnly,
    flights: enriched
  };
}
