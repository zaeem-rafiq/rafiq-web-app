export interface HalalStock {
  symbol: string;
  name: string;
  sector: string;
  status: "HALAL" | "NOT HALAL" | "QUESTIONABLE";
  ratios: {
    debtRatio: number;
    interestIncome: number;
    cashSecurities: number;
    businessActivity: "PASS" | "FAIL" | "QUESTIONABLE";
  };
}

export const halalStocks: HalalStock[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 28.5, interestIncome: 1.2, cashSecurities: 18.3, businessActivity: "PASS" } },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", status: "HALAL", ratios: { debtRatio: 15.2, interestIncome: 2.1, cashSecurities: 22.1, businessActivity: "PASS" } },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 5.8, interestIncome: 1.8, cashSecurities: 25.4, businessActivity: "PASS" } },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", status: "HALAL", ratios: { debtRatio: 18.9, interestIncome: 0.8, cashSecurities: 15.2, businessActivity: "PASS" } },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", status: "HALAL", ratios: { debtRatio: 8.1, interestIncome: 0.5, cashSecurities: 12.8, businessActivity: "PASS" } },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 9.3, interestIncome: 1.5, cashSecurities: 20.7, businessActivity: "PASS" } },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", status: "HALAL", ratios: { debtRatio: 6.2, interestIncome: 0.9, cashSecurities: 19.5, businessActivity: "PASS" } },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services", status: "QUESTIONABLE", ratios: { debtRatio: 31.2, interestIncome: 3.8, cashSecurities: 8.5, businessActivity: "QUESTIONABLE" } },
  { symbol: "MA", name: "Mastercard Inc.", sector: "Financial Services", status: "QUESTIONABLE", ratios: { debtRatio: 32.1, interestIncome: 4.1, cashSecurities: 7.2, businessActivity: "QUESTIONABLE" } },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services", status: "NOT HALAL", ratios: { debtRatio: 85.3, interestIncome: 62.1, cashSecurities: 45.8, businessActivity: "FAIL" } },
  { symbol: "BAC", name: "Bank of America Corp.", sector: "Financial Services", status: "NOT HALAL", ratios: { debtRatio: 88.7, interestIncome: 58.4, cashSecurities: 52.3, businessActivity: "FAIL" } },
  { symbol: "WFC", name: "Wells Fargo & Co.", sector: "Financial Services", status: "NOT HALAL", ratios: { debtRatio: 86.1, interestIncome: 55.9, cashSecurities: 48.7, businessActivity: "FAIL" } },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", status: "HALAL", ratios: { debtRatio: 22.4, interestIncome: 1.1, cashSecurities: 14.8, businessActivity: "PASS" } },
  { symbol: "PG", name: "Procter & Gamble Co.", sector: "Consumer Defensive", status: "HALAL", ratios: { debtRatio: 27.8, interestIncome: 0.7, cashSecurities: 6.2, businessActivity: "PASS" } },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare", status: "HALAL", ratios: { debtRatio: 25.1, interestIncome: 2.3, cashSecurities: 10.5, businessActivity: "PASS" } },
  { symbol: "HD", name: "Home Depot Inc.", sector: "Consumer Cyclical", status: "QUESTIONABLE", ratios: { debtRatio: 32.5, interestIncome: 0.3, cashSecurities: 3.8, businessActivity: "PASS" } },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Communication Services", status: "HALAL", ratios: { debtRatio: 26.3, interestIncome: 1.4, cashSecurities: 11.2, businessActivity: "PASS" } },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services", status: "HALAL", ratios: { debtRatio: 14.8, interestIncome: 0.2, cashSecurities: 9.8, businessActivity: "PASS" } },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 11.5, interestIncome: 1.9, cashSecurities: 16.3, businessActivity: "PASS" } },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 10.2, interestIncome: 2.4, cashSecurities: 20.1, businessActivity: "PASS" } },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer Defensive", status: "HALAL", ratios: { debtRatio: 12.8, interestIncome: 0.6, cashSecurities: 8.4, businessActivity: "PASS" } },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Defensive", status: "HALAL", ratios: { debtRatio: 30.2, interestIncome: 0.9, cashSecurities: 5.1, businessActivity: "PASS" } },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer Defensive", status: "HALAL", ratios: { debtRatio: 29.5, interestIncome: 1.0, cashSecurities: 8.9, businessActivity: "PASS" } },
  { symbol: "MCD", name: "McDonald's Corp.", sector: "Consumer Cyclical", status: "HALAL", ratios: { debtRatio: 31.8, interestIncome: 0.4, cashSecurities: 4.2, businessActivity: "PASS" } },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer Cyclical", status: "HALAL", ratios: { debtRatio: 17.6, interestIncome: 0.8, cashSecurities: 13.5, businessActivity: "PASS" } },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology", status: "HALAL", ratios: { debtRatio: 21.3, interestIncome: 1.6, cashSecurities: 18.9, businessActivity: "PASS" } },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", status: "HALAL", ratios: { debtRatio: 4.5, interestIncome: 0.3, cashSecurities: 22.7, businessActivity: "PASS" } },
  { symbol: "PYPL", name: "PayPal Holdings", sector: "Financial Services", status: "QUESTIONABLE", ratios: { debtRatio: 12.4, interestIncome: 4.8, cashSecurities: 28.6, businessActivity: "QUESTIONABLE" } },
  { symbol: "GS", name: "Goldman Sachs Group", sector: "Financial Services", status: "NOT HALAL", ratios: { debtRatio: 91.2, interestIncome: 48.5, cashSecurities: 55.1, businessActivity: "FAIL" } },
  { symbol: "C", name: "Citigroup Inc.", sector: "Financial Services", status: "NOT HALAL", ratios: { debtRatio: 89.8, interestIncome: 54.2, cashSecurities: 50.4, businessActivity: "FAIL" } },
  { symbol: "BUD", name: "Anheuser-Busch InBev", sector: "Consumer Defensive", status: "NOT HALAL", ratios: { debtRatio: 28.5, interestIncome: 0.5, cashSecurities: 5.2, businessActivity: "FAIL" } },
  { symbol: "PM", name: "Philip Morris Int'l", sector: "Consumer Defensive", status: "NOT HALAL", ratios: { debtRatio: 35.2, interestIncome: 0.8, cashSecurities: 4.1, businessActivity: "FAIL" } },
  { symbol: "LVS", name: "Las Vegas Sands", sector: "Consumer Cyclical", status: "NOT HALAL", ratios: { debtRatio: 42.1, interestIncome: 1.2, cashSecurities: 8.5, businessActivity: "FAIL" } },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer Cyclical", status: "HALAL", ratios: { debtRatio: 8.9, interestIncome: 2.8, cashSecurities: 29.3, businessActivity: "PASS" } },
  { symbol: "SQ", name: "Block Inc.", sector: "Technology", status: "QUESTIONABLE", ratios: { debtRatio: 15.8, interestIncome: 4.5, cashSecurities: 18.2, businessActivity: "QUESTIONABLE" } },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 3.2, interestIncome: 1.8, cashSecurities: 28.5, businessActivity: "PASS" } },
  { symbol: "UBER", name: "Uber Technologies", sector: "Technology", status: "HALAL", ratios: { debtRatio: 19.5, interestIncome: 0.9, cashSecurities: 15.8, businessActivity: "PASS" } },
  { symbol: "ZM", name: "Zoom Video Comm.", sector: "Technology", status: "HALAL", ratios: { debtRatio: 1.2, interestIncome: 3.1, cashSecurities: 31.2, businessActivity: "PASS" } },
  { symbol: "SPOT", name: "Spotify Technology", sector: "Communication Services", status: "HALAL", ratios: { debtRatio: 7.8, interestIncome: 1.4, cashSecurities: 22.5, businessActivity: "PASS" } },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Healthcare", status: "HALAL", ratios: { debtRatio: 5.1, interestIncome: 2.5, cashSecurities: 30.8, businessActivity: "PASS" } },
];

