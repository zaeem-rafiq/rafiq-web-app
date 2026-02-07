import { useState } from "react";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Calculator, MessageCircle, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";

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

export default function Index() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // UI-only — Firebase integration to be added by user
    setSubmitted(true);
    toast({
      title: "You're on the list! 🎉",
      description: "We'll notify you when Rafiq launches this Ramadan.",
    });
    setEmail("");
  };

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:pb-24 sm:pt-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        <div className="container relative mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              Launching Ramadan 2026
            </span>
          </motion.div>

          <motion.h1
            className="mt-6 font-serif text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Your Islamic Finance{" "}
            <span className="text-primary">Companion</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Halal investing, zakat calculation, and AI-powered financial guidance
            — built for North American Muslims.
          </motion.p>

          {/* Countdown */}
          <motion.div
            className="mt-10"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Ramadan 2026 Countdown
            </p>
            <CountdownTimer />
          </motion.div>
        </div>
      </section>

      {/* Feature cards */}
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
                  <Card className="h-full border-border/60 bg-card/80 transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
                    <CardContent className="flex flex-col gap-4 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <f.icon size={24} />
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        {f.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {f.description}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
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

      {/* Waitlist */}
      <section className="border-t border-border/60 bg-muted/40 px-4 py-16 sm:py-24">
        <div className="container mx-auto max-w-lg text-center">
          <Mail className="mx-auto mb-4 h-10 w-10 text-accent" />
          <h2 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            Join the Waitlist
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to know when Rafiq launches. No spam, ever.
          </p>

          {submitted ? (
            <p className="mt-6 rounded-xl bg-primary/10 px-6 py-4 font-medium text-primary">
              ✓ You're on the list! We'll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-card"
              />
              <Button type="submit" className="gap-2">
                Join the Waitlist <ArrowRight size={16} />
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-4 py-10">
        <div className="container mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-serif text-sm font-bold text-primary-foreground">ر</span>
            </div>
            <span className="font-serif text-lg font-bold text-foreground">Rafiq</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Launching Ramadan 2026 · North America's Islamic Wealth Platform
          </p>
          <div className="flex gap-3">
            <div className="rounded-lg border border-border bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
              App Store — Coming Soon
            </div>
            <div className="rounded-lg border border-border bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
              Google Play — Coming Soon
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
