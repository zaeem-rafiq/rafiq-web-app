import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const fmpApiKey = defineSecret("FMP_API_KEY");

const FMP_BASE = "https://financialmodelingprep.com/stable";

const NOT_HALAL_SYMBOLS = new Set([
  // Banks & Financial Services
  "JPM", "BAC", "WFC", "GS", "MS", "C", "USB", "PNC", "COF", "SCHW",
  // Insurance
  "BRK.B", "AIG", "MET", "PRU", "ALL", "TRV",
  // Alcohol
  "DEO", "BUD", "STZ",
  // Tobacco
  "PM", "MO", "BATS",
  // Gambling
  "MGM", "LVS", "WYNN", "DKNG", "CZR",
]);

interface FmpProfile {
  companyName?: string;
  lastDiv?: number;
  lastDividend?: number;
  symbol?: string;
  price?: number;
}

interface FmpDividendEntry {
  date?: string;
  dividend?: number;
  adjDividend?: number;
  frequency?: string;
}

interface FmpIncomeStatement {
  revenue?: number;
  interestIncome?: number;
  interestExpense?: number;
  netInterestIncome?: number;
  totalOtherIncomeExpensesNet?: number;
}

interface FmpSearchResult {
  symbol?: string;
  name?: string;
  exchangeShortName?: string;
}

/**
 * Check if a candidate company name reasonably matches the user's query.
 * E.g., query "VERIZON" should match "Verizon Communications Inc." but NOT "Vertiv Holdings".
 */
function isReasonableNameMatch(query: string, candidateName: string): boolean {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  const name = candidateName.toLowerCase();
  // At least one significant word from the query must appear in the candidate name
  return queryWords.some(word => name.includes(word));
}

