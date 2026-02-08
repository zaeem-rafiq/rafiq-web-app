export interface DJIMStock {
  symbol: string;
  name: string;
  sector: string;
}

/**
 * DJIM (Dow Jones Islamic Market) constituent stocks.
 * These are Shariah-compliant stocks that have passed DJIM screening criteria.
 */
const djimStocks: DJIMStock[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "PG", name: "Procter & Gamble Co.", sector: "Consumer Defensive" },
  { symbol: "UNH", name: "UnitedHealth Group", sector: "Healthcare" },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Communication Services" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Communication Services" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology" },
  { symbol: "COST", name: "Costco Wholesale", sector: "Consumer Defensive" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Defensive" },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer Defensive" },
  { symbol: "MCD", name: "McDonald's Corp.", sector: "Consumer Cyclical" },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer Cyclical" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology" },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer Cyclical" },
  { symbol: "SHOP", name: "Shopify Inc.", sector: "Technology" },
  { symbol: "UBER", name: "Uber Technologies", sector: "Technology" },
  { symbol: "ZM", name: "Zoom Video Comm.", sector: "Technology" },
  { symbol: "SPOT", name: "Spotify Technology", sector: "Communication Services" },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Healthcare" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Technology" },
  { symbol: "TXN", name: "Texas Instruments", sector: "Technology" },
  { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Technology" },
  { symbol: "HON", name: "Honeywell International", sector: "Industrials" },
  { symbol: "UPS", name: "United Parcel Service", sector: "Industrials" },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials" },
  { symbol: "BA", name: "Boeing Co.", sector: "Industrials" },
  { symbol: "LMT", name: "Lockheed Martin Corp.", sector: "Industrials" },
  { symbol: "MMM", name: "3M Company", sector: "Industrials" },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare" },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Healthcare" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", sector: "Healthcare" },
  { symbol: "DHR", name: "Danaher Corporation", sector: "Healthcare" },
  { symbol: "BMY", name: "Bristol-Myers Squibb", sector: "Healthcare" },
  { symbol: "LLY", name: "Eli Lilly and Co.", sector: "Healthcare" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Defensive" },
  { symbol: "TGT", name: "Target Corporation", sector: "Consumer Defensive" },
  { symbol: "LOW", name: "Lowe's Companies", sector: "Consumer Cyclical" },
  { symbol: "SBUX", name: "Starbucks Corp.", sector: "Consumer Cyclical" },
  { symbol: "F", name: "Ford Motor Company", sector: "Automotive" },
  { symbol: "GM", name: "General Motors Co.", sector: "Automotive" },
];

let loaded = false;

export async function loadDJIMData(): Promise<DJIMStock[]> {
  // Simulate async data loading (e.g. from remote index)
  if (!loaded) {
    await new Promise((r) => setTimeout(r, 50));
    loaded = true;
  }
  return djimStocks;
}

export function searchStocks(query: string): DJIMStock[] {
  if (!query.trim()) return [];
  const q = query.toUpperCase().trim();
  return djimStocks.filter(
    (s) =>
      s.symbol.includes(q) ||
      s.name.toUpperCase().includes(q),
  );
}

export function isDJIMStock(symbol: string): boolean {
  return djimStocks.some((s) => s.symbol === symbol.toUpperCase().trim());
}