export interface ShariahIndexEntry {
  symbol: string;
  sector: string;
  region: string;
}

interface ScreenerData {
  shariahIndexDetailed: ShariahIndexEntry[];
}

let cachedIndex: ShariahIndexEntry[] | null = null;
let fetchPromise: Promise<ShariahIndexEntry[]> | null = null;

export async function loadShariahIndex(): Promise<ShariahIndexEntry[]> {
  if (cachedIndex) return cachedIndex;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/halal_screener_data.json")
    .then((r) => r.json())
    .then((data: ScreenerData) => {
      cachedIndex = data.shariahIndexDetailed ?? [];
      return cachedIndex;
    })
    .catch(() => {
      cachedIndex = [];
      return cachedIndex;
    });
  return fetchPromise;
}

export function searchStocks(query: string): HalalStock[] {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();
  return halalStocks.filter(
    (s) =>
      s.symbol.includes(q) ||
      s.name.toUpperCase().includes(q)
  );
}

export function searchExtended(
  query: string,
  index: ShariahIndexEntry[]
): (HalalStock | ShariahIndexEntry)[] {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();
  const localSymbols = new Set(halalStocks.map((s) => s.symbol));

  const localMatches = halalStocks.filter(
    (s) => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  );

  const indexMatches = index.filter(
    (s) => !localSymbols.has(s.symbol) && s.symbol.includes(q)
  );

  return [...localMatches, ...indexMatches];
}

export function findStock(symbol: string): HalalStock | undefined {
  return halalStocks.find((s) => s.symbol === symbol.toUpperCase().trim());
}

export { loadDJIMData, type DJIMStock } from "./djim-stocks";

export function findInIndex(
  symbol: string,
  index: ShariahIndexEntry[]
): ShariahIndexEntry | undefined {
  const s = symbol.toUpperCase().trim();
  return index.find((entry) => entry.symbol === s);
}

export function isHalalStock(item: HalalStock | ShariahIndexEntry): item is HalalStock {
  return "status" in item;
}
