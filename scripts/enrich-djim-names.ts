/**
 * One-time script to enrich halal_screener_data.json with company names from FMP API.
 *
 * Usage:
 *   cd /Users/zaeemkhan/rafiq-web-app
 *   npx tsx scripts/enrich-djim-names.ts
 *
 * FMP /stable/profile does NOT support comma-separated batch requests,
 * so we use concurrent individual requests (10 at a time).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FMP_API_KEY = process.env.FMP_API_KEY || "Kn8g20OVIo7PvG9FuFL6oxDaKSgC31vP";
const FMP_BASE = "https://financialmodelingprep.com/stable";
const CONCURRENCY = 5; // parallel requests at a time
const DELAY_BETWEEN_BATCHES_MS = 1000; // delay between concurrent batches

interface ShariahEntry {
  symbol: string;
  name?: string;
  sector: string;
  region: string;
}

interface FmpProfile {
  symbol?: string;
  companyName?: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSingleProfile(symbol: string): Promise<[string, string | null]> {
  const url = `${FMP_BASE}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${FMP_API_KEY}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [symbol, null];
    const data: FmpProfile[] = await resp.json();
    if (Array.isArray(data) && data[0]?.companyName) {
      return [symbol, data[0].companyName];
    }
  } catch {
    // ignore
  }
  return [symbol, null];
}

async function main() {
  const jsonPath = path.resolve(__dirname, "../public/halal_screener_data.json");
  console.log(`Reading ${jsonPath}...`);

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  const entries: ShariahEntry[] = data.shariahIndexDetailed ?? [];
  console.log(`Found ${entries.length} entries.`);

  const withNames = entries.filter((e) => e.name).length;
  console.log(`Already have names: ${withNames}`);

  const needNames = entries.filter((e) => !e.name);
  console.log(`Need names: ${needNames.length}`);

  if (needNames.length === 0) {
    console.log("All entries already have names. Done!");
    return;
  }

  // Process with concurrency limit
  const symbolToName = new Map<string, string>();
  const totalBatches = Math.ceil(needNames.length / CONCURRENCY);

  for (let i = 0; i < needNames.length; i += CONCURRENCY) {
    const batch = needNames.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;

    const results = await Promise.all(
      batch.map((e) => fetchSingleProfile(e.symbol))
    );

    let gotCount = 0;
    for (const [sym, name] of results) {
      if (name) {
        symbolToName.set(sym.toUpperCase(), name);
        gotCount++;
      }
    }

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`  Batch ${batchNum}/${totalBatches}: ${symbolToName.size} names total`);
    }

    if (i + CONCURRENCY < needNames.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log(`\nTotal names fetched: ${symbolToName.size}`);

  // Apply names to entries
  let applied = 0;
  let missing = 0;
  for (const entry of entries) {
    if (!entry.name) {
      const name = symbolToName.get(entry.symbol.toUpperCase());
      if (name) {
        entry.name = name;
        applied++;
      } else {
        missing++;
      }
    }
  }

  console.log(`Applied: ${applied}, Missing: ${missing}`);

  if (missing > 0) {
    const missingSymbols = entries
      .filter((e) => !e.name)
      .map((e) => e.symbol)
      .slice(0, 20);
    console.log(`Missing symbols (first 20): ${missingSymbols.join(", ")}`);
  }

  // Write back
  data.shariahIndexDetailed = entries;
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
  console.log(`\nWritten to ${jsonPath}`);

  // Verify
  const verify = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const finalWithNames = verify.shariahIndexDetailed.filter((e: ShariahEntry) => e.name).length;
  console.log(`Verification: ${finalWithNames}/${verify.shariahIndexDetailed.length} have names`);
}

main().catch(console.error);
