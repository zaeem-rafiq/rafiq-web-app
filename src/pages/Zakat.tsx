import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ArrowRight, ArrowLeft, Info, DollarSign, ExternalLink, Heart, Sparkles, Scale } from "lucide-react";
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

const madhabs: Madhab[] = ["Hanafi", "Shafi'i", "Maliki", "Hanbali", "Ja'fari"];

const FALLBACK_PRICES: MetalPrices = { goldPerGram: 75.5, silverPerGram: 0.92 };

const CHARITIES = [
  {
    name: "Islamic Relief USA",
    url: "https://www.every.org/islamic-relief-usa",
    desc: "Global humanitarian aid and development",
  },
  {
    name: "ICNA Relief",
    url: "https://www.every.org/icna-relief",
    desc: "Emergency relief and social services across North America",
  },
  {
    name: "Helping Hand for Relief and Development",
    url: "https://www.every.org/hhrd",
    desc: "Disaster relief and community development worldwide",
  },
  {
    name: "Penny Appeal USA",
    url: "https://www.every.org/penny-appeal-usa",
    desc: "Fighting poverty with sustainable development programs",
  },
  {
    name: "Zakat Foundation of America",
    url: "https://www.every.org/zakat-foundation-of-america",
    desc: "Zakat collection and distribution to eligible recipients",
  },
];

