import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  Search,
  AlertTriangle,
  Loader2,
  Heart,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  type Madhab,
  type NisabStandard,
  type ZakatAssets,
  type MetalPrices,
  type ZakatResult,
  calculateZakat,
} from "@/lib/zakat-utils";
import { loadDJIMData, searchStocks, isDJIMStock, type DJIMStock } from "@/data/djim-stocks";
import { findStock } from "@/data/halal-stocks";
import { httpsCallable, functions } from "@/lib/firebase";

// --- Zakat Calculator types & constants ---

const madhabs: Madhab[] = ["Hanafi", "Shafi'i", "Maliki", "Hanbali", "Ja'fari"];
const FALLBACK_PRICES: MetalPrices = { goldPerGram: 75.5, silverPerGram: 0.92 };

// --- Tatheer types & constants ---

interface TatheerResult {
  symbol: string;
  companyName: string;
  dividendPerShare: number;
  frequency: string;
  hasDividend: boolean;
  totalDividends: number;
  nonCompliantRatio: number;
  purificationAmount: number;
}

const HARAM_INDUSTRY_MAP: Record<string, string> = {
  JPM: "Conventional Banking",
  BAC: "Conventional Banking",
  WFC: "Conventional Banking",
  GS: "Investment Banking",
  C: "Conventional Banking",
  BUD: "Alcohol",
  PM: "Tobacco",
  LVS: "Gambling",
};

// --- Helpers ---

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const pct = (n: number) => `${n.toFixed(2)}%`;

// ============================================================
// Zakat Calculator Tab
// ============================================================

