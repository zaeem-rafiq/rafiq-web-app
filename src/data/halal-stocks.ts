export interface HalalStock {
  symbol: string;
  name: string;
  sector: string;
  status: "HALAL" | "NOT HALAL" | "QUESTIONABLE";
  type: "stock" | "etf" | "mutual_fund";
}

interface DJIMEntry {
  symbol: string;
  name: string;
  sector: string;
}

interface DJIMData {
  stocks: DJIMEntry[];
  etfs: DJIMEntry[];
  mutual_funds: DJIMEntry[];
}

// Stocks that are instantly classified as haram — conventional banks,
// insurance, alcohol, tobacco, gambling, weapons manufacturers.
export const KNOWN_HARAM_SYMBOLS = new Set([
  // Banks & financial services
  "C", "JPM", "BAC", "WFC", "GS", "MS", "USB", "PNC", "COF", "SCHW",
  "BRK.B", "AIG", "MET", "PRU", "ALL", "TRV",
  // Alcohol
  "DEO", "BUD", "STZ",
  // Tobacco
  "PM", "MO", "BATS",
  // Gambling
  "MGM", "LVS", "WYNN", "DKNG", "FLUT", "CZR",
  // Weapons / defence
  "LMT", "RTX", "NOC", "BA", "GD", "HII", "SWBI", "RGR",
]);

// Map haram symbols to their exclusion reason for the Business Activity card.
const HARAM_BANKS = new Set(["C", "JPM", "BAC", "WFC", "GS", "MS", "USB", "PNC", "COF", "SCHW", "BRK.B", "AIG", "MET", "PRU", "ALL", "TRV"]);
const HARAM_ALCOHOL = new Set(["DEO", "BUD", "STZ"]);
const HARAM_TOBACCO = new Set(["PM", "MO", "BATS"]);
const HARAM_GAMBLING = new Set(["MGM", "LVS", "WYNN", "DKNG", "FLUT", "CZR"]);
const HARAM_WEAPONS = new Set(["LMT", "RTX", "NOC", "BA", "GD", "HII", "SWBI", "RGR"]);

export function getHaramReason(symbol: string): string {
  const sym = symbol.toUpperCase().trim();
  if (HARAM_BANKS.has(sym)) return "Conventional Banking / Insurance";
  if (HARAM_ALCOHOL.has(sym)) return "Alcohol Production / Distribution";
  if (HARAM_TOBACCO.has(sym)) return "Tobacco Production";
  if (HARAM_GAMBLING.has(sym)) return "Gambling / Betting";
  if (HARAM_WEAPONS.has(sym)) return "Weapons Manufacturing";
  return "Prohibited Industry";
}

let _cache: HalalStock[] | null = null;
let _loading: Promise<HalalStock[]> | null = null;

/**
 * Fetch and cache the full DJIM screener dataset from /halal_screener_data.json.
 * All entries in the JSON are considered HALAL (they are part of the DJIM index).
 */
export async function loadScreenerData(): Promise<HalalStock[]> {
  if (_cache) return _cache;
  if (_loading) return _loading;

  _loading = fetch("/halal_screener_data.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load screener data: ${res.status}`);
      return res.json() as Promise<DJIMData>;
    })
    .then((data) => {
      const all: HalalStock[] = [
        ...data.stocks.map((s) => ({
          symbol: s.symbol.toUpperCase(),
          name: s.name,
          sector: s.sector,
          status: "HALAL" as const,
          type: "stock" as const,
        })),
        ...data.etfs.map((s) => ({
          symbol: s.symbol.toUpperCase(),
          name: s.name,
          sector: s.sector,
          status: "HALAL" as const,
          type: "etf" as const,
        })),
        ...data.mutual_funds.map((s) => ({
          symbol: s.symbol.toUpperCase(),
          name: s.name,
          sector: s.sector,
          status: "HALAL" as const,
          type: "mutual_fund" as const,
        })),
      ];
      _cache = all;
      return all;
    })
    .catch((err) => {
      console.error("Screener data load error:", err);
      _loading = null;
      return [] as HalalStock[];
    });

  return _loading;
}

/**
 * Three-tier lookup:
 *  1. Known haram symbol → instant NOT HALAL
 *  2. Found in DJIM index → HALAL
 *  3. Not found → UNKNOWN (returns null so caller can decide what to show)
 */
export async function lookupStock(symbol: string): Promise<HalalStock | null> {
  const sym = symbol.toUpperCase().trim();

  // Tier 1 — known haram
  if (KNOWN_HARAM_SYMBOLS.has(sym)) {
    return {
      symbol: sym,
      name: sym, // caller can enrich with display name later
      sector: "Excluded",
      status: "NOT HALAL",
      type: "stock",
    };
  }

  // Tier 2 — DJIM index
  const data = await loadScreenerData();
  const match = data.find((s) => s.symbol === sym);
  if (match) return match;

  // Tier 3 — unknown
  return null;
}

/**
 * Search stocks by symbol or name. Works against the cached dataset.
 * Returns empty array if data hasn't loaded yet.
 */
export async function searchStocks(query: string): Promise<HalalStock[]> {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();
  const data = await loadScreenerData();
  return data.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  );
}

/**
 * Find a single stock by exact symbol.
 * Uses the three-tier lookup (known haram → DJIM → unknown).
 */
export async function findStock(symbol: string): Promise<HalalStock | null> {
  return lookupStock(symbol);
}
