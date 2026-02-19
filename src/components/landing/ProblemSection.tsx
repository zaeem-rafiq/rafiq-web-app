import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { Clock, HelpCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CornerDecoration } from "@/assets/islamic-patterns";

const problems = [
  {
    icon: Clock,
    title: "Every year, the same scramble.",
    description:
      "You earn in RSUs, hold crypto, max out your 401(k), and own rental property. Come Ramadan, you open a spreadsheet, Google \"zakat on retirement accounts,\" get three conflicting answers, and pick the one that feels right. You've been doing this for years. You're still not sure.",
    iconColor: "text-gold",
    iconBg: "bg-gold/10",
  },
  {
    icon: HelpCircle,
    title: "A number without an explanation.",
    description:
      "Most zakat calculators give you one number and no context. Which madhab did it use? How did it treat your 401(k)? What about your RSU vesting schedule? You get an answer. You have no idea why.",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    icon: AlertTriangle,
    title: "Khums? Zero tools. Multi-year tracking? Doesn't exist.",
    description:
      "If you follow the Ja'fari school, khums is a pillar of your practice — and there is no dedicated digital tool for it. For everyone else: last year's calculation lives in a spreadsheet you can't find. Next year, you'll start from scratch. Again.",
    iconColor: "text-haram",
    iconBg: "bg-haram/10",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function ProblemSection() {
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
            The problem with "figuring it out yourself"
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              <Card className="relative h-full overflow-hidden border-border/50 bg-card/80 shadow-sm backdrop-blur-sm">
                <div className="absolute right-0 top-0 text-primary/10">
                  <CornerDecoration className="h-16 w-16 rotate-90" />
                </div>
                <CardContent className="relative flex flex-col gap-4 p-7">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${p.iconBg}`}
                  >
                    <p.icon size={22} className={p.iconColor} />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
