# ✈️ Quick Plane Prices

A fast and lightweight CLI tool to scan flight prices between two airports over a customizable duration window (`1m` for 1 month, `2m` for 2 months, `3m`, `1w`, `30d`, etc.) and output a clean Markdown report with the cheapest tickets, day of week, day of year, prices in EUR, and direct booking links.

---

## ⚡ Quick Start

### 1. Run Directly

You can run the CLI tool directly from this directory:

```bash
# Basic usage: <origin> <destination> [duration]
./bin/plane-prices.js BER BCN 1m

# Scan 2 months into the future
./bin/plane-prices.js BER BCN 2m

# Or use the global command (if npm linked)
plane-prices BER BCN 1m
```

### 2. Interactive Mode

Run without arguments to start the interactive wizard:

```bash
plane-prices
# or
plane-prices --interactive
```

---

## 📖 CLI Usage & Examples

### Positional Arguments

```bash
plane-prices <origin> <destination> [duration]
```

* **`origin`**: 3-letter IATA code or city name (e.g. `BER`, `LHR`, `JFK`, `Berlin`, `Paris`, `Madrid`).
* **`destination`**: 3-letter IATA code or city name (e.g. `BCN`, `MAD`, `CDG`, `Barcelona`, `Tokyo`, `Rome`).
* **`duration`**: Search window into the future (default: `1m`):
  * `1m` - 1 month (~30 days)
  * `2m` - 2 months (~60 days)
  * `3m` - 3 months (~90 days)
  * `6m` - 6 months (~180 days)
  * `2w` - 2 weeks (14 days)
  * `45d` - 45 days

---

### Examples

#### 1. Scan cheapest flights for next month
```bash
plane-prices BER BCN 1m
```

#### 2. Scan 2 months and save report to a Markdown file
```bash
plane-prices BER BCN 2m -o cheap_flights.md
```

#### 3. Search Round-Trip flights (e.g. 7-day trip duration)
```bash
plane-prices MAD CDG 1m --round-trip --trip-length 7
```

#### 4. Direct / Non-stop flights only
```bash
plane-prices LHR JFK 2m --direct
```

#### 5. Sort calendar table by price (cheapest first) and show top 15
```bash
plane-prices BER BCN 1m --sort price --top 15
```

#### 6. Pipe raw Markdown output to another tool
```bash
plane-prices BER BCN 1m --raw > report.md
```

---

## 🛠️ Command-Line Options

| Option | Shorthand | Description | Default |
| :--- | :---: | :--- | :--- |
| `--from <iata>` | `-f` | Origin airport IATA code or city name | Required |
| `--to <iata>` | `-t` | Destination airport IATA code or city name | Required |
| `--duration <window>` | `-d` | Scan window: `1m`, `2m`, `3m`, `30d`, `60d`, `1w` | `1m` |
| `--start <date>` | `-s` | Start date in `YYYY-MM-DD` | Tomorrow |
| `--round-trip` | `-r` | Search round-trip ticket prices | `false` (One-Way) |
| `--trip-length <days>` | `-l` | Round-trip duration in days | `7` |
| `--direct` | | Filter for direct (non-stop) flights only | `false` |
| `--currency <code>` | `-c` | Currency code (e.g. `EUR`, `USD`, `GBP`) | `EUR` |
| `--output <file>` | `-o` | Save the generated Markdown report to a file | `stdout` |
| `--top <number>` | | Number of cheapest dates highlighted | `10` |
| `--sort <field>` | | Sort complete calendar by `date` or `price` | `date` |
| `--raw` | | Output pure raw Markdown only (no CLI colors/spinners) | `false` |
| `--interactive` | `-i` | Launch interactive wizard | `false` |
| `--help` | `-h` | Display help screen | |

---

## 📊 Markdown Output Features

The generated Markdown output includes:

1. **Route & Search Metadata**: Origin airport, destination, search date window, and currency.
2. **Executive Summary**:
   - 🏆 **Cheapest Ticket**: Price, Date, Day of week, Day of year, and direct booking link.
   - 🏷️ **Price Range**: Min to Max price in EUR.
   - 📈 **Average & Median Prices**.
   - 📅 **Best Day of Week to Fly**: Identifies the statistically cheapest day of the week.
3. **Top Cheapest Dates Table**: Ranked deals with date, day of week, day of year, price in EUR, and percentage saved vs. average.
4. **Day of Week Price Analysis**: Average and minimum prices broken down from Monday to Sunday.
5. **Complete Date-by-Date Price Calendar**: Full breakdown of all dates with Deal Rating badges (`🟢 Great Deal`, `🟡 Average`, `🔴 Expensive`) and direct deep links to Google Flights.

---

## 📁 Project Structure

```
quick-plane-prices/
├── bin/
│   └── plane-prices.js       # CLI executable entry point
├── src/
│   ├── api/
│   │   └── flights.js        # Google Flights RPC client & multi-chunk fetcher
│   ├── data/
│   │   └── airports.js       # Airport IATA & city lookup database
│   ├── formatters/
│   │   └── markdown.js       # Markdown report builder & statistical analyzer
│   └── utils/
│       └── dates.js          # Duration parser, date math, day of year utils
├── test/
│   └── test.js               # Automated test suite
├── index.js                  # Module entrypoint
├── package.json
└── README.md
```

---

## 🧪 Running Tests

Run the included automated test suite:

```bash
npm test
```