function ZakatCalculatorTab() {
  const [step, setStep] = useState(1);
  const [madhab, setMadhab] = useState<Madhab>("Hanafi");
  const [nisabStandard, setNisabStandard] = useState<NisabStandard>("gold");
  const [prices, setPrices] = useState<MetalPrices>(FALLBACK_PRICES);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [assets, setAssets] = useState<ZakatAssets>({
    cash: 0,
    gold: 0,
    silver: 0,
    investments: 0,
    businessInventory: 0,
    debtsOwed: 0,
  });
  const [result, setResult] = useState<ZakatResult | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/metal-prices`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data.goldPerGram && data.silverPerGram) {
            setPrices({ goldPerGram: data.goldPerGram, silverPerGram: data.silverPerGram });
          }
        }
      } catch {
        // Use fallback
      } finally {
        setPricesLoading(false);
      }
    }
    fetchPrices();
  }, []);

  const showNisabToggle = ["Shafi'i", "Maliki", "Hanbali"].includes(madhab);

  const handleCalculate = () => {
    const res = calculateZakat(assets, madhab, prices, nisabStandard);
    setResult(res);
    setStep(3);
  };

  const updateAsset = (key: keyof ZakatAssets, value: string) => {
    setAssets((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <>
      {/* Step indicators */}
      <div className="mb-10 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full font-ui text-sm font-semibold transition-colors ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 w-10 rounded-full ${step > s ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 — Madhab */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading">Select Your Madhab</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {madhabs.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMadhab(m)}
                      className={`rounded-full px-5 py-2.5 font-ui text-sm font-medium transition-all ${
                        madhab === m
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {showNisabToggle && (
                  <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-5">
                    <div>
                      <p className="font-ui text-sm font-medium text-foreground">Nisab Standard</p>
                      <p className="text-xs text-muted-foreground">
                        Choose gold or silver for threshold
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-ui text-xs font-medium ${nisabStandard === "silver" ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        Silver
                      </span>
                      <Switch
                        checked={nisabStandard === "gold"}
                        onCheckedChange={(c) => setNisabStandard(c ? "gold" : "silver")}
                      />
                      <span
                        className={`font-ui text-xs font-medium ${nisabStandard === "gold" ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        Gold
                      </span>
                    </div>
                  </div>
                )}

                {madhab === "Ja'fari" && (
                  <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground">
                      Cash and investments fall under <strong>Khums (20%)</strong>, not Zakat. Zakat
                      applies to gold, silver, livestock, and crops.
                    </p>
                  </div>
                )}

                <Button onClick={() => setStep(2)} className="w-full gap-2 font-ui font-semibold">
                  Continue <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2 — Assets */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading">Enter Your Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key: "cash" as const, label: "Cash & Bank Accounts", unit: "USD" },
                  { key: "gold" as const, label: "Gold", unit: "grams" },
                  { key: "silver" as const, label: "Silver", unit: "grams" },
                  { key: "investments" as const, label: "Investments", unit: "USD" },
                  { key: "businessInventory" as const, label: "Business Inventory", unit: "USD" },
                  { key: "debtsOwed" as const, label: "Debts Owed (Deductions)", unit: "USD" },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="font-ui text-sm font-medium">{field.label}</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {field.unit}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={assets[field.key] || ""}
                        onChange={(e) => updateAsset(field.key, e.target.value)}
                        className="bg-card pl-14"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}

                {!pricesLoading && (
                  <div className="rounded-2xl bg-muted/30 p-4 text-xs text-muted-foreground">
                    <DollarSign className="mr-1 inline h-3 w-3" />
                    Live prices: Gold {fmt(prices.goldPerGram)}/g · Silver{" "}
                    {fmt(prices.silverPerGram)}/g
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2 font-ui font-semibold"
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={handleCalculate}
                    className="flex-1 gap-2 font-ui font-semibold"
                  >
                    Calculate Zakat <Calculator size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3 — Results */}
        {step === 3 && result && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading">Your Zakat Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/40 p-5 text-center">
                    <p className="font-ui text-xs font-medium text-muted-foreground">
                      Total Assets
                    </p>
                    <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                      {fmt(result.totalAssets)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-5 text-center">
                    <p className="font-ui text-xs font-medium text-muted-foreground">
                      Nisab Threshold
                    </p>
                    <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                      {fmt(result.nisabThreshold)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {result.nisabStandard === "gold" ? "85g Gold" : "595g Silver"} standard
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary p-5 text-center text-primary-foreground">
                    <p className="font-ui text-xs font-medium opacity-80">
                      {result.isJafari ? "Total Due" : "Zakat Due (2.5%)"}
                    </p>
                    <p className="mt-1.5 font-heading text-lg font-bold">
                      {fmt(result.zakatDue)}
                    </p>
                  </div>
                </div>

                {!result.isAboveNisab && !result.isJafari && (
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center text-sm text-foreground">
                    Your net assets are below the Nisab threshold. No Zakat is due at this time.
                  </div>
                )}

                {result.isJafari && (
                  <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div className="text-sm text-foreground">
                      <strong>Ja'fari Calculation:</strong> Cash, investments, and business inventory
                      are subject to <strong>Khums (20%)</strong>. Only gold and silver are subject to
                      standard Zakat (2.5%).
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">
                    Breakdown
                  </h3>
                  <div className="space-y-2">
                    {result.breakdown.map((b) => (
                      <div
                        key={b.category}
                        className="flex items-center justify-between rounded-xl border border-border/40 px-5 py-3.5"
                      >
                        <div>
                          <p className="font-ui text-sm font-medium text-foreground">
                            {b.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmt(Math.abs(b.amount))}
                          </p>
                        </div>
                        <span className="font-ui text-sm font-semibold text-primary">
                          {b.zakatOn > 0 ? fmt(b.zakatOn) : "\u2014"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                  }}
                  className="w-full gap-2 font-ui font-semibold"
                >
                  <ArrowLeft size={16} /> Start Over
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Tatheer (Purification) Tab
// ============================================================

function TatheerTab() {
  // Form state
  const [symbolInput, setSymbolInput] = useState("");
  const [shares, setShares] = useState<number | "">("");
  const [suggestions, setSuggestions] = useState<DJIMStock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Screening state
  const [screenResult, setScreenResult] = useState<
    | { type: "haram"; symbol: string; haramIndustry: string }
    | { type: "unknown"; symbol: string }
    | { type: "loading" }
    | { type: "result"; data: TatheerResult }
    | { type: "error"; message: string }
    | null
  >(null);

  // Load DJIM data on mount
  useEffect(() => {
    loadDJIMData();
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSymbolChange = (value: string) => {
    setSymbolInput(value);
    if (value.trim().length > 0) {
      const results = searchStocks(value);
      setSuggestions(results.slice(0, 8));
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (stock: DJIMStock) => {
    setSymbolInput(stock.symbol);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    const symbol = symbolInput.toUpperCase().trim();
    if (!symbol || !shares) return;

    // 1. Local haram screening
    const localStock = findStock(symbol);
    if (localStock && localStock.status === "NOT HALAL") {
      const haramIndustry = HARAM_INDUSTRY_MAP[symbol] || localStock.sector;
      setScreenResult({ type: "haram", symbol, haramIndustry });
      return;
    }

    // 2. Check if HALAL or in DJIM index
    const isHalal = localStock && localStock.status === "HALAL";
    const inDJIM = isDJIMStock(symbol);

    if (isHalal || inDJIM) {
      setScreenResult({ type: "loading" });
      try {
        const getTatheerData = httpsCallable<
          { symbol: string; shares: number },
          TatheerResult
        >(functions, "getTatheerData");
        const response = await getTatheerData({ symbol, shares: Number(shares) });
        setScreenResult({ type: "result", data: response.data });
      } catch (err: any) {
        setScreenResult({
          type: "error",
          message: err?.message || "Failed to fetch tatheer data. Please try again.",
        });
      }
      return;
    }

    // 3. Unknown stock
    setScreenResult({ type: "unknown", symbol });
  };

  const handleReset = () => {
    setSymbolInput("");
    setShares("");
    setScreenResult(null);
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <TrendingUp size={20} />
            Stock Purification Calculator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculate the amount to purify from dividends of Shariah-compliant stocks
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Symbol input with autocomplete */}
          <div className="relative" ref={suggestionsRef}>
            <Label className="font-ui text-sm font-medium">Stock Symbol</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={symbolInput}
                onChange={(e) => handleSymbolChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search by symbol or company name..."
                className="bg-card pl-10"
                autoComplete="off"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => selectSuggestion(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50"
                  >
                    <span className="font-ui text-sm font-semibold text-foreground">
                      {s.symbol}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">{s.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{s.sector}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Number of shares */}
          <div>
            <Label className="font-ui text-sm font-medium">Number of Shares</Label>
            <Input
              type="number"
              min={1}
              value={shares}
              onChange={(e) => setShares(e.target.value ? Number(e.target.value) : "")}
              placeholder="e.g. 100"
              className="mt-1.5 bg-card"
            />
          </div>

          <div className="flex gap-3">
            {screenResult && (
              <Button variant="outline" onClick={handleReset} className="gap-2 font-ui font-semibold">
                <ArrowLeft size={16} /> Reset
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!symbolInput.trim() || !shares || screenResult?.type === "loading"}
              className="flex-1 gap-2 font-ui font-semibold"
            >
              {screenResult?.type === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Calculating...
                </>
              ) : (
                <>
                  Calculate Purification <Calculator size={16} />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results area */}
      <AnimatePresence mode="wait">
        {/* Loading */}
        {screenResult?.type === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="mt-4 font-ui text-sm text-muted-foreground">
                  Fetching dividend and compliance data...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Haram warning */}
        {screenResult?.type === "haram" && (
          <motion.div
            key="haram"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
                  <div className="space-y-2">
                    <p className="font-ui text-sm font-semibold text-destructive">
                      {screenResult.symbol} is not Shariah-compliant ({screenResult.haramIndustry})
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      Tatheer (purification) does not apply to haram stocks. Islamic scholars
                      recommend selling this position immediately and donating any gains from haram
                      holdings to charity to cleanse your portfolio. This does not count as sadaqah
                      — it is an obligation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CharitySection className="mt-6" />
          </motion.div>
        )}

        {/* Unknown stock warning */}
        {screenResult?.type === "unknown" && (
          <motion.div
            key="unknown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-yellow-500/30 bg-yellow-500/5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                  <p className="text-sm text-foreground">
                    This stock isn't in our index. Please verify its halal status on our{" "}
                    <a href="/screener" className="font-medium text-primary underline underline-offset-2">
                      Screener
                    </a>{" "}
                    first.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error */}
        {screenResult?.type === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <p className="text-sm text-foreground">{screenResult.message}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tatheer results */}
        {screenResult?.type === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stock info card */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  {screenResult.data.symbol} — {screenResult.data.companyName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/40 p-4 text-center">
                    <p className="font-ui text-xs font-medium text-muted-foreground">
                      Dividend Per Share
                    </p>
                    <p className="mt-1 font-heading text-lg font-bold text-foreground">
                      {fmt(screenResult.data.dividendPerShare)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-4 text-center">
                    <p className="font-ui text-xs font-medium text-muted-foreground">Frequency</p>
                    <p className="mt-1 font-heading text-lg font-bold text-foreground">
                      {screenResult.data.frequency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calculation breakdown or no-dividend message */}
            {screenResult.data.hasDividend ? (
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-base">Calculation Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border/40 px-5 py-3.5">
                    <div>
                      <p className="font-ui text-sm font-medium text-foreground">Total Dividends</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(shares).toLocaleString()} shares × {fmt(screenResult.data.dividendPerShare)}
                      </p>
                    </div>
                    <span className="font-ui text-sm font-semibold text-foreground">
                      {fmt(screenResult.data.totalDividends)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border/40 px-5 py-3.5">
                    <div>
                      <p className="font-ui text-sm font-medium text-foreground">
                        Non-Compliant Revenue Ratio
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Percentage of revenue from non-compliant sources
                      </p>
                    </div>
                    <span className="font-ui text-sm font-semibold text-foreground">
                      {pct(screenResult.data.nonCompliantRatio)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4">
                    <div>
                      <p className="font-ui text-sm font-semibold text-foreground">
                        Purification Amount
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(screenResult.data.totalDividends)} × {pct(screenResult.data.nonCompliantRatio)}
                      </p>
                    </div>
                    <span className="font-heading text-lg font-bold text-primary">
                      {fmt(screenResult.data.purificationAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground">
                      This stock doesn't pay dividends. No purification is needed at this time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charity section when purification > 0 */}
            {screenResult.data.hasDividend && screenResult.data.purificationAmount > 0 && (
              <CharitySection />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Charity Section
// ============================================================

function CharitySection({ className = "" }: { className?: string }) {
  return (
    <Card className={`border-primary/20 bg-primary/5 shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2 text-base">
          <Heart size={18} className="text-primary" />
          Donate to Purify
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed">
          The purification amount should be donated to charity. This is not considered sadaqah
          (voluntary charity) — it is an obligation to cleanse your earnings from non-compliant
          revenue sources.
        </p>

        <div className="space-y-2">
          <p className="font-ui text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recommended Charities
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: "Islamic Relief USA", url: "https://irusa.org" },
              { name: "ICNA Relief", url: "https://icnarelief.org" },
              { name: "Helping Hand for Relief", url: "https://hhrd.org" },
              { name: "Penny Appeal USA", url: "https://pennyappealusa.org" },
            ].map((charity) => (
              <a
                key={charity.name}
                href={charity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border/40 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                <Heart size={14} className="shrink-0 text-primary" />
                {charity.name}
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Page Root
// ============================================================

export default function Zakat() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Zakat & Tatheer
        </h1>
        <p className="mt-3 text-muted-foreground">
          Calculate your obligations and purify your investments
        </p>
      </div>

      <Tabs defaultValue="zakat" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-2">
          <TabsTrigger value="zakat" className="font-ui font-semibold">
            <Calculator size={16} className="mr-2" />
            Zakat Calculator
          </TabsTrigger>
          <TabsTrigger value="tatheer" className="font-ui font-semibold">
            <TrendingUp size={16} className="mr-2" />
            Tatheer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zakat">
          <ZakatCalculatorTab />
        </TabsContent>

        <TabsContent value="tatheer">
          <TatheerTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
