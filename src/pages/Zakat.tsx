import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  Heart,
  Search,
  ExternalLink,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
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
import { loadDJIMData, type DJIMStock } from "@/data/halal-stocks";

const madhabs: Madhab[] = ["Hanafi", "Shafi'i", "Maliki", "Hanbali", "Ja'fari"];

const FALLBACK_PRICES: MetalPrices = { goldPerGram: 75.5, silverPerGram: 0.92 };

const CHARITIES = [
  { name: "Islamic Relief USA", url: "https://every.org/islamic-relief-usa" },
  { name: "ICNA Relief", url: "https://every.org/icna-relief" },
  { name: "Helping Hand HHRD", url: "https://every.org/hhrd" },
  { name: "Penny Appeal USA", url: "https://every.org/penny-appeal-usa" },
  { name: "Zakat Foundation of America", url: "https://every.org/zakat-foundation-of-america" },
];

const SADAQAH_PRESETS = [25, 50, 100, 250];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/* ─── Shared Charity Section ─── */

function CharitySection({ activeTab, amount }: { activeTab: string; amount: number }) {
  const headings: Record<string, string> = {
    zakat: "Give Your Zakat",
    tatheer: "Purify Your Earnings",
    khums: "Fulfill Your Khums",
    sadaqah: "Give Sadaqah",
  };

  return (
    <div className="mt-10 space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {headings[activeTab] || "Give With Confidence"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your calculated amount:{" "}
          <span className="font-semibold text-foreground">{fmt(amount)}</span>
        </p>
      </div>

      {/* LaunchGood Button */}
      <div className="text-center">
        <a
          href="https://www.launchgood.com/discover#checks[categories]=Zakat"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            className="gap-2 font-ui font-semibold text-white"
            style={{ backgroundColor: "#C9A962" }}
          >
            Browse on LaunchGood <ExternalLink size={16} />
          </Button>
        </a>
      </div>

      {/* Charity Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHARITIES.map((charity) => (
          <Card key={charity.name} className="border-border/50 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <span className="font-ui text-sm font-medium" style={{ color: "#2D5A3D" }}>
                {charity.name}
              </span>
              <a
                href={charity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-ui text-sm font-semibold transition-colors hover:underline"
                style={{ color: "#C9A962" }}
              >
                Donate →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground">
        Rafiq is not affiliated with any of the above organizations. Please verify each
        charity's credentials and ensure your donation meets your scholarly and personal
        requirements.
      </p>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Zakat() {
  const [activeTab, setActiveTab] = useState("zakat");

  // --- Zakat Calculator State ---
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
    livestock: 0,
    crops: 0,
    debtsOwed: 0,
  });
  const [result, setResult] = useState<ZakatResult | null>(null);

  // --- Tatheer State ---
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState<number>(0);
  const [tatheerLoading, setTatheerLoading] = useState(false);
  const [tatheerData, setTatheerData] = useState<{
    hasDividend?: boolean;
    companyName: string;
    annualDividend?: number;
    quarterlyDividend?: number;
    totalAnnualDividends?: number;
    totalQuarterlyDividends?: number;
    nonCompliantRatio?: number;
    annualPurification?: number;
    quarterlyPurification?: number;
    shares?: number;
  } | null>(null);
  const [tatheerError, setTatheerError] = useState<string | null>(null);

  // --- Ticker Autocomplete State ---
  const [tickerInput, setTickerInput] = useState("");
  const [djimStocks, setDjimStocks] = useState<DJIMStock[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Khums State ---
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  // --- Sadaqah State ---
  const [sadaqahAmount, setSadaqahAmount] = useState<number>(0);
  const [customSadaqah, setCustomSadaqah] = useState<string>("");

  // Fetch live metal prices
  useEffect(() => {
    async function fetchPrices() {
      try {
        const resp = await fetch("https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=gram");
        const data = await resp.json();
        if (data.metals?.gold && data.metals?.silver) {
          setPrices({ goldPerGram: data.metals.gold, silverPerGram: data.metals.silver });
        }
      } catch {
        // Use fallback
      } finally {
        setPricesLoading(false);
      }
    }
    fetchPrices();
  }, []);

  // Load DJIM data on mount
  useEffect(() => {
    loadDJIMData().then(setDjimStocks);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter DJIM stocks based on input
  const isExactTicker = /^[A-Z]{1,5}$/.test(tickerInput);
  const filteredStocks = (() => {
    if (!tickerInput.trim() || isExactTicker) return [];
    const q = tickerInput.toLowerCase();
    return djimStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  })();

  const handleTickerInputChange = useCallback(
    (value: string) => {
      setTickerInput(value);
      const upper = value.trim().toUpperCase();
      if (/^[A-Z]{1,5}$/.test(upper)) {
        // Check if it's a known DJIM ticker symbol
        const isKnownTicker = djimStocks.some(s => s.symbol === upper);
        // Also check if the input matches any company name
        const q = value.trim().toLowerCase();
        const nameMatches = djimStocks.filter(s =>
          s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q)
        );
        if (isKnownTicker && nameMatches.length <= 1) {
          // Unambiguous known ticker (e.g., "AAPL") — lock it in
          setTicker(upper);
          setShowDropdown(false);
        } else if (nameMatches.length > 0) {
          // Could be a company name like "Apple" that also passes regex — show dropdown
          setTicker("");
          setShowDropdown(true);
        } else {
          // Unknown short alpha string — assume it's a ticker attempt (e.g., "XYZ")
          setTicker(upper);
          setShowDropdown(false);
        }
      } else {
        setTicker("");
        setShowDropdown(value.trim().length > 0);
      }
    },
    [djimStocks],
  );

  const handleSuggestionClick = useCallback(
    (stock: DJIMStock) => {
      setTicker(stock.symbol);
      setTickerInput(`${stock.name} (${stock.symbol})`);
      setShowDropdown(false);
    },
    [],
  );

  const showNisabToggle = ["Shafi'i", "Maliki", "Hanbali"].includes(madhab);

  const handleCalculate = () => {
    const res = calculateZakat(assets, madhab, prices, nisabStandard);
    setResult(res);
    setStep(3);
  };

  const updateAsset = (key: keyof ZakatAssets, value: string) => {
    setAssets((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  // --- Tatheer Logic ---
  const handleTatheerLookup = async () => {
    // Resolve ticker from either ticker state or tickerInput
    let resolvedTicker = ticker.trim().toUpperCase();

    if (/^[A-Z]{1,5}$/.test(resolvedTicker)) {
      // ticker is already a valid symbol, use directly
    } else if (tickerInput.trim()) {
      // Try to resolve from djimStocks by name
      const q = tickerInput.trim().toLowerCase();
      const match = djimStocks.find(s =>
        s.name.toLowerCase().includes(q) || s.symbol.toLowerCase() === q
      );
      if (match) {
        resolvedTicker = match.symbol;
      } else {
        // Fallback: clean company name and send to API (FMP search will resolve)
        // Strip common suffixes that confuse FMP search
        const cleaned = tickerInput.trim()
          .replace(/\b(Inc\.?|Corp\.?|Co\.?|Ltd\.?|LLC|PLC|Group|Company|Corporation|Incorporated)\s*$/i, "")
          .trim();
        resolvedTicker = (cleaned || tickerInput.trim()).toUpperCase();
      }
    } else {
      return; // Nothing to look up
    }

    // Use tickerInput for display fallback (user-friendly name)
    const displayFallback = tickerInput.trim() || resolvedTicker;

    console.log("djimStocks length:", djimStocks.length, "resolvedTicker:", resolvedTicker);
    setTatheerLoading(true);
    setTatheerError(null);
    setTatheerData(null);

    try {
      const callGetTatheerData = httpsCallable(functions, "getTatheerData");
      const result = await callGetTatheerData({ symbol: resolvedTicker, shares: shares });
      const raw = result.data as any;
      // httpsCallable may nest the actual payload under a `data` or `result` key
      const data = raw?.data ?? raw?.result ?? raw;
      console.log("getTatheerData raw response:", raw);
      console.log("getTatheerData unwrapped data:", data);

      if (data.hasDividend === false) {
        setTatheerData({ hasDividend: false, companyName: data.companyName || displayFallback });
      } else {
        setTatheerData({
          hasDividend: true,
          companyName: data.companyName || displayFallback,
          annualDividend: Number(data.annualDividend) || 0,
          quarterlyDividend: Number(data.quarterlyDividend) || 0,
          totalAnnualDividends: Number(data.totalAnnualDividends) || 0,
          totalQuarterlyDividends: Number(data.totalQuarterlyDividends) || 0,
          nonCompliantRatio: Number(data.nonCompliantRatio) || 0,
          annualPurification: Number(data.annualPurification) || 0,
          quarterlyPurification: Number(data.quarterlyPurification) || 0,
          shares: Number(data.shares) || 0,
        });
      }
    } catch (err) {
      console.error("getTatheerData error:", err);
      setTatheerError("Failed to fetch Tatheer data. Please try again.");
    } finally {
      setTatheerLoading(false);
    }
  };

  // --- Khums Logic ---
  const khumsSurplus = Math.max(0, totalIncome - totalExpenses);
  const khumsAmount = khumsSurplus * 0.2;
  const sahmAlImam = khumsAmount * 0.5;
  const sahmAlSadat = khumsAmount * 0.5;

  // --- Sadaqah Logic ---
  const handleSadaqahPreset = (amount: number) => {
    setSadaqahAmount(amount);
    setCustomSadaqah("");
  };

  const handleCustomSadaqah = (value: string) => {
    setCustomSadaqah(value);
    const parsed = parseFloat(value);
    setSadaqahAmount(parsed > 0 ? parsed : 0);
  };

  // --- Active amount for CharitySection ---
  const getActiveAmount = (): number => {
    switch (activeTab) {
      case "zakat":
        return result?.zakatDue ?? 0;
      case "tatheer":
        return tatheerData?.annualPurification ?? 0;
      case "khums":
        return khumsAmount;
      case "sadaqah":
        return sadaqahAmount;
      default:
        return 0;
    }
  };

  const activeAmount = getActiveAmount();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Islamic Giving
        </h1>
        <p className="mt-3 text-muted-foreground">
          Calculate your obligations and give with confidence
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-4">
          <TabsTrigger value="zakat" className="font-ui text-xs sm:text-sm">
            Zakat Calculator
          </TabsTrigger>
          <TabsTrigger value="tatheer" className="font-ui text-xs sm:text-sm">
            Tatheer
          </TabsTrigger>
          <TabsTrigger value="khums" className="font-ui text-xs sm:text-sm">
            Khums
          </TabsTrigger>
          <TabsTrigger value="sadaqah" className="font-ui text-xs sm:text-sm">
            Sadaqah
          </TabsTrigger>
        </TabsList>

        {/* ========== ZAKAT CALCULATOR TAB ========== */}
        <TabsContent value="zakat">
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
                  <div
                    className={`h-0.5 w-10 rounded-full ${step > s ? "bg-primary" : "bg-muted"}`}
                  />
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
                          <p className="font-ui text-sm font-medium text-foreground">
                            Nisab Standard
                          </p>
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
                          Cash and investments fall under <strong>Khums (20%)</strong>, not
                          Zakat. Zakat applies to gold, silver, livestock, and crops.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => setStep(2)}
                      className="w-full gap-2 font-ui font-semibold"
                    >
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
                    {madhab === "Ja'fari" && (
                      <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <p className="text-sm text-foreground">
                          Under Ja'fari fiqh, Zakat applies to gold, silver, livestock, and
                          crops. For cash and investment obligations, use the{" "}
                          <strong>Khums</strong> tab.
                        </p>
                      </div>
                    )}

                    {(madhab === "Ja'fari"
                      ? [
                          { key: "gold" as const, label: "Gold", unit: "grams" },
                          { key: "silver" as const, label: "Silver", unit: "grams" },
                          { key: "livestock" as const, label: "Livestock", unit: "USD" },
                          { key: "crops" as const, label: "Agricultural Produce / Crops", unit: "USD" },
                          { key: "debtsOwed" as const, label: "Debts Owed (Deductions)", unit: "USD" },
                        ]
                      : [
                          { key: "cash" as const, label: "Cash & Bank Accounts", unit: "USD" },
                          { key: "gold" as const, label: "Gold", unit: "grams" },
                          { key: "silver" as const, label: "Silver", unit: "grams" },
                          { key: "investments" as const, label: "Investments", unit: "USD" },
                          { key: "businessInventory" as const, label: "Business Inventory", unit: "USD" },
                          { key: "debtsOwed" as const, label: "Debts Owed (Deductions)", unit: "USD" },
                        ]
                    ).map((field) => (
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
                    {/* Summary */}
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
                          {result.nisabStandard === "gold" ? "85g Gold" : "595g Silver"}{" "}
                          standard
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary p-5 text-center text-primary-foreground">
                        <p className="font-ui text-xs font-medium opacity-80">
                          Zakat Due (2.5%)
                        </p>
                        <p className="mt-1.5 font-heading text-lg font-bold">
                          {fmt(result.zakatDue)}
                        </p>
                      </div>
                    </div>

                    {!result.isAboveNisab && !result.isJafari && (
                      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center text-sm text-foreground">
                        Your net assets are below the Nisab threshold. No Zakat is due at
                        this time.
                      </div>
                    )}

                    {result.isJafari && (
                      <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <div className="text-sm text-foreground">
                          <strong>Ja'fari Calculation:</strong> Zakat (2.5%) applies to
                          gold, silver, livestock, and agricultural produce. For cash and
                          investment obligations, use the <strong>Khums</strong> tab.
                        </div>
                      </div>
                    )}

                    {/* Breakdown */}
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
                              {b.zakatOn > 0 ? fmt(b.zakatOn) : "—"}
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
        </TabsContent>

        {/* ========== TATHEER TAB ========== */}
        <TabsContent value="tatheer">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">Stock Purification (Tatheer)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Purify your investment income by calculating the portion of dividends that
                may come from non-halal business activities.
              </p>

              <div ref={dropdownRef}>
                <Label className="font-ui text-sm font-medium">Stock Ticker or Company Name</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => handleTickerInputChange(e.target.value)}
                    onFocus={() => {
                      if (tickerInput.trim() && !isExactTicker) setShowDropdown(true);
                    }}
                    className="bg-card pl-11"
                    placeholder="e.g. AAPL or Apple"
                  />
                  {showDropdown && filteredStocks.length > 0 && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-md border border-border bg-white shadow-lg"
                      style={{ zIndex: 50 }}
                    >
                      {filteredStocks.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:text-white"
                          style={{ backgroundColor: "white" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#2D5A3D";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                            e.currentTarget.style.color = "";
                          }}
                          onClick={() => handleSuggestionClick(stock)}
                        >
                          {stock.name} ({stock.symbol})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Number of Shares</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={shares || ""}
                    onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
                    className="bg-card"
                    placeholder="0"
                  />
                </div>
              </div>

              <Button
                onClick={handleTatheerLookup}
                disabled={tatheerLoading || (!ticker.trim() && !tickerInput.trim())}
                className="w-full gap-2 font-ui font-semibold"
              >
                {tatheerLoading ? (
                  "Looking up…"
                ) : (
                  <>
                    Look Up Dividend Data <Search size={16} />
                  </>
                )}
              </Button>

              {tatheerError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm text-destructive">
                  {tatheerError}
                </div>
              )}

              {tatheerData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    Results for {tatheerData.companyName}
                  </h3>

                  {tatheerData.hasDividend === false ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-5 text-center text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                      <Info className="mx-auto mb-2 h-5 w-5" />
                      This stock doesn't pay dividends. No purification is needed.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Quarterly Column */}
                        <div className="space-y-3">
                          <h4 className="font-heading text-xs font-semibold text-muted-foreground text-center">Quarterly</h4>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Dividend / Share
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              ${(tatheerData.quarterlyDividend ?? 0).toFixed(4)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Total Dividends
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              {fmt(tatheerData.totalQuarterlyDividends ?? 0)}
                            </p>
                          </div>
                          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#C9A96220" }}>
                            <p className="font-ui text-xs font-medium" style={{ color: "#C9A962" }}>
                              Purification
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold" style={{ color: "#C9A962" }}>
                              {fmt(tatheerData.quarterlyPurification ?? 0)}
                            </p>
                          </div>
                        </div>
                        {/* Annual Column */}
                        <div className="space-y-3">
                          <h4 className="font-heading text-xs font-semibold text-muted-foreground text-center">Annual</h4>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Dividend / Share
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              ${(tatheerData.annualDividend ?? 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Total Dividends
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              {fmt(tatheerData.totalAnnualDividends ?? 0)}
                            </p>
                          </div>
                          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#C9A96220" }}>
                            <p className="font-ui text-xs font-medium" style={{ color: "#C9A962" }}>
                              Purification
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold" style={{ color: "#C9A962" }}>
                              {fmt(tatheerData.annualPurification ?? 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {tatheerData.nonCompliantRatio != null && (
                        <p className="text-center text-xs text-muted-foreground">
                          Non-compliant ratio: {(tatheerData.nonCompliantRatio * 100).toFixed(2)}% — Based on latest annual income statement
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== KHUMS TAB ========== */}
        <TabsContent value="khums">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading" style={{ color: "#C9A962" }}>
                Khums Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-3 rounded-2xl p-5" style={{ borderColor: "#C9A96233", backgroundColor: "#C9A96210", borderWidth: 1 }}>
                <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#C9A962" }} />
                <p className="text-sm text-foreground">
                  Khums is an obligation in the Ja'fari school requiring{" "}
                  <strong>20% of annual surplus income</strong>.
                </p>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Total Annual Income</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={totalIncome || ""}
                    onChange={(e) => setTotalIncome(parseFloat(e.target.value) || 0)}
                    className="bg-card pl-8"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">
                  Total Annual Expenses
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={totalExpenses || ""}
                    onChange={(e) => setTotalExpenses(parseFloat(e.target.value) || 0)}
                    className="bg-card pl-8"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/40 p-5 text-center">
                    <p className="font-ui text-xs font-medium text-muted-foreground">
                      Surplus Income
                    </p>
                    <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                      {fmt(khumsSurplus)}
                    </p>
                  </div>
                  <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#C9A96220" }}>
                    <p className="font-ui text-xs font-medium" style={{ color: "#C9A962" }}>
                      Khums Due (20%)
                    </p>
                    <p className="mt-1.5 font-heading text-lg font-bold" style={{ color: "#C9A962" }}>
                      {fmt(khumsAmount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-5 text-center">
                    <p className="font-ui text-xs font-medium text-muted-foreground">
                      Remaining
                    </p>
                    <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                      {fmt(khumsSurplus - khumsAmount)}
                    </p>
                  </div>
                </div>

                {khumsAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Breakdown
                    </h3>
                    <div className="rounded-xl border px-5 py-3.5" style={{ borderColor: "#C9A96233" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-ui text-sm font-medium text-foreground">
                            Sahm al-Imam (50%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Traditionally given to a qualified Marja or their representative
                          </p>
                        </div>
                        <span className="font-ui text-sm font-semibold" style={{ color: "#C9A962" }}>
                          {fmt(sahmAlImam)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border px-5 py-3.5" style={{ borderColor: "#C9A96233" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-ui text-sm font-medium text-foreground">
                            Sahm al-Sadat (50%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Given to Sayyids (descendants of the Prophet &#xFDFA;) in need
                          </p>
                        </div>
                        <span className="font-ui text-sm font-semibold" style={{ color: "#C9A962" }}>
                          {fmt(sahmAlSadat)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== SADAQAH TAB ========== */}
        <TabsContent value="sadaqah">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">
                <Heart className="mr-2 inline h-5 w-5" /> Sadaqah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Sadaqah is voluntary charity given out of compassion, love, friendship, or
                generosity. Unlike Zakat, there is no minimum amount — every act of
                goodness counts.
              </p>

              {/* Preset amounts */}
              <div>
                <Label className="font-ui text-sm font-medium">Quick Give</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SADAQAH_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleSadaqahPreset(amount)}
                      className={`rounded-full px-5 py-2.5 font-ui text-sm font-medium transition-all ${
                        sadaqahAmount === amount && !customSadaqah
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <Label className="font-ui text-sm font-medium">Custom Amount</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={customSadaqah}
                    onChange={(e) => handleCustomSadaqah(e.target.value)}
                    className="bg-card pl-8"
                    placeholder="Enter any amount"
                  />
                </div>
              </div>

              {sadaqahAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-primary p-5 text-center text-primary-foreground"
                >
                  <p className="font-ui text-xs font-medium opacity-80">
                    Your Sadaqah
                  </p>
                  <p className="mt-1.5 font-heading text-2xl font-bold">
                    {fmt(sadaqahAmount)}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shared Charity Section — shown on all tabs when amount > 0 */}
      {activeAmount > 0 && (
        <CharitySection activeTab={activeTab} amount={activeAmount} />
      )}
    </main>
  );
}
