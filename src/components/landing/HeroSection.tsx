import { useState } from "react";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowRight, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlist } from "@/lib/waitlist";
import rafiqLogo from "@/assets/rafiq-logo.png";
import { CrescentMoon } from "@/assets/islamic-patterns";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HeroSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await addToWaitlist(email, "hero");
      setSubmitted(true);
      toast({
        title: "You're on the list.",
        description: "We'll email you before Ramadan with launch details.",
      });
      setEmail("");
    } catch {
      toast({
        title: "Something went wrong.",
        description: "Please try again or email zaeem@rafiq.money directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero px-4 pb-24 pt-20 sm:pb-32 sm:pt-28">
      {/* Islamic geometric pattern watermark */}
      <div className="pointer-events-none absolute inset-0 pattern-islamic-gold opacity-30" />

      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      {/* Decorative floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-gold/20 animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto max-w-4xl text-center">
        {/* Logo */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <img src={rafiqLogo} alt="Rafiq" className="mx-auto mb-8 h-16 w-auto rounded-2xl bg-white p-2 shadow-lg sm:h-20" />
        </motion.div>

        {/* Launch badge */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2 font-ui text-xs font-semibold uppercase tracking-wider text-gold shadow-glow-gold">
            <CrescentMoon size={14} className="text-gold" />
            Launching Ramadan 2026
          </span>
        </motion.div>

        <motion.h1
          className="mt-8 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          Know exactly what you owe.{" "}
          <span className="text-gradient-gold">See exactly why.</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          Rafiq calculates your zakat and khums across 401(k)s, RSUs, crypto, and real
          estate — with scholarly citations for every number. 5 madhabs. Full audit trail.
          No guessing.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
        >
          {submitted ? (
            <p className="inline-flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-8 py-4 font-ui font-medium text-gold">
              You're on the list. We'll be in touch before Ramadan.
            </p>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-gold/50 focus:ring-gold/30"
              />
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-gold font-ui font-semibold text-forest hover:bg-gold/90 disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join the Waitlist"} <ArrowRight size={16} />
              </Button>
            </form>
          )}
          <p className="mt-3 text-xs text-white/60">
            Free. No credit card. We'll email you once before Ramadan.
          </p>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div
          className="mt-4"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4.5}
        >
          <Link
            to="/zakat"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 underline decoration-white/30 underline-offset-2 transition-colors hover:text-gold hover:decoration-gold/50"
          >
            <Calculator size={14} />
            Or try the free zakat calculator now
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-white/70"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
        >
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gold/70" />
            5 Madhabs Supported
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gold/70" />
            500+ Rules Engine
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gold/70" />
            Zakat + Khums
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gold/70" />
            Scholar-Reviewed
          </span>
        </motion.div>
      </div>
    </section>
  );
}
