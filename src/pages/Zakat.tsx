import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ArrowRight, ArrowLeft, Info, DollarSign } from "lucide-react";
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

const madhabs: Madhab[] = ["Hanafi", "Shafi'i", "Maliki", "Hanbali", "Ja'fari"];

const FALLBACK_PRICES: MetalPrices = { goldPerGram: 75.5, silverPerGram: 0.92 };

export default function Zakat() {
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

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Zakat Calculator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Calculate your obligation across all five madhabs
        </p>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 w-8 rounded ${step > s ? "bg-primary" : "bg-muted"}`} />
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
            <Card className="border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="font-serif">Select Your Madhab</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {madhabs.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMadhab(m)}
                      className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                        madhab === m
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {showNisabToggle && (
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Nisab Standard</p>
                      <p className="text-xs text-muted-foreground">
                        Choose gold or silver for threshold
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${nisabStandard === "silver" ? "text-foreground" : "text-muted-foreground"}`}>
                        Silver
                      </span>
                      <Switch
                        checked={nisabStandard === "gold"}
                        onCheckedChange={(c) => setNisabStandard(c ? "gold" : "silver")}
                      />
                      <span className={`text-xs font-medium ${nisabStandard === "gold" ? "text-foreground" : "text-muted-foreground"}`}>
                        Gold
                      </span>
                    </div>
                  </div>
                )}

                {madhab === "Ja'fari" && (
                  <div className="flex gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <p className="text-sm text-foreground">
                      Cash and investments fall under <strong>Khums (20%)</strong>, not Zakat.
                      Zakat applies to gold, silver, livestock, and crops.
                    </p>
                  </div>
                )}

                <Button onClick={() => setStep(2)} className="w-full gap-2">
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
            <Card className="border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="font-serif">Enter Your Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "cash" as const, label: "Cash & Bank Accounts", unit: "USD" },
                  { key: "gold" as const, label: "Gold", unit: "grams" },
                  { key: "silver" as const, label: "Silver", unit: "grams" },
                  { key: "investments" as const, label: "Investments", unit: "USD" },
                  { key: "businessInventory" as const, label: "Business Inventory", unit: "USD" },
                  { key: "debtsOwed" as const, label: "Debts Owed (Deductions)", unit: "USD" },
                ].map((field) => (
                  <div key={field.key}>
                    <Label className="text-sm">{field.label}</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
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
                  <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                    <DollarSign className="mr-1 inline h-3 w-3" />
                    Live prices: Gold {fmt(prices.goldPerGram)}/g · Silver{" "}
                    {fmt(prices.silverPerGram)}/g
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button onClick={handleCalculate} className="flex-1 gap-2">
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
            <Card className="border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="font-serif">Your Zakat Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted/60 p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground">Total Assets</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{fmt(result.totalAssets)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground">Nisab Threshold</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{fmt(result.nisabThreshold)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {result.nisabStandard === "gold" ? "85g Gold" : "595g Silver"} standard
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary p-4 text-center text-primary-foreground">
                    <p className="text-xs font-medium opacity-80">
                      {result.isJafari ? "Total Due" : "Zakat Due (2.5%)"}
                    </p>
                    <p className="mt-1 text-lg font-bold">{fmt(result.zakatDue)}</p>
                  </div>
                </div>

                {!result.isAboveNisab && !result.isJafari && (
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-center text-sm text-foreground">
                    Your net assets are below the Nisab threshold. No Zakat is due at this time.
                  </div>
                )}

                {result.isJafari && (
                  <div className="flex gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
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
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Breakdown</h3>
                  <div className="space-y-2">
                    {result.breakdown.map((b) => (
                      <div
                        key={b.category}
                        className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{b.category}</p>
                          <p className="text-xs text-muted-foreground">{fmt(Math.abs(b.amount))}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {b.zakatOn > 0 ? fmt(b.zakatOn) : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" onClick={() => { setStep(1); setResult(null); }} className="w-full gap-2">
                  <ArrowLeft size={16} /> Start Over
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
