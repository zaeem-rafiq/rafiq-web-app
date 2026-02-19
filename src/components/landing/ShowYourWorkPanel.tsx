import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle, ToggleLeft } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const assets = [
  { name: "Cash & Savings", value: "$45,000", zakatable: "Yes", amount: "$45,000" },
  { name: "Brokerage (Stocks/ETFs)", value: "$120,000", zakatable: "Zakatable ratio", amount: "$78,400" },
  { name: "401(k)", value: "$85,000", zakatable: "Yes (Hanafi)", amount: "$85,000" },
  { name: "Gold Jewelry", value: "$8,200", zakatable: "Yes (Hanafi)", amount: "$8,200" },
  { name: "Rental Property", value: "$65,000", zakatable: "No (Hanafi)", amount: "$0" },
];

const citations = [
  "Per Hanafi fiqh, retirement accounts (401k, IRA) are included in zakatable wealth as they represent accessible financial assets.",
  "Gold and silver jewelry is zakatable in the Hanafi school regardless of personal use.",
];

export default function ShowYourWorkPanel() {
  return (
    <section className="relative px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 pattern-islamic opacity-20" />

      <div className="container relative mx-auto max-w-5xl">
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            See how Rafiq shows its work
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Every number comes with an explanation. Toggle between madhabs. Review every assumption. Override anything that doesn't fit.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
        >
          {/* Mock app panel */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-premium">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-4">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Your Zakat Obligation
              </h3>
              {/* Madhab toggle */}
              <div className="flex items-center gap-1">
                <ToggleLeft size={14} className="text-gold" />
                <div className="flex gap-1 text-xs">
                  <span className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground">
                    Hanafi
                  </span>
                  <span className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted">
                    Shafi'i
                  </span>
                  <span className="hidden rounded-md px-2 py-1 text-muted-foreground sm:inline-block">
                    Maliki
                  </span>
                  <span className="hidden rounded-md px-2 py-1 text-muted-foreground sm:inline-block">
                    Hanbali
                  </span>
                  <span className="hidden rounded-md px-2 py-1 text-muted-foreground sm:inline-block">
                    Ja'fari
                  </span>
                </div>
              </div>
            </div>

            {/* Asset table */}
            <div className="overflow-x-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="hidden pb-2 font-medium sm:table-cell">Zakatable?</th>
                    <th className="pb-2 text-right font-medium">Zakatable Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.name} className="border-b border-border/30">
                      <td className="py-2.5 text-foreground">{a.name}</td>
                      <td className="py-2.5 text-muted-foreground">{a.value}</td>
                      <td className="hidden py-2.5 text-muted-foreground sm:table-cell">
                        <span className={a.amount === "$0" ? "text-muted-foreground/60" : "text-halal"}>
                          {a.zakatable}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-foreground">{a.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Deductions and total */}
            <div className="border-t border-border/50 bg-muted/20 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outstanding debts deducted</span>
                <span className="text-foreground">-$12,000</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Living expenses (Hanafi)</span>
                <span className="text-foreground">-$3,200</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="font-heading text-sm font-semibold text-foreground">
                  Total Zakatable Wealth
                </span>
                <span className="font-heading text-sm font-semibold text-foreground">$201,400</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                <span className="font-heading font-semibold text-primary">Your Zakat (2.5%)</span>
                <span className="font-heading text-xl font-bold text-primary">$5,035</span>
              </div>
            </div>

            {/* Citations panel */}
            <div className="border-t border-border/50 px-6 py-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gold">
                <BookOpen size={14} />
                Citations & Sources
              </div>
              <div className="mt-3 space-y-2">
                {citations.map((c, i) => (
                  <p key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="mt-0.5 shrink-0 text-gold">[{i + 1}]</span>
                    {c}
                  </p>
                ))}
              </div>
            </div>

            {/* Edge case flag */}
            <div className="border-t border-border/50 px-6 py-4">
              <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-foreground">
                  Your brokerage includes 3 stocks with non-halal revenue above 5%. Consider reviewing purification requirements.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sample calculation. Actual results depend on your assets, madhab, and current metal prices.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