export const getTatheerData = onCall(
  { secrets: [fmpApiKey] },
  async (request) => {
    const { symbol, shares } = request.data as {
      symbol?: string;
      shares?: number;
    };

    if (!symbol || typeof symbol !== "string") {
      throw new HttpsError("invalid-argument", "Symbol is required");
    }

    const ticker = symbol.toUpperCase().trim();
    const numShares = typeof shares === "number" && shares > 0 ? shares : 0;
    const apiKey = fmpApiKey.value();

    if (!apiKey) {
      throw new HttpsError(
        "failed-precondition",
        "FMP_API_KEY secret is not configured"
      );
    }

    // --- Resolve ticker ---
    // If input matches valid ticker format (1-5 uppercase letters, optional dot suffix
    // like BRK.B), use it directly. Calling search-name with a ticker like "AAPL"
    // returns wrong results (e.g., "APLY" ETF whose name contains "AAPL").
    // Only call FMP search APIs when input looks like a company name.
    const VALID_TICKER = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
    const isTickerFormat = VALID_TICKER.test(ticker);
    let resolvedTicker = ticker;

    if (!isTickerFormat) {
      // Input is NOT a ticker format — likely a company name (e.g., "VERIZON")
      // Step 1: Try search-symbol (searches by ticker prefix, more precise)
      let resolved = false;
      try {
        const symResp = await fetch(
          `${FMP_BASE}/search-symbol?query=${encodeURIComponent(ticker)}&limit=1&apikey=${apiKey}`
        );
        if (symResp.ok) {
          const symResults: FmpSearchResult[] = await symResp.json();
          if (symResults?.[0]?.symbol) {
            resolvedTicker = symResults[0].symbol.toUpperCase();
            resolved = true;
            console.log(`Resolved "${ticker}" -> "${resolvedTicker}" via search-symbol`);
          }
        }
      } catch {
        // Proceed to search-name fallback
      }

      // Step 2: If search-symbol didn't resolve, try search-name with US exchange filter + name validation
      if (!resolved) {
        try {
          const nameResp = await fetch(
            `${FMP_BASE}/search-name?query=${encodeURIComponent(ticker)}&limit=10&apikey=${apiKey}`
          );
          if (nameResp.ok) {
            const nameResults: FmpSearchResult[] = await nameResp.json();
            const US_EXCHANGES = new Set(["NYSE", "NASDAQ", "AMEX"]);

            // Priority 1: US exchange + name matches user query
            const validatedUSMatch = nameResults.find(
              (r) => r.symbol &&
                US_EXCHANGES.has(r.exchangeShortName ?? "") &&
                isReasonableNameMatch(ticker, r.name ?? "")
            );
            if (validatedUSMatch?.symbol) {
              resolvedTicker = validatedUSMatch.symbol.toUpperCase();
              console.log(`Resolved "${ticker}" -> "${resolvedTicker}" via search-name (validated US: "${validatedUSMatch.name}")`);
            } else {
              // Priority 2: Any exchange + name matches user query
              const validatedAnyMatch = nameResults.find(
                (r) => r.symbol && isReasonableNameMatch(ticker, r.name ?? "")
              );
              if (validatedAnyMatch?.symbol) {
                resolvedTicker = validatedAnyMatch.symbol.toUpperCase();
                console.log(`Resolved "${ticker}" -> "${resolvedTicker}" via search-name (validated any: "${validatedAnyMatch.name}")`);
              } else {
                // Priority 3: First US exchange result (unvalidated fallback)
                const usMatch = nameResults.find(
                  (r) => r.symbol && US_EXCHANGES.has(r.exchangeShortName ?? "")
                );
                if (usMatch?.symbol) {
                  resolvedTicker = usMatch.symbol.toUpperCase();
                  console.log(`WARNING: Resolved "${ticker}" -> "${resolvedTicker}" via search-name (unvalidated US fallback: "${usMatch.name}")`);
                } else if (nameResults?.[0]?.symbol) {
                  resolvedTicker = nameResults[0].symbol.toUpperCase();
                  console.log(`WARNING: Resolved "${ticker}" -> "${resolvedTicker}" via search-name (unvalidated first result: "${nameResults[0].name}")`);
                }
              }
            }
          }
        } catch {
          console.log(`Name resolution failed for "${ticker}", using original input`);
        }
      }
    } else {
      console.log(`"${ticker}" is ticker format — using directly, no search API call`);
    }

    // Fetch all 3 endpoints in parallel using resolved ticker
    const [profileResp, dividendResp, incomeResp] = await Promise.all([
      fetch(`${FMP_BASE}/profile?symbol=${resolvedTicker}&apikey=${apiKey}`),
      fetch(`${FMP_BASE}/dividends?symbol=${resolvedTicker}&apikey=${apiKey}`),
      fetch(`${FMP_BASE}/income-statement?symbol=${resolvedTicker}&limit=1&apikey=${apiKey}`),
    ]);

    // --- Profile ---
    let companyName = resolvedTicker;
    let lastDiv = 0;
    let currentPrice = 0;
    if (profileResp.ok) {
      const profileData: FmpProfile[] = await profileResp.json();
      if (profileData?.[0]) {
        companyName = profileData[0].companyName || resolvedTicker;
        lastDiv = profileData[0].lastDiv || profileData[0].lastDividend || 0;
        currentPrice = profileData[0].price || 0;
      }
    }

    // --- Dividend History ---
    let quarterlyDividend = 0;
    let annualDividend = 0;
    let frequency = "N/A";
    let hasDividend = false;

    if (dividendResp.ok) {
      const dividendData = await dividendResp.json();
      // /stable/dividends returns a flat array (no .historical wrapper)
      const history: FmpDividendEntry[] = Array.isArray(dividendData) ? dividendData : (dividendData?.historical || []);

      if (history.length > 0) {
        hasDividend = true;
        frequency = history[0].frequency || "quarterly";

        // Most recent quarterly dividend
        quarterlyDividend = history[0].adjDividend ?? history[0].dividend ?? 0;

        // Annual dividend: sum of last 4 quarterly payments
        const recentFour = history.slice(0, 4);
        annualDividend = recentFour.reduce(
          (sum, d) => sum + (d.adjDividend ?? d.dividend ?? 0),
          0
        );
      }
    }

    // Fallback: use profile.lastDiv if dividend history gave 0
    if (!hasDividend && lastDiv > 0) {
      hasDividend = true;
      annualDividend = lastDiv;
      quarterlyDividend = lastDiv / 4;
      frequency = "quarterly";
    }

    // --- Income Statement (non-compliant ratio) ---
    let nonCompliantRatio = 0;
    if (incomeResp.ok) {
      const incomeData: FmpIncomeStatement[] = await incomeResp.json();
      console.log("Income statement raw:", JSON.stringify(incomeData?.[0] || {}));

      if (Array.isArray(incomeData) && incomeData[0]) {
        const stmt = incomeData[0];
        const revenue = Number(stmt.revenue) || 0;

        // FMP populates different interest fields per company — try all of them
        const interestIncome = Math.abs(Number(stmt.interestIncome) || 0);
        const interestExpense = Math.abs(Number(stmt.interestExpense) || 0);
        const netInterestIncome = Math.abs(Number(stmt.netInterestIncome) || 0);
        const otherIncome = Math.abs(Number(stmt.totalOtherIncomeExpensesNet) || 0);

        // Use the largest non-zero interest-related value as non-compliant income
        const nonCompliantIncome =
          Math.max(interestIncome, interestExpense, netInterestIncome) || otherIncome;

        if (revenue > 0 && nonCompliantIncome > 0) {
          nonCompliantRatio = nonCompliantIncome / revenue;
        }

        console.log("Income fields:", {
          revenue, interestIncome, interestExpense,
          netInterestIncome, otherIncome, nonCompliantRatio,
        });
      }
    } else {
      console.log("Income statement fetch failed:", incomeResp.status, incomeResp.statusText);
      // Conservative fallback: 0.5% non-compliant ratio when income data unavailable.
      // Better than 0% (zero purification) for stocks with some interest component.
      nonCompliantRatio = 0.005;
      console.log("Using conservative fallback nonCompliantRatio: 0.5%");
    }

    // --- Calculate purification ---
    const totalAnnualDividends = annualDividend * numShares;
    const totalQuarterlyDividends = quarterlyDividend * numShares;
    const annualPurification = totalAnnualDividends * nonCompliantRatio;
    const quarterlyPurification = totalQuarterlyDividends * nonCompliantRatio;

    const isNotHalal = NOT_HALAL_SYMBOLS.has(resolvedTicker);

    const result = {
      companyName,
      annualDividend,
      quarterlyDividend,
      frequency,
      totalAnnualDividends,
      totalQuarterlyDividends,
      nonCompliantRatio,
      annualPurification,
      quarterlyPurification,
      shares: numShares,
      dataSource: "fmp",
      hasDividend,
      resolvedTicker,
      inputWasResolved: !isTickerFormat,
      currentPrice,
      isNotHalal,
    };

    console.log("getTatheerData result:", JSON.stringify(result));
    return result;
  }
);