function CharitySection({ heading }: { heading: string }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {heading}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fulfill your obligation through trusted platforms
        </p>
      </div>

      {/* LaunchGood CTA */}
      <a
        href="https://www.launchgood.com/discover#checks[categories]=Zakat"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-ui text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#C9A962", color: "#2C2C2C" }}
      >
        Give on LaunchGood <ExternalLink size={16} />
      </a>

      {/* Recommended Charities */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold" style={{ color: "#1B4D3E" }}>
          Recommended Charities
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHARITIES.map((charity) => (
            <a
              key={charity.name}
              href={charity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-border/40 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="font-ui text-sm font-semibold" style={{ color: "#1B4D3E" }}>
                {charity.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{charity.desc}</p>
              <span
                className="mt-3 inline-flex items-center gap-1 font-ui text-xs font-semibold"
                style={{ color: "#C9A962" }}
              >
                Donate <ArrowRight size={12} />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground">
        Rafiq does not process donations directly. You will be redirected to the charity's page.
      </p>
    </div>
  );
}

export default function Zakat() {
  // -- Zakat state --
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

  // -- Tatheer state --
  const [tatheerDividends, setTatheerDividends] = useState(0);
  const [tatheerRatio, setTatheerRatio] = useState(0);
  const [tatheerResult, setTatheerResult] = useState<number | null>(null);

  // -- Khums state --
  const [khumsIncome, setKhumsIncome] = useState(0);
  const [khumsExpenses, setKhumsExpenses] = useState(0);
  const [khumsResult, setKhumsResult] = useState<{ surplus: number; khums: number; imam: number; sadat: number } | null>(null);

  // -- Sadaqah state --
  const [sadaqahAmount, setSadaqahAmount] = useState<number | null>(null);
  const [sadaqahCustom, setSadaqahCustom] = useState("");
  const [showSadaqahCharities, setShowSadaqahCharities] = useState(false);

  // Fetch live metal prices
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
          }
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

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const handleTatheerCalculate = () => {
    setTatheerResult(tatheerDividends * (tatheerRatio / 100));
  };

  const handleKhumsCalculate = () => {
    const surplus = khumsIncome - khumsExpenses;
    if (surplus > 0) {
      const khums = surplus * 0.2;
      setKhumsResult({ surplus, khums, imam: khums / 2, sadat: khums / 2 });
    } else {
      setKhumsResult({ surplus, khums: 0, imam: 0, sadat: 0 });
    }
  };

  const sadaqahPresets = [25, 50, 100, 250];

  const handleSadaqahSelect = (amount: number) => {
    setSadaqahAmount(amount);
    setSadaqahCustom("");
    setShowSadaqahCharities(true);
  };

  const handleSadaqahCustomConfirm = () => {
    const val = parseFloat(sadaqahCustom);
    if (val > 0) {
      setSadaqahAmount(val);
      setShowSadaqahCharities(true);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Islamic Giving
        </h1>
        <p className="mt-3 text-muted-foreground">
          Calculate your obligations and give with confidence
        </p>
      </div>

      <Tabs defaultValue="zakat" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-4">
          <TabsTrigger value="zakat" className="font-ui font-semibold">
            <Calculator size={14} className="mr-1.5" /> Zakat
          </TabsTrigger>
          <TabsTrigger value="tatheer" className="font-ui font-semibold">
            <Sparkles size={14} className="mr-1.5" /> Tatheer
          </TabsTrigger>
          <TabsTrigger value="khums" className="font-ui font-semibold">
            <Scale size={14} className="mr-1.5" /> Khums
          </TabsTrigger>
          <TabsTrigger value="sadaqah" className="font-ui font-semibold">
            <Heart size={14} className="mr-1.5" /> Sadaqah
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ ZAKAT TAB ═══════════════ */}
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
                          <span className={`font-ui text-xs font-medium ${nisabStandard === "silver" ? "text-foreground" : "text-muted-foreground"}`}>
                            Silver
                          </span>
                          <Switch
                            checked={nisabStandard === "gold"}
                            onCheckedChange={(c) => setNisabStandard(c ? "gold" : "silver")}
                          />
                          <span className={`font-ui text-xs font-medium ${nisabStandard === "gold" ? "text-foreground" : "text-muted-foreground"}`}>
                            Gold
                          </span>
                        </div>
                      </div>
                    )}

                    {madhab === "Ja'fari" && (
                      <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                        <p className="text-sm text-foreground">
                          Cash and investments fall under <strong>Khums (20%)</strong>, not Zakat.
                          Zakat applies to gold, silver, livestock, and crops.
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
                      <Button variant="outline" onClick={() => setStep(1)} className="gap-2 font-ui font-semibold">
                        <ArrowLeft size={16} /> Back
                      </Button>
                      <Button onClick={handleCalculate} className="flex-1 gap-2 font-ui font-semibold">
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
                        <p className="font-ui text-xs font-medium text-muted-foreground">Total Assets</p>
                        <p className="mt-1.5 font-heading text-lg font-bold text-foreground">{fmt(result.totalAssets)}</p>
                      </div>
                      <div className="rounded-2xl bg-muted/40 p-5 text-center">
                        <p className="font-ui text-xs font-medium text-muted-foreground">Nisab Threshold</p>
                        <p className="mt-1.5 font-heading text-lg font-bold text-foreground">{fmt(result.nisabThreshold)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {result.nisabStandard === "gold" ? "85g Gold" : "595g Silver"} standard
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary p-5 text-center text-primary-foreground">
                        <p className="font-ui text-xs font-medium opacity-80">
                          {result.isJafari ? "Total Due" : "Zakat Due (2.5%)"}
                        </p>
                        <p className="mt-1.5 font-heading text-lg font-bold">{fmt(result.zakatDue)}</p>
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
                          are subject to <strong>Khums (20%)</strong>. Only gold and silver are subject
                          to standard Zakat (2.5%).
                        </div>
                      </div>
                    )}

                    {/* Breakdown */}
                    <div>
                      <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">Breakdown</h3>
                      <div className="space-y-2">
                        {result.breakdown.map((b) => (
                          <div
                            key={b.category}
                            className="flex items-center justify-between rounded-xl border border-border/40 px-5 py-3.5"
                          >
                            <div>
                              <p className="font-ui text-sm font-medium text-foreground">{b.category}</p>
                              <p className="text-xs text-muted-foreground">{fmt(Math.abs(b.amount))}</p>
                            </div>
                            <span className="font-ui text-sm font-semibold text-primary">
                              {b.zakatOn > 0 ? fmt(b.zakatOn) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" onClick={() => { setStep(1); setResult(null); }} className="w-full gap-2 font-ui font-semibold">
                      <ArrowLeft size={16} /> Start Over
                    </Button>
                  </CardContent>
                </Card>

                {result.zakatDue > 0 && <CharitySection heading="Pay Your Zakat" />}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ═══════════════ TATHEER TAB ═══════════════ */}
        <TabsContent value="tatheer">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">Dividend Purification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm text-foreground">
                  When investing in halal stocks that have minor non-compliant income (e.g., interest),
                  you must purify your dividends by donating the haram portion.
                </p>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Total Dividends Received</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    USD
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={tatheerDividends || ""}
                    onChange={(e) => setTatheerDividends(parseFloat(e.target.value) || 0)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Non-Compliant Income Ratio</Label>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Check the stock's interest income ratio on our Screener
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={tatheerRatio || ""}
                    onChange={(e) => setTatheerRatio(parseFloat(e.target.value) || 0)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Formula */}
              <div className="rounded-2xl bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Purification Amount = Dividends × (Non-compliant Ratio ÷ 100)
              </div>

              <Button
                onClick={handleTatheerCalculate}
                className="w-full gap-2 font-ui font-semibold"
                disabled={tatheerDividends <= 0 || tatheerRatio <= 0}
              >
                Calculate Purification <Sparkles size={16} />
              </Button>

              {tatheerResult !== null && (
                <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#C9A962" }}>
                  <p className="font-ui text-xs font-medium" style={{ color: "#2C2C2C" }}>
                    Purification Amount
                  </p>
                  <p className="mt-1.5 font-heading text-2xl font-bold" style={{ color: "#2C2C2C" }}>
                    {fmt(tatheerResult)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {tatheerResult !== null && tatheerResult > 0 && (
            <CharitySection heading="Purify Your Dividends" />
          )}
        </TabsContent>

        {/* ═══════════════ KHUMS TAB ═══════════════ */}
        <TabsContent value="khums">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">Khums Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm text-foreground">
                  Khums is an obligation in the Ja'fari (Shia) school of thought. It requires paying
                  20% of annual surplus income — the amount remaining after all legitimate living expenses.
                </p>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Total Annual Income</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    USD
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={khumsIncome || ""}
                    onChange={(e) => setKhumsIncome(parseFloat(e.target.value) || 0)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Total Annual Expenses</Label>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Include all legitimate living expenses: housing, food, transportation, education,
                  healthcare, clothing, etc.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    USD
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={khumsExpenses || ""}
                    onChange={(e) => setKhumsExpenses(parseFloat(e.target.value) || 0)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Formula */}
              <div className="rounded-2xl bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Surplus = Income − Expenses. If surplus &gt; 0, Khums = Surplus × 20%
              </div>

              <Button
                onClick={handleKhumsCalculate}
                className="w-full gap-2 font-ui font-semibold"
                disabled={khumsIncome <= 0}
              >
                Calculate Khums <Scale size={16} />
              </Button>

              {khumsResult !== null && (
                <div className="space-y-3">
                  {/* Surplus summary */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-muted/40 p-5 text-center">
                      <p className="font-ui text-xs font-medium text-muted-foreground">Annual Surplus</p>
                      <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                        {fmt(Math.max(0, khumsResult.surplus))}
                      </p>
                    </div>
                    <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#C9A962" }}>
                      <p className="font-ui text-xs font-medium" style={{ color: "#2C2C2C" }}>
                        Khums Due (20%)
                      </p>
                      <p className="mt-1.5 font-heading text-lg font-bold" style={{ color: "#2C2C2C" }}>
                        {fmt(khumsResult.khums)}
                      </p>
                    </div>
                  </div>

                  {khumsResult.khums > 0 ? (
                    <div className="space-y-2">
                      <h3 className="font-heading text-sm font-semibold text-foreground">Breakdown</h3>
                      <div className="flex items-center justify-between rounded-xl border border-border/40 px-5 py-3.5">
                        <div>
                          <p className="font-ui text-sm font-medium" style={{ color: "#1B4D3E" }}>
                            Sahm al-Imam (50%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Traditionally given to a qualified Marja or their representative
                          </p>
                        </div>
                        <span className="font-ui text-sm font-semibold" style={{ color: "#C9A962" }}>
                          {fmt(khumsResult.imam)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-border/40 px-5 py-3.5">
                        <div>
                          <p className="font-ui text-sm font-medium" style={{ color: "#1B4D3E" }}>
                            Sahm al-Sadat (50%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Given to Sayyids (descendants of the Prophet ﷺ) in need
                          </p>
                        </div>
                        <span className="font-ui text-sm font-semibold" style={{ color: "#C9A962" }}>
                          {fmt(khumsResult.sadat)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center text-sm text-foreground">
                      Your expenses meet or exceed your income. No Khums is due at this time.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {khumsResult !== null && khumsResult.khums > 0 && (
            <CharitySection heading="Pay Your Khums" />
          )}
        </TabsContent>

        {/* ═══════════════ SADAQAH TAB ═══════════════ */}
        <TabsContent value="sadaqah">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">Voluntary Charity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm text-foreground">
                  Sadaqah is voluntary charity given beyond your zakat obligation. Unlike zakat,
                  sadaqah can be given to anyone in need, at any time, in any amount.
                </p>
              </div>

              <div>
                <p className="mb-3 font-ui text-sm font-medium text-foreground">Choose an amount</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {sadaqahPresets.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleSadaqahSelect(amt)}
                      className={`rounded-2xl px-4 py-3 font-ui text-sm font-semibold transition-all ${
                        sadaqahAmount === amt && sadaqahCustom === ""
                          ? "shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                      style={
                        sadaqahAmount === amt && sadaqahCustom === ""
                          ? { backgroundColor: "#C9A962", color: "#2C2C2C" }
                          : undefined
                      }
                    >
                      {fmt(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-ui text-sm font-medium">Custom Amount</Label>
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      USD
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={sadaqahCustom}
                      onChange={(e) => {
                        setSadaqahCustom(e.target.value);
                        setSadaqahAmount(null);
                        setShowSadaqahCharities(false);
                      }}
                      className="bg-card pl-14"
                      placeholder="Enter amount"
                    />
                  </div>
                  <Button
                    onClick={handleSadaqahCustomConfirm}
                    disabled={!sadaqahCustom || parseFloat(sadaqahCustom) <= 0}
                    className="gap-2 font-ui font-semibold"
                  >
                    Give <Heart size={16} />
                  </Button>
                </div>
              </div>

              {showSadaqahCharities && sadaqahAmount && sadaqahAmount > 0 && (
                <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#C9A962" }}>
                  <p className="font-ui text-xs font-medium" style={{ color: "#2C2C2C" }}>
                    Your Sadaqah
                  </p>
                  <p className="mt-1.5 font-heading text-2xl font-bold" style={{ color: "#2C2C2C" }}>
                    {fmt(sadaqahAmount)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {showSadaqahCharities && sadaqahAmount && sadaqahAmount > 0 && (
            <CharitySection heading="Give Sadaqah" />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
