/**
 * Major international and regional airport lookup database
 */
export const AIRPORTS = {
  // Europe
  BER: { name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany" },
  FRA: { name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  MUC: { name: "Munich Airport", city: "Munich", country: "Germany" },
  HAM: { name: "Hamburg Airport", city: "Hamburg", country: "Germany" },
  DUS: { name: "Dusseldorf Airport", city: "Dusseldorf", country: "Germany" },
  CGN: { name: "Cologne Bonn Airport", city: "Cologne", country: "Germany" },
  STR: { name: "Stuttgart Airport", city: "Stuttgart", country: "Germany" },
  LHR: { name: "Heathrow Airport", city: "London", country: "United Kingdom" },
  LGW: { name: "Gatwick Airport", city: "London", country: "United Kingdom" },
  STN: { name: "Stansted Airport", city: "London", country: "United Kingdom" },
  LTN: { name: "Luton Airport", city: "London", country: "United Kingdom" },
  MAN: { name: "Manchester Airport", city: "Manchester", country: "United Kingdom" },
  EDI: { name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom" },
  CDG: { name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
  ORY: { name: "Orly Airport", city: "Paris", country: "France" },
  NCE: { name: "Nice Cote d'Azur Airport", city: "Nice", country: "France" },
  LYS: { name: "Lyon-Saint Exupery Airport", city: "Lyon", country: "France" },
  BCN: { name: "Josep Tarradellas Barcelona-El Prat", city: "Barcelona", country: "Spain" },
  MAD: { name: "Adolfo Suarez Madrid-Barajas", city: "Madrid", country: "Spain" },
  AGP: { name: "Malaga Airport", city: "Malaga", country: "Spain" },
  PMI: { name: "Palma de Mallorca Airport", city: "Palma de Mallorca", country: "Spain" },
  ALC: { name: "Alicante-Elche Airport", city: "Alicante", country: "Spain" },
  VLC: { name: "Valencia Airport", city: "Valencia", country: "Spain" },
  SVQ: { name: "Seville Airport", city: "Seville", country: "Spain" },
  FCO: { name: "Leonardo da Vinci-Fiumicino Airport", city: "Rome", country: "Italy" },
  MXP: { name: "Milan Malpensa Airport", city: "Milan", country: "Italy" },
  LIN: { name: "Milan Linate Airport", city: "Milan", country: "Italy" },
  BGY: { name: "Orio al Serio (Bergamo)", city: "Milan/Bergamo", country: "Italy" },
  VCE: { name: "Venice Marco Polo Airport", city: "Venice", country: "Italy" },
  NAP: { name: "Naples International Airport", city: "Naples", country: "Italy" },
  AMS: { name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands" },
  EIN: { name: "Eindhoven Airport", city: "Eindhoven", country: "Netherlands" },
  BRU: { name: "Brussels Airport", city: "Brussels", country: "Belgium" },
  CRL: { name: "Brussels South Charleroi", city: "Brussels/Charleroi", country: "Belgium" },
  VIE: { name: "Vienna International Airport", city: "Vienna", country: "Austria" },
  ZRH: { name: "Zurich Airport", city: "Zurich", country: "Switzerland" },
  GVA: { name: "Geneva Airport", city: "Geneva", country: "Switzerland" },
  BSL: { name: "EuroAirport Basel Mulhouse Freiburg", city: "Basel", country: "Switzerland" },
  LIS: { name: "Humberto Delgado Airport", city: "Lisbon", country: "Portugal" },
  OPO: { name: "Francisco Sa Carneiro Airport", city: "Porto", country: "Portugal" },
  FAO: { name: "Faro Airport", city: "Faro", country: "Portugal" },
  ATH: { name: "Athens International Airport", city: "Athens", country: "Greece" },
  HER: { name: "Heraklion Airport", city: "Heraklion/Crete", country: "Greece" },
  SKG: { name: "Thessaloniki Airport", city: "Thessaloniki", country: "Greece" },
  DUB: { name: "Dublin Airport", city: "Dublin", country: "Ireland" },
  CPH: { name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark" },
  ARN: { name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden" },
  OSL: { name: "Oslo Airport Gardermoen", city: "Oslo", country: "Norway" },
  HEL: { name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland" },
  WAW: { name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland" },
  KRK: { name: "Krakow John Paul II Airport", city: "Krakow", country: "Poland" },
  PRG: { name: "Vaclav Havel Airport Prague", city: "Prague", country: "Czech Republic" },
  BUD: { name: "Budapest Ferenc Liszt Airport", city: "Budapest", country: "Hungary" },
  OTP: { name: "Henri Coanda International Airport", city: "Bucharest", country: "Romania" },
  SOF: { name: "Sofia Airport", city: "Sofia", country: "Bulgaria" },
  ZAG: { name: "Zagreb Airport", city: "Zagreb", country: "Croatia" },
  SPU: { name: "Split Airport", city: "Split", country: "Croatia" },
  DBV: { name: "Dubrovnik Airport", city: "Dubrovnik", country: "Croatia" },
  BEG: { name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "Serbia" },
  IST: { name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
  SAW: { name: "Sabiha Gokcen Airport", city: "Istanbul", country: "Turkey" },
  AYT: { name: "Antalya Airport", city: "Antalya", country: "Turkey" },
  ADB: { name: "Izmir Adnan Menderes Airport", city: "Izmir", country: "Turkey" },
  LCA: { name: "Larnaca International Airport", city: "Larnaca", country: "Cyprus" },
  MLA: { name: "Malta International Airport", city: "Luqa/Valletta", country: "Malta" },
  KEF: { name: "Keflavik International Airport", city: "Reykjavik", country: "Iceland" },

  // North America
  JFK: { name: "John F. Kennedy International Airport", city: "New York", country: "United States" },
  EWR: { name: "Newark Liberty International Airport", city: "New York/Newark", country: "United States" },
  LGA: { name: "LaGuardia Airport", city: "New York", country: "United States" },
  LAX: { name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
  ORD: { name: "O'Hare International Airport", city: "Chicago", country: "United States" },
  MDW: { name: "Chicago Midway International Airport", city: "Chicago", country: "United States" },
  MIA: { name: "Miami International Airport", city: "Miami", country: "United States" },
  FLL: { name: "Fort Lauderdale-Hollywood Airport", city: "Fort Lauderdale", country: "United States" },
  SFO: { name: "San Francisco International Airport", city: "San Francisco", country: "United States" },
  OAK: { name: "Oakland International Airport", city: "Oakland/SF", country: "United States" },
  BOS: { name: "Logan International Airport", city: "Boston", country: "United States" },
  SEA: { name: "Seattle-Tacoma International Airport", city: "Seattle", country: "United States" },
  ATL: { name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States" },
  DFW: { name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States" },
  DEN: { name: "Denver International Airport", city: "Denver", country: "United States" },
  LAS: { name: "Harry Reid International Airport", city: "Las Vegas", country: "United States" },
  PHX: { name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States" },
  IAH: { name: "George Bush Intercontinental Airport", city: "Houston", country: "United States" },
  HOU: { name: "William P. Hobby Airport", city: "Houston", country: "United States" },
  MCO: { name: "Orlando International Airport", city: "Orlando", country: "United States" },
  TPA: { name: "Tampa International Airport", city: "Tampa", country: "United States" },
  SAN: { name: "San Diego International Airport", city: "San Diego", country: "United States" },
  IAD: { name: "Washington Dulles International Airport", city: "Washington, D.C.", country: "United States" },
  DCA: { name: "Ronald Reagan Washington National Airport", city: "Washington, D.C.", country: "United States" },
  BWI: { name: "Baltimore/Washington International Airport", city: "Baltimore/DC", country: "United States" },
  PHL: { name: "Philadelphia International Airport", city: "Philadelphia", country: "United States" },
  DTW: { name: "Detroit Metropolitan Wayne County Airport", city: "Detroit", country: "United States" },
  MSP: { name: "Minneapolis-Saint Paul Airport", city: "Minneapolis", country: "United States" },
  YYZ: { name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada" },
  YVR: { name: "Vancouver International Airport", city: "Vancouver", country: "Canada" },
  YUL: { name: "Montreal-Trudeau International Airport", city: "Montreal", country: "Canada" },
  MEX: { name: "Mexico City International Airport", city: "Mexico City", country: "Mexico" },
  CUN: { name: "Cancun International Airport", city: "Cancun", country: "Mexico" },

  // Asia & Middle East
  DXB: { name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
  AUH: { name: "Zayed International Airport", city: "Abu Dhabi", country: "United Arab Emirates" },
  DOH: { name: "Hamad International Airport", city: "Doha", country: "Qatar" },
  HND: { name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan" },
  NRT: { name: "Narita International Airport", city: "Tokyo", country: "Japan" },
  KIX: { name: "Kansai International Airport", city: "Osaka", country: "Japan" },
  ICN: { name: "Incheon International Airport", city: "Seoul", country: "South Korea" },
  SIN: { name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  BKK: { name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  DMK: { name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand" },
  HKT: { name: "Phuket International Airport", city: "Phuket", country: "Thailand" },
  KUL: { name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia" },
  DPS: { name: "Ngurah Rai (Bali) International Airport", city: "Bali/Denpasar", country: "Indonesia" },
  CGK: { name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia" },
  HKG: { name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong" },
  TPE: { name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan" },
  PEK: { name: "Beijing Capital International Airport", city: "Beijing", country: "China" },
  PKX: { name: "Beijing Daxing International Airport", city: "Beijing", country: "China" },
  PVG: { name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China" },
  CAN: { name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China" },
  DEL: { name: "Indira Gandhi International Airport", city: "Delhi", country: "India" },
  BOM: { name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India" },
  BLR: { name: "Kempegowda International Airport", city: "Bengaluru", country: "India" },
  MAA: { name: "Chennai International Airport", city: "Chennai", country: "India" },
  TLV: { name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel" },

  // South America, Africa & Oceania
  GRU: { name: "Sao Paulo-Guarulhos International Airport", city: "Sao Paulo", country: "Brazil" },
  GIG: { name: "Rio de Janeiro-Galeao International Airport", city: "Rio de Janeiro", country: "Brazil" },
  EZE: { name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina" },
  SCL: { name: "Arturo Merino Benitez International Airport", city: "Santiago", country: "Chile" },
  BOG: { name: "El Dorado International Airport", city: "Bogota", country: "Colombia" },
  LIM: { name: "Jorge Chavez International Airport", city: "Lima", country: "Peru" },
  CAI: { name: "Cairo International Airport", city: "Cairo", country: "Egypt" },
  JNB: { name: "O. R. Tambo International Airport", city: "Johannesburg", country: "South Africa" },
  CPT: { name: "Cape Town International Airport", city: "Cape Town", country: "South Africa" },
  RAK: { name: "Marrakesh Menara Airport", city: "Marrakesh", country: "Morocco" },
  SYD: { name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia" },
  MEL: { name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
  BNE: { name: "Brisbane Airport", city: "Brisbane", country: "Australia" },
  AKL: { name: "Auckland Airport", city: "Auckland", country: "New Zealand" }
};

/**
 * Resolves an airport query (IATA code, city name, or airport name)
 * @param {string} query
 * @returns {{ code: string, name: string, city: string, country: string }}
 */
export function resolveAirport(query) {
  if (!query || typeof query !== "string") {
    throw new Error("Airport code or name is required");
  }

  const clean = query.trim().toUpperCase();

  // Direct 3-letter IATA match in database
  if (AIRPORTS[clean]) {
    return { code: clean, ...AIRPORTS[clean] };
  }

  // If 3 letters, assume it is a valid IATA code even if not in our predefined list
  if (/^[A-Z]{3}$/.test(clean)) {
    return { code: clean, name: `${clean} Airport`, city: clean, country: "" };
  }

  // Search by city name or airport name
  const queryLower = query.trim().toLowerCase();
  for (const [code, info] of Object.entries(AIRPORTS)) {
    if (
      info.city.toLowerCase() === queryLower ||
      info.city.toLowerCase().includes(queryLower) ||
      info.name.toLowerCase().includes(queryLower)
    ) {
      return { code, ...info };
    }
  }

  // If 3 letters with spaces/characters
  const alpha3 = query.trim().replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  if (alpha3.length === 3) {
    if (AIRPORTS[alpha3]) {
      return { code: alpha3, ...AIRPORTS[alpha3] };
    }
    return { code: alpha3, name: `${alpha3} Airport`, city: alpha3, country: "" };
  }

  throw new Error(`Could not find airport for: "${query}". Please enter a 3-letter IATA code (e.g. BER, BCN, LHR, JFK).`);
}

/**
 * Formats airport for display: "Berlin (BER)" or "BCN"
 * @param {string} code
 * @returns {string}
 */
export function formatAirportName(code) {
  const c = (code || "").toUpperCase();
  if (AIRPORTS[c]) {
    return `${AIRPORTS[c].city} (${c})`;
  }
  return c;
}
