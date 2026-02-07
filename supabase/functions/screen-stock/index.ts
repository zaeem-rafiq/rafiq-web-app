import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AAOIFI Screening thresholds
const THRESHOLDS = {
  debtRatio: 33,
  interestIncome: 5,
  cashSecurities: 33,
};

// Haram business activities
const HARAM_SECTORS = [
  "gambling", "casino", "alcohol", "tobacco", "pork", "adult entertainment",
  "weapons", "conventional banking", "conventional insurance", "cannabis",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    if (!symbol || typeof symbol !== "string") {
      return new Response(
        JSON.stringify({ error: "Symbol is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ticker = symbol.toUpperCase().trim();
    console.log("Screening stock:", ticker);

    // Try to get financial data from a free API
    // Using Yahoo Finance via a community endpoint
    const profileUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=financialData,balanceSheetHistory,incomeStatementHistory,assetProfile`;

    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      console.log("Yahoo Finance API returned status:", response.status);
      // Return a simulated screening for demo purposes
      return new Response(
        JSON.stringify({
          symbol: ticker,
          name: ticker,
          sector: "Unknown",
          status: "QUESTIONABLE",
          ratios: {
            debtRatio: 0,
            interestIncome: 0,
            cashSecurities: 0,
            businessActivity: "QUESTIONABLE",
          },
          source: "unavailable",
          message: "Live financial data unavailable. Please verify manually.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const result = data.quoteSummary?.result?.[0];

    if (!result) {
      return new Response(
        JSON.stringify({ error: `Stock ${ticker} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract financial data
    const profile = result.assetProfile || {};
    const financials = result.financialData || {};
    const balanceSheet = result.balanceSheetHistory?.balanceSheetStatements?.[0] || {};
    const incomeStatement = result.incomeStatementHistory?.incomeStatementHistory?.[0] || {};

    const totalAssets = balanceSheet.totalAssets?.raw || 1;
    const totalDebt = balanceSheet.longTermDebt?.raw || 0;
    const shortTermDebt = balanceSheet.shortTermBorrowings?.raw || 0;
    const totalRevenue = incomeStatement.totalRevenue?.raw || 1;
    const interestIncome = incomeStatement.interestIncome?.raw || 0;
    const cash = balanceSheet.cash?.raw || 0;
    const shortTermInvestments = balanceSheet.shortTermInvestments?.raw || 0;

    // Calculate ratios
    const debtRatio = ((totalDebt + shortTermDebt) / totalAssets) * 100;
    const interestRatio = (Math.abs(interestIncome) / totalRevenue) * 100;
    const cashRatio = ((cash + shortTermInvestments) / totalAssets) * 100;

    // Check business activity
    const sector = (profile.sector || "").toLowerCase();
    const industry = (profile.industry || "").toLowerCase();
    const description = (profile.longBusinessSummary || "").toLowerCase();
    const isHaramBusiness = HARAM_SECTORS.some(
      (h) => sector.includes(h) || industry.includes(h) || description.includes(h)
    );

    const businessActivity = isHaramBusiness ? "FAIL" : "PASS";

    // Determine status
    const debtPass = debtRatio < THRESHOLDS.debtRatio;
    const interestPass = interestRatio < THRESHOLDS.interestIncome;
    const cashPass = cashRatio < THRESHOLDS.cashSecurities;
    const activityPass = businessActivity === "PASS";

    let status: "HALAL" | "NOT HALAL" | "QUESTIONABLE";
    if (debtPass && interestPass && cashPass && activityPass) {
      status = "HALAL";
    } else if (!activityPass || debtRatio > 50 || interestRatio > 15) {
      status = "NOT HALAL";
    } else {
      status = "QUESTIONABLE";
    }

    const screeningResult = {
      symbol: ticker,
      name: profile.companyName || financials.companyName || ticker,
      sector: profile.sector || "Unknown",
      status,
      ratios: {
        debtRatio: Math.round(debtRatio * 10) / 10,
        interestIncome: Math.round(interestRatio * 10) / 10,
        cashSecurities: Math.round(cashRatio * 10) / 10,
        businessActivity,
      },
      source: "live",
    };

    console.log("Screening result:", screeningResult);

    return new Response(JSON.stringify(screeningResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Screen stock error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Screening failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
