import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Info, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  calculateKhums,
  createEmptyKhumsInput,
  type KhumsInput,
  type KhumsResult,
} from "@/lib/khums-utils";
import { CharitySection } from "@/components/CharitySection";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const INCOME_FIELDS: { key: keyof KhumsInput; label: string; hint?: string }[] = [
  { key: "savings", label: "Savings & Bank Balances" },
  { key: "cashOnHand", label: "Cash on Hand" },
  { key: "investments", label: "Investments (Stocks, Funds, etc.)" },
  { key: "businessProfits", label: "Business Profits" },
  { key: "rentalIncome", label: "Rental Income" },
  { key: "gifts", label: "Gifts Received" },
  { key: "inheritance", label: "Inheritance", hint: "Exempt from khums — entered for record-keeping only" },
];

const PROPERTY_FIELDS: { key: keyof KhumsInput; label: string; hint?: string }[] = [
  { key: "goldSilverPurchased", label: "Gold & Silver Purchased" },
  { key: "jewelryBeyondUse", label: "Jewelry Beyond Personal Use" },
  { key: "unusedGoods", label: "Unused Goods & Surplus Items" },
];

const DEDUCTION_FIELDS: { key: keyof KhumsInput; label: string; hint?: string }[] = [
  { key: "annualExpenses", label: "Annual Living Expenses" },
  { key: "debtPayments", label: "Debt Payments" },
  { key: "businessReinvestment", label: "Business Reinvestment" },
];

const ADVANCED_FIELDS: { key: keyof KhumsInput; label: string; desc: string }[] = [
  {
    key: "kanz",
    label: "Kanz (Treasure Trove)",
    desc: "Buried treasure or hidden wealth discovered — khums applies regardless of expenses.",
  },
  {
    key: "madan",
    label: "Ma'dan (Minerals & Mining)",
    desc: "Gold, silver, or minerals extracted from the earth through mining or excavation.",
  },
  {
    key: "ghaws",
    label: "Ghaws (Sea & Diving Finds)",
    desc: "Pearls, coral, amber, or other valuables retrieved from the sea by diving.",
  },
  {
    key: "propertyAppreciation",
    label: "Property Appreciation",
    desc: "Increase in value of property or assets since purchase (unrealized or realized gains).",
  },
  {
    key: "mixedHalalHaram",
    label: "Mixed Halal/Haram Income",
    desc: "Income where halal and haram portions are inseparable — khums purifies the entire amount.",
  },
];

