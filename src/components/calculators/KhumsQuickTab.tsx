import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface KhumsQuickTabProps {
  onAmountChange: (amount: number) => void;
}

export default function KhumsQuickTab({ onAmountChange }: KhumsQuickTabProps) {
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  const khumsSurplus = Math.max(0, totalIncome - totalExpenses);
  const khumsAmount = khumsSurplus * 0.2;
  const sahmAlImam = khumsAmount * 0.5;
  const sahmAlSadat = khumsAmount * 0.5;

  useEffect(() => {
    onAmountChange(khumsAmount);
  }, [khumsAmount, onAmountChange]);

  return (
    <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
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

        {/* Link to full Khums page */}
        <Link
          to="/khums"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border/30 p-4 text-sm font-medium transition-colors hover:bg-muted/50"
          style={{ color: "#C9A962" }}
        >
          Full Khums Calculator with advanced categories <ArrowRight size={14} />
        </Link>
      </CardContent>
    </Card>
  );
}
