import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const fmpApiKey = defineSecret("FMP_API_KEY");

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

interface FmpProfile {
  companyName?: string;
  lastDiv?: number;
  symbol?: string;
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

    // Resolve user input (could be company name like "CUMMINS") to actual ticker symbol
    let resolvedTicker = ticker;
    try {
      const searchResp = await fetch(
        `${FMP_BASE}/search?query=${encodeURIComponent(ticker)}&limit=1&apikey=${apiKey}`
      );
      if (searchResp.ok) {
        const searchResults: FmpSearchResult[] = await searchResp.json();
        if (searchResults?.[0]?.symbol) {
          resolvedTicker = searchResults[0].symbol.toUpperCase();
          console.log(`Resolved "${ticker}" to "${resolvedTicker}"`);
        }
      }
    } catch (err) {
      console.log(`Ticker search failed for "${ticker}", using original input`);
    }

    // Fetch all 3 endpoints in parallel using resolved ticker
    const [profileResp, dividendResp, incomeResp] = await Promise.all([
      fetch(`${FMP_BASE}/profile/${resolvedTicker}?apikey=${apiKey}`),
      fetch(
        `${FMP_BASE}/historical-price-full/stock_dividend/${resolvedTicker}?apikey=${apiKey}`
      ),
      fetch(`${FMP_BASE}/income-statement/${resolvedTicker}?limit=1&apikey=${apiKey}`),
    ]);

    // --- Profile ---
    let companyName = resolvedTicker;
    let lastDiv = 0;
    if (profileResp.ok) {
      const profileData: FmpProfile[] = await profileResp.json();
      if (profileData?.[0]) {
        companyName = profileData[0].companyName || resolvedTicker;
        lastDiv = profileData[0].lastDiv || 0;
      }
    }

    // --- Dividend History ---
    let quarterlyDividend = 0;
    let annualDividend = 0;
    let frequency = "N/A";
    let hasDividend = false;

    if (dividendResp.ok) {
      const dividendData = await dividendResp.json();
      const history: FmpDividendEntry[] = dividendData?.historical || [];

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
    }

    // --- Calculate purification ---
    const totalAnnualDividends = annualDividend * numShares;
    const totalQuarterlyDividends = quarterlyDividend * numShares;
    const annualPurification = totalAnnualDividends * nonCompliantRatio;
    const quarterlyPurification = totalQuarterlyDividends * nonCompliantRatio;

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
    };

    console.log("getTatheerData result:", JSON.stringify(result));
    return result;
  }
);
