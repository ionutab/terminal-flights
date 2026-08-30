#!/usr/bin/env node

/**
 * Quick Plane Prices CLI
 * Fast command line tool to compare airplane ticket prices and generate Markdown reports.
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "node:fs/promises";
import path from "node:path";
import { input, select, confirm } from "@inquirer/prompts";

import { searchFlightPrices } from "../src/api/flights.js";
import { resolveAirport, formatAirportName } from "../src/data/airports.js";
import { parseDuration, parseIsoDate } from "../src/utils/dates.js";
import { generateMarkdownReport, calculateStatistics } from "../src/formatters/markdown.js";

const program = new Command();

program
  .name("plane-prices")
  .description("Find cheapest flight prices across a duration window and output Markdown")
  .version("1.0.0")
  .argument("[origin]", "Origin airport IATA code or city (e.g. BER, London, JFK)")
  .argument("[destination]", "Destination airport IATA code or city (e.g. BCN, Madrid, LAX)")
  .argument("[duration]", "Duration window to scan: 1m (1 month), 2m (2 months), 3m, 30d, 1w (default: 1m)")
  .option("-f, --from <iata>", "Origin airport IATA code or city")
  .option("-t, --to <iata>", "Destination airport IATA code or city")
  .option("-d, --duration <duration>", "Duration window: 1m, 2m, 3m, 30d, 60d, 1w")
  .option("-s, --start <date>", "Start date in YYYY-MM-DD (default: tomorrow)")
  .option("-r, --round-trip", "Search round-trip tickets", false)
  .option("-l, --trip-length <days>", "Round-trip duration in days", "7")
  .option("--direct", "Direct flights only", false)
  .option("-c, --currency <code>", "Currency code (default: EUR)", "EUR")
  .option("-o, --output <file>", "Save markdown output to a file")
  .option("--top <number>", "Number of top cheapest dates to highlight", "10")
  .option("--sort <field>", "Sort table by 'date' or 'price'", "date")
  .option("--raw", "Output pure raw markdown only (for piping/scripts)", false)
  .option("-i, --interactive", "Run in interactive wizard mode", false);

program.parse(process.argv);

const options = program.opts();
const args = program.args;

async function runInteractive() {
  console.log(chalk.bold.cyan("\n✈️  Quick Plane Prices — Route & Price Finder\n"));

  const originInput = await input({
    message: "Origin airport (IATA code or city, e.g. BER, London, JFK):",
    validate: (val) => (val.trim().length > 0 ? true : "Origin is required")
  });

  const destInput = await input({
    message: "Destination airport (IATA code or city, e.g. BCN, Madrid, LAX):",
    validate: (val) => (val.trim().length > 0 ? true : "Destination is required")
  });

  const durationChoice = await select({
    message: "Search duration window into the future:",
    choices: [
      { name: "1 Month (~30 days)", value: "1m" },
      { name: "2 Months (~60 days)", value: "2m" },
      { name: "3 Months (~90 days)", value: "3m" },
      { name: "6 Months (~180 days)", value: "6m" },
      { name: "2 Weeks (14 days)", value: "2w" },
      { name: "Custom", value: "custom" }
    ]
  });

  let durationVal = durationChoice;
  if (durationChoice === "custom") {
    durationVal = await input({
      message: "Enter custom duration (e.g. 45d, 4m, 3w):",
      default: "1m"
    });
  }

  const tripTypeChoice = await select({
    message: "Trip type:",
    choices: [
      { name: "One-Way", value: "oneway" },
      { name: "Round-Trip", value: "roundtrip" }
    ]
  });

  let roundTrip = false;
  let tripLength = 7;
  if (tripTypeChoice === "roundtrip") {
    roundTrip = true;
    const lenInput = await input({
      message: "Round-trip stay length in days:",
      default: "7"
    });
    tripLength = parseInt(lenInput, 10) || 7;
  }

  const directOnly = await confirm({
    message: "Direct flights only?",
    default: false
  });

  const saveFile = await confirm({
    message: "Save output to a markdown file?",
    default: false
  });

  let outputFile = null;
  if (saveFile) {
    outputFile = await input({
      message: "File path:",
      default: `prices_${originInput.trim().toUpperCase()}_${destInput.trim().toUpperCase()}.md`
    });
  }

  return {
    origin: originInput,
    destination: destInput,
    duration: durationVal,
    roundTrip,
    tripLength,
    directOnly,
    outputFile,
    currency: "EUR"
  };
}

async function main() {
  try {
    let originStr = options.from || args[0];
    let destStr = options.to || args[1];
    let durationStr = options.duration || args[2];
    let roundTrip = options.roundTrip;
    let tripLength = parseInt(options.tripLength, 10) || 7;
    let directOnly = options.direct;
    let currency = options.currency || "EUR";
    let outputFile = options.output;
    let isInteractive = options.interactive;

    // Check if interactive mode is needed
    const isTty = process.stdout.isTTY;
    if (isInteractive || (!originStr && !destStr && isTty)) {
      const answers = await runInteractive();
      originStr = answers.origin;
      destStr = answers.destination;
      durationStr = answers.duration;
      roundTrip = answers.roundTrip;
      tripLength = answers.tripLength;
      directOnly = answers.directOnly;
      if (answers.outputFile) {
        outputFile = answers.outputFile;
      }
    }

    if (!originStr || !destStr) {
      console.error(chalk.red("Error: Both origin and destination airports are required."));
      console.log(chalk.yellow("\nUsage:"));
      console.log("  plane-prices <origin> <destination> [duration]");
      console.log("  plane-prices BER BCN 1m");
      console.log("  plane-prices BER BCN 2m --round-trip -l 7");
      console.log("  plane-prices --interactive");
      process.exit(1);
    }

    // Resolve airports
    const originResolved = resolveAirport(originStr);
    const destResolved = resolveAirport(destStr);

    // Parse duration
    const parsedDur = parseDuration(durationStr || "1m");

    // Start date
    let startDate = null;
    if (options.start) {
      startDate = parseIsoDate(options.start);
    }

    const isRaw = options.raw || !isTty;
    let spinner = null;

    if (!isRaw) {
      const routeLabel = `${formatAirportName(originResolved.code)} ➔ ${formatAirportName(destResolved.code)}`;
      const tripLabel = roundTrip ? `Round-trip (${tripLength}d)` : "One-way";
      console.log(chalk.bold(`\n🛫 Route: ${chalk.cyan(routeLabel)}`));
      console.log(chalk.dim(`📅 Window: ${parsedDur.label} | ${tripLabel} | Currency: ${currency}\n`));

      spinner = ora(`Fetching live flight prices from Google Flights...`).start();
    }

    const results = await searchFlightPrices({
      origin: originResolved.code,
      destination: destResolved.code,
      startDate,
      durationDays: parsedDur.days,
      roundTrip,
      tripDurationDays: tripLength,
      directOnly,
      currency,
      onProgress: (p) => {
        if (spinner) {
          spinner.text = `Fetching prices: chunk ${p.completedChunks}/${p.totalChunks}...`;
        }
      }
    });

    if (spinner) {
      spinner.succeed(chalk.green(`Fetched prices for ${results.flights.length} dates successfully!`));
    }

    // Generate markdown
    const topN = parseInt(options.top, 10) || 10;
    const sortBy = options.sort === "price" ? "price" : "date";

    const markdownOutput = generateMarkdownReport(results, { topN, sortBy });

    // Save to file if requested
    if (outputFile) {
      const resolvedPath = path.resolve(process.cwd(), outputFile);
      await fs.writeFile(resolvedPath, markdownOutput, "utf-8");
      if (!isRaw) {
        console.log(chalk.green(`\n💾 Saved markdown report to: ${chalk.bold(resolvedPath)}`));
      }
    }

    // Display summary in terminal if interactive
    if (!isRaw) {
      const stats = calculateStatistics(results.flights);
      const currSymbol = currency === "EUR" ? "€" : `${currency} `;

      console.log(chalk.bold("\n" + "=".repeat(60)));
      console.log(chalk.bold.green(`  🏆 CHEAPEST TICKET: ${chalk.yellow(currSymbol + stats.cheapestFlight.price)} on ${stats.cheapestFlight.dayOfWeek}, ${stats.cheapestFlight.date}`));
      console.log(chalk.dim(`  📊 Average: ${currSymbol}${stats.avg}  |  Median: ${currSymbol}${stats.median}  |  Range: ${currSymbol}${stats.min} – ${currSymbol}${stats.max}`));
      if (stats.bestDay) {
        console.log(chalk.dim(`  📅 Best Day of Week: ${chalk.cyan(stats.bestDay.day)} (avg ${currSymbol}${stats.bestDay.avg})`));
      }
      console.log(chalk.bold("=".repeat(60) + "\n"));

      console.log(chalk.bold.underline("Markdown Output Preview:\n"));
    }

    // Print markdown
    console.log(markdownOutput);

  } catch (err) {
    console.error(chalk.red(`\n❌ Error: ${err.message}`));
    process.exit(1);
  }
}

main();
