import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ClipboardList, FileSearch, Receipt } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Connect your accounts via Plaid",
    description:
      "Cash, investments, crypto, retirement accounts, business inventory, gold, silver. Rafiq knows which assets and liabilities matter for your madhab and which don't.",
  },
  {
    number: "02",
    icon: FileSearch,
    title: "Get your obligation with full citations",
    description:
      "See exactly what you owe, why you owe it, and which scholarly rulings apply. Toggle between madhabs to compare. Review every assumption. Override anything that doesn't fit your situation.",
  },
  {
    number: "03",
    icon: Receipt,
    title: "Give and keep records",
    description:
      "Distribute to verified mosques and charities. Get a receipt. Rafiq saves your asset snapshot, calculation, and giving history so next year starts where this year ended.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 pattern-islamic-gold opacity-20" />

      <div className="container relative mx-auto max-w-5xl">
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Three steps. Twenty minutes.
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.number}
              className="relative text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="pointer-events-none absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-gold/40 to-transparent sm:block" />
              )}

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
                <span className="font-heading text-xl font-bold text-gold">{s.number}</span>
              </div>
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center">
                <s.icon size={22} className="text-white/80" />
              </div>
              <h3 className="font-heading text-base font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