export default function Khums() {
  const [input, setInput] = useState<KhumsInput>(createEmptyKhumsInput());
  const [result, setResult] = useState<KhumsResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateField = (key: keyof KhumsInput, value: string) => {
    setInput((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleCalculate = () => {
    setResult(calculateKhums(input));
  };

  const handleReset = () => {
    setInput(createEmptyKhumsInput());
    setResult(null);
    setShowAdvanced(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-14">
      {/* Floating crescent decorations */}
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={`crescent-${i}`}
          className="pointer-events-none absolute select-none text-xl sm:text-2xl opacity-30"
          style={{
            top: `${10 + i * 15}%`,
            left: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
            right: i % 2 === 1 ? `${5 + i * 3}%` : undefined,
            color: i % 3 === 0 ? "#C9A962" : "#2D5A3D",
          }}
          animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        >
          ☪
        </motion.span>
      ))}

      {/* Gradient blob */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(circle, #C9A962 0%, #2D5A3D 50%, transparent 70%)" }}
      />

      <div className="container relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl" style={{ color: "#C9A962" }}>
            Khums Calculator
          </h1>
          <p className="mt-3 text-muted-foreground">
            Calculate your annual surplus and fulfill your khums obligation
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-8 border-border/30 bg-amber-50/60 backdrop-blur-sm">
          <CardContent className="flex gap-3 p-5">
            <Info size={20} className="mt-0.5 shrink-0" style={{ color: "#C9A962" }} />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What is Khums?</p>
              <p className="mt-1">
                Khums ("one-fifth") is an obligation in the Ja'fari (Shia) school to pay 20% of
                annual surplus income — earnings minus yearly living expenses. It is divided equally
                between <strong>Sahm al-Imam</strong> (the Imam's share, typically given to a Marja'
                or their representative) and <strong>Sahm al-Sadat</strong> (given to needy Sayyids).
              </p>
              <p className="mt-1 text-xs">
                Inheritance is exempt from khums. Advanced categories (treasure, minerals, sea finds)
                are taxed independently at 20%.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Income Section */}
        <Card className="mb-6 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg" style={{ color: "#C9A962" }}>
              <Calculator size={20} /> Income Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {INCOME_FIELDS.map((field) => (
              <div key={field.key}>
                <Label className="font-ui text-sm font-medium">{field.label}</Label>
                {field.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
                )}
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    USD
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={input[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Property Section */}
        <Card className="mb-6 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg" style={{ color: "#C9A962" }}>
              <Calculator size={20} /> Property Subject to Khums
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {PROPERTY_FIELDS.map((field) => (
              <div key={field.key}>
                <Label className="font-ui text-sm font-medium">{field.label}</Label>
                {field.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
                )}
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    USD
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={input[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Deductions Section */}
        <Card className="mb-6 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg" style={{ color: "#C9A962" }}>
              <Calculator size={20} /> Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {DEDUCTION_FIELDS.map((field) => (
              <div key={field.key}>
                <Label className="font-ui text-sm font-medium">{field.label}</Label>
                {field.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
                )}
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    USD
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={input[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="bg-card pl-14"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Advanced Categories (Collapsible) */}
        <Card className="mb-8 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <CardTitle className="flex items-center justify-between font-heading text-lg" style={{ color: "#C9A962" }}>
              <span className="flex items-center gap-2">
                <Calculator size={20} /> Advanced Categories
              </span>
              <ChevronDown
                size={20}
                className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
              />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Special categories taxed independently at 20% — most people can skip this section
            </p>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="grid gap-6">
              {ADVANCED_FIELDS.map((field) => (
                <div key={field.key}>
                  <Label className="font-ui text-sm font-medium">{field.label}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{field.desc}</p>
                  <div className="relative mt-1.5">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      USD
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={input[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="bg-card pl-14"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Calculate Button */}
        <div className="mb-10 flex justify-center gap-3">
          <Button
            onClick={handleCalculate}
            className="gap-2 rounded-full px-8 py-3 font-ui font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: "#C9A962" }}
          >
            <Calculator size={18} /> Calculate Khums
          </Button>
          {result && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-full px-6 py-3 font-ui font-semibold"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card className="border-border/30 bg-white/80 text-center shadow-md">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground">Net Surplus</p>
                  <p className="mt-1 font-heading text-2xl font-bold" style={{ color: "#2D5A3D" }}>
                    {fmt(result.netSurplus)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-white/80 text-center shadow-md">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground">Khums Owed</p>
                  <p className="mt-1 font-heading text-2xl font-bold" style={{ color: "#C9A962" }}>
                    {fmt(result.totalKhumsObligation)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/30 bg-white/80 text-center shadow-md">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground">Remaining After Khums</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                    {fmt(result.netSurplus - result.standardKhums)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown Card */}
            <Card className="mb-6 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg" style={{ color: "#C9A962" }}>
                  Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Income (excl. inheritance)</span>
                  <span className="font-medium">{fmt(result.totalIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Property Subject to Khums</span>
                  <span className="font-medium">{fmt(result.totalProperty)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Surplus</span>
                  <span className="font-medium">{fmt(result.grossSurplus)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Deductions</span>
                  <span className="font-medium text-red-600">−{fmt(result.totalDeductions)}</span>
                </div>
                <hr className="border-border/30" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Net Surplus</span>
                  <span style={{ color: "#2D5A3D" }}>{fmt(result.netSurplus)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Standard Khums (20%)</span>
                  <span className="font-medium">{fmt(result.standardKhums)}</span>
                </div>
                {result.advancedKhums > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advanced Categories Khums</span>
                    <span className="font-medium">{fmt(result.advancedKhums)}</span>
                  </div>
                )}
                <hr className="border-border/30" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Khums Obligation</span>
                  <span style={{ color: "#C9A962" }}>{fmt(result.totalKhumsObligation)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Sahm Split */}
            {result.totalKhumsObligation > 0 && (
              <Card className="mb-8 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="font-heading text-lg" style={{ color: "#C9A962" }}>
                    Distribution of Khums
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/30 bg-amber-50/50 p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground">Sahm al-Imam</p>
                    <p className="mt-1 font-heading text-xl font-bold" style={{ color: "#C9A962" }}>
                      {fmt(result.sahmAlImam)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Given to your Marja' or their authorized representative
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/30 bg-green-50/50 p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground">Sahm al-Sadat</p>
                    <p className="mt-1 font-heading text-xl font-bold" style={{ color: "#2D5A3D" }}>
                      {fmt(result.sahmAlSadat)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Given to needy descendants of the Prophet (Sayyids)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charity Section */}
            {result.totalKhumsObligation > 0 && (
              <CharitySection activeTab="khums" amount={result.totalKhumsObligation} />
            )}
          </motion.div>
        )}

        {/* Disclaimer */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          This calculator provides estimates based on standard Ja'fari jurisprudence. Please
          consult your Marja' or a qualified scholar for rulings specific to your situation.
          Rafiq is not a substitute for scholarly guidance.
        </p>
      </div>
    </main>
  );
}
