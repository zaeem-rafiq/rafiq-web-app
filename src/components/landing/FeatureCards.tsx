import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Calculator, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CornerDecoration } from "@/assets/islamic-patterns";

const features = [
  {
    icon: Search,
    title: "Halal Stock Screener",
    description: "Instantly check if any stock is Shariah-compliant with AAOIFI screening criteria and live financial ratios.",
    to: "/screener",
    gradient: "from-primary to-forest-light",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Calculator,
    title: "Zakat Calculator",
    description: "Calculate your Zakat obligation across all five madhabs with live gold and silver prices for accurate Nisab.",
    to: "/zakat",
    gradient: "from-gold to-amber-400",
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
  },
  {
    icon: MessageCircle,
    title: "Ask Rafiq",
    description: "Get AI-powered answers to your Islamic finance questions — from halal investing to zakat rulings.",
    to: "/ask",
    gradient: "from-sage to-primary",
    iconBg: "bg-sage/10",
    iconColor: "text-sage",
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

export default function FeatureCards() {
  return (
    <section className="relative px-4 py-20 sm:py-28">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 pattern-islamic opacity-30" />

      <div className="container relative mx-auto max-w-5xl">
        {/* Section heading */}
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for the modern Muslim investor
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              <Link to={f.to} className="group block h-full">
                <Card className="relative h-full overflow-hidden border-border/50 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover-glow">
                  {/* Corner decoration */}
                  <div className="absolute right-0 top-0 text-primary/10">
                    <CornerDecoration className="h-16 w-16 rotate-90" />
                  </div>

                  <CardContent className="relative flex flex-col gap-4 p-7">
                    {/* Icon with gradient background */}
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${f.iconBg} ${f.iconColor} transition-all duration-300 group-hover:shadow-glow-primary`}>
                      <div className={`rounded-xl bg-gradient-to-br ${f.gradient} p-2.5 text-white`}>
                        <f.icon size={22} />
                      </div>
                    </div>

                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 font-ui text-sm font-medium text-primary transition-all duration-300 group-hover:gap-2 group-hover:text-accent">
                      Explore <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

