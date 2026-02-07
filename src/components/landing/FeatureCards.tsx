import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Calculator, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "Halal Stock Screener",
    description: "Instantly check if any stock is Shariah-compliant with AAOIFI screening criteria and live financial ratios.",
    to: "/screener",
  },
  {
    icon: Calculator,
    title: "Zakat Calculator",
    description: "Calculate your Zakat obligation across all five madhabs with live gold and silver prices for accurate Nisab.",
    to: "/zakat",
  },
  {
    icon: MessageCircle,
    title: "Ask Rafiq",
    description: "Get AI-powered answers to your Islamic finance questions — from halal investing to zakat rulings.",
    to: "/ask",
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
    <section className="px-4 pb-16 sm:pb-24">
      <div className="container mx-auto max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Link to={f.to} className="group block h-full">
                <Card className="h-full border-border/50 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex flex-col gap-4 p-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon size={24} />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 font-ui text-sm font-medium text-primary transition-colors group-hover:text-accent">
                      Explore <ArrowRight size={14} />
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
