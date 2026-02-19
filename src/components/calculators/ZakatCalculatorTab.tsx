import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Info,
  DollarSign,
  Check,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type Madhab,
  type NisabStandard,
  type ZakatAssets,
  type MetalPrices,
  type ZakatResult,
  calculateZakat,
} from "@/lib/zakat-utils";

const madhabs: Madhab[] = ["hanafi", "shafii", "maliki", "hanbali", "jafari"];

const MADHAB_LABELS: Record<Madhab, string> = {
  hanafi: "Hanafi",
  shafii: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
  jafari: "Ja'fari",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface ZakatCalculatorTabProps {
  onAmountChange: (amount: number) => void;
}

export default function ZakatCalculatorTab({ onAmountChange }: ZakatCalculatorTabProps) {
  const [step, setStep] = useState(1);
  const [madhab, setMadhab] = useState<Madhab>("hanafi");
  const [nisabStandard, setNisabStandard] = useState<NisabStandard>("gold");
  const [prices, setPrices] = useState<MetalPrices>({ goldPerGram: 0, silverPerGram: 0 });
  const [pricesLoading, setPricesLoading] = useState(true);
  const [assets, setAssets] = useState<ZakatAssets>({
    cash: 0,
    gold: 0,
    silver: 0,
    investments: 0,
    businessInventory: 0,
    livestock: 0,
    crops: 0,
    crypto: 0,
    retirementAccounts: 0,
    personalJewelry: 0,
    debtsOwed: 0,
    livingExpenses: 0,
  });
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [includeJewelry, setIncludeJewelry] = useState(false);
  const [includeRetirement, setIncludeRetirement] = useState(false);

  // Fetch live metal prices
  useEffect(() => {
    async function fetchPrices() {
      try {
        const getMetalPrices = httpsCallable(functions, "getMetalPrices");
        const result = await getMetalPrices();
        const data = result.data as {
          goldPerGram?: number;
          silverPerGram?: number;
          stale?: boolean;
        };
        if (data.goldPerGram && data.silverPerGram) {
          setPrices({ goldPerGram: data.goldPerGram, silverPerGram: data.silverPerGram });
        }
      } catch {
        // Prices remain at initial state
      } finally {
        setPricesLoading(false);
      }
    }
    fetchPrices();
  }, []);

  // Reset madhab-specific toggles when madhab changes
  useEffect(() => {
    setIncludeJewelry(false);
    setIncludeRetirement(false);
    setAssets((prev) => ({ ...prev, personalJewelry: 0, retirementAccounts: 0, livingExpenses: 0 }));
  }, [madhab]);

  // Report amount to parent whenever result changes
  useEffect(() => {
    onAmountChange(result?.zakatDue ?? 0);
  }, [result, onAmountChange]);

  const handleCalculate = () => {
    const res = calculateZakat(assets, madhab, prices, nisabStandard, {
      includeJewelry,
      includeRetirement,
    });
    setResult(res);
    setStep(3);
  };

  const updateAsset = (key: keyof ZakatAssets, value: string) => {
    setAssets((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <>
      {/* Step indicators with labels */}
      <div className="mb-10 flex items-center justify-center">
        {[
          { num: 1, label: 'Basic Details' },
          { num: 2, label: 'Income & Assets' },
          { num: 3, label: 'Review & Confirm' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full font-ui text-sm font-bold transition-all duration-300 ${step > s.num
                  ? 'bg-[#2D5A3D] text-white shadow-lg'
                  : step === s.num
                    ? 'bg-[#2D5A3D] text-white shadow-lg ring-4 ring-[#2D5A3D]/20'
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {step > s.num ? <Check size={18} strokeWidth={3} /> : s.num}
              </div>
              <span className={`mt-2 text-[10px] sm:text-xs font-ui font-medium text-center leading-tight ${step >= s.num ? 'text-[#2D5A3D]' : 'text-muted-foreground'
                }`}>
                Step {s.num}: {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`mx-2 sm:mx-4 h-1 w-12 sm:w-20 rounded-full transition-all duration-500 ${step > s.num ? 'bg-[#2D5A3D]' : 'bg-muted'
                }`} style={{ marginTop: '-1rem' }} />
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
            <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <span className="text-2xl" style={{ color: '#C9A962' }}>☪ ★</span>
                </div>
                <CardTitle className="font-heading text-xl">Select Your Madhab</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {madhabs.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMadhab(m)}
                      className={`rounded-full px-5 py-2.5 font-ui text-sm font-medium transition-all duration-200 ${madhab === m
                        ? 'bg-[#2D5A3D] text-white shadow-lg scale-105'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:scale-105'
                        }`}
                    >
                      {madhab === m && <span className="mr-1" style={{ color: '#C9A962' }}>☪</span>}
                      {MADHAB_LABELS[m]}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/30 bg-white/50 backdrop-blur-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-ui text-sm font-bold text-foreground">
                        Nisab Standard
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 p-0.5">
                      <button
                        onClick={() => setNisabStandard('gold')}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-ui text-xs font-medium transition-all duration-200 ${nisabStandard === 'gold'
                          ? 'bg-gradient-to-r from-[#C9A962] to-[#D4B76A] text-white shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {nisabStandard === 'gold' && <Check size={12} strokeWidth={3} />}
                        Gold
                      </button>
                      <button
                        onClick={() => setNisabStandard('silver')}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-ui text-xs font-medium transition-all duration-200 ${nisabStandard === 'silver'
                          ? 'bg-gradient-to-r from-gray-500 to-gray-400 text-white shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {nisabStandard === 'silver' && <Check size={12} strokeWidth={3} />}
                        Silver
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The Nisab is the minimum threshold of wealth one must possess before
                    Zakat becomes obligatory. Choose between the Gold or Silver standard.
                  </p>
                </div>

                {madhab === "jafari" && (
                  <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground">
                      Cash and investments fall under <strong>Khums (20%)</strong>, not
                      Zakat. Zakat applies to gold, silver, livestock, and crops.
                    </p>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    onClick={() => setStep(2)}
                    className="gap-2 font-ui font-semibold rounded-full px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: '#2D5A3D' }}
                  >
                    Continue <ArrowRight size={16} />
                  </Button>
                </div>
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
            <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="font-heading">Enter Your Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {madhab === "jafari" && (
                  <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground">
                      Under Ja'fari fiqh, Zakat applies to gold, silver, livestock, and
                      crops. For cash and investment obligations, use the{" "}
                      <a href="/khums" className="font-semibold underline">Khums Calculator</a>.
                    </p>
                  </div>
                )}

                {madhab === "shafii" && (
                  <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground">
                      Under the Shafi'i school, debts are <strong>not deducted</strong> from
                      zakatable assets. Zakat is calculated on gross assets.
                    </p>
                  </div>
                )}

                {(madhab === "jafari"
                  ? ([
                    { key: "gold" as const, label: "Gold", unit: "grams" },
                    { key: "silver" as const, label: "Silver", unit: "grams" },
                    { key: "livestock" as const, label: "Livestock", unit: "USD" },
                    { key: "crops" as const, label: "Agricultural Produce / Crops", unit: "USD" },
                    { key: "debtsOwed" as const, label: "Debts Owed (Deductions)", unit: "USD" },
                  ] as { key: keyof ZakatAssets; label: string; unit: string; hint?: string }[])
                  : ([
                    { key: "cash" as const, label: "Cash & Bank Accounts", unit: "USD" },
                    { key: "gold" as const, label: "Gold", unit: "grams" },
                    { key: "silver" as const, label: "Silver", unit: "grams" },
                    { key: "investments" as const, label: "Investments", unit: "USD", hint: "1/3 of this amount is zakatable (tangible fixed assets are exempt)" },
                    { key: "businessInventory" as const, label: "Business Inventory", unit: "USD" },
                    { key: "crypto" as const, label: "Crypto Assets", unit: "USD" },
                    { key: "livestock" as const, label: "Livestock", unit: "USD" },
                    { key: "crops" as const, label: "Agricultural Produce / Crops", unit: "USD" },
                    ...(madhab !== "shafii" ? [
                      { key: "debtsOwed" as const, label: "Debts Owed (Deductions)", unit: "USD" },
                    ] : []),
                    ...(madhab === "hanafi" ? [
                      { key: "livingExpenses" as const, label: "Annual Living Expenses (Deduction)", unit: "USD", hint: "Hanafi school allows deducting basic living expenses" },
                    ] : []),
                  ] as { key: keyof ZakatAssets; label: string; unit: string; hint?: string }[])
                ).map((field) => (
                  <div key={field.key}>
                    <Label className="font-ui text-sm font-medium">{field.label}</Label>
                    {field.hint && (
                      <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>
                    )}
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

                {/* Personal Jewelry — madhab-dependent */}
                {madhab === "hanafi" && (
                  <div>
                    <Label className="font-ui text-sm font-medium">Personal Jewelry</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Under the Hanafi school, personal-use jewelry is always subject to zakat
                    </p>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        USD
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={assets.personalJewelry || ""}
                        onChange={(e) => updateAsset("personalJewelry", e.target.value)}
                        className="bg-card pl-14"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {["shafii", "maliki", "hanbali"].includes(madhab) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-5">
                      <div>
                        <p className="font-ui text-sm font-medium text-foreground">
                          Include Personal Jewelry?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Most scholars in this school exempt personal-use jewelry from zakat
                        </p>
                      </div>
                      <Switch
                        checked={includeJewelry}
                        onCheckedChange={setIncludeJewelry}
                      />
                    </div>
                    {includeJewelry && (
                      <div>
                        <Label className="font-ui text-sm font-medium">Personal Jewelry Value</Label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            USD
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={assets.personalJewelry || ""}
                            onChange={(e) => updateAsset("personalJewelry", e.target.value)}
                            className="bg-card pl-14"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Retirement Accounts — Shafi'i/Hanbali opt-in only */}
                {(madhab === "shafii" || madhab === "hanbali") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 p-5">
                      <div>
                        <p className="font-ui text-sm font-medium text-foreground">
                          Include Retirement Accounts?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Most scholars consider retirement funds exempt until withdrawal
                        </p>
                      </div>
                      <Switch
                        checked={includeRetirement}
                        onCheckedChange={setIncludeRetirement}
                      />
                    </div>
                    {includeRetirement && (
                      <>
                        <div>
                          <Label className="font-ui text-sm font-medium">Retirement Account Balance</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Enter total balance. 1/3 will be used for zakat calculation.
                          </p>
                          <div className="relative mt-1.5">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              USD
                            </span>
                            <Input
                              type="number"
                              min={0}
                              value={assets.retirementAccounts || ""}
                              onChange={(e) => updateAsset("retirementAccounts", e.target.value)}
                              className="bg-card pl-14"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <p className="text-xs text-foreground">
                            If you would owe taxes or early-withdrawal penalties on this
                            balance, consider entering the net amount after deducting those
                            costs.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!pricesLoading && (
                  <div className="rounded-2xl bg-muted/30 p-4 text-xs text-muted-foreground">
                    <DollarSign className="mr-1 inline h-3 w-3" />
                    Live prices: Gold {fmt(prices.goldPerGram)}/g · Silver{" "}
                    {fmt(prices.silverPerGram)}/g
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2 font-ui font-semibold rounded-full px-8 py-6 transition-all duration-200 hover:scale-105"
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={handleCalculate}
                    className="gap-2 font-ui font-semibold rounded-full px-10 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: '#2D5A3D' }}
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
            <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
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

                {!result.isAboveNisab && (
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
                      investment obligations, use the <a href="/khums" className="font-semibold underline">Khums Calculator</a>.
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

                {/* Advanced options note */}
                <div className="rounded-2xl border border-border/20 bg-muted/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    For advanced options like retirement account tax deductions, proportional
                    debt deduction, and madhab-enforced nisab rules, use the{" "}
                    <strong>Rafiq iOS app</strong>.
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    onAmountChange(0);
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
