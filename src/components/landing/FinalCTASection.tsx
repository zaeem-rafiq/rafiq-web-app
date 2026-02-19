import { useState, useEffect } from "react";
import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowRight, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlist } from "@/lib/waitlist";
import { CrescentMoon } from "@/assets/islamic-patterns";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

function useDaysUntilRamadan() {
  const [days, setDays] = useState(0);
  useEffect(() => {
    // Ramadan 2026 starts approximately Feb 18, 2026
    const ramadanStart = new Date("2026-02-18T00:00:00");
    const now = new Date();
    const diff = ramadanStart.getTime() - now.getTime();
    const d = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    setDays(d);
  }, []);
  return days;
}

export default function FinalCTASection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const daysLeft = useDaysUntilRamadan();

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await addToWaitlist(email, "bottom-cta");
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
    <section className="relative overflow-hidden bg-gradient-hero px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 pattern-islamic-gold opacity-40" />

      {/* Decorative crescent */}
      <div className="pointer-events-none absolute -left-20 -top-20 opacity-5">
        <CrescentMoon size={300} className="text-gold" />
      </div>

      <div className="container relative mx-auto max-w-2xl text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          {daysLeft > 0 && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 font-ui text-xs font-semibold text-gold">
              <CrescentMoon size={12} className="text-gold" />
              {daysLeft} {daysLeft === 1 ? "day" : "days"} until Ramadan
            </p>
          )}
        </motion.div>

        <motion.h2
          className="font-heading text-3xl font-bold text-white sm:text-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
        >
          Your zakat doesn't have to be{" "}
          <span className="text-gradient-gold">a guessing game.</span>
        </motion.h2>

        <motion.p
          className="mx-auto mt-4 max-w-lg text-base text-white/70"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={2}
        >
          Join the waitlist for early access to Rafiq — the first Islamic wealth platform that shows its work.
        </motion.p>

        <motion.div
          className="mt-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={3}
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
          <p className="mt-3 text-xs text-white/50">
            Free. No credit card. We'll email you once before Ramadan.
          </p>
        </motion.div>

        <motion.div
          className="mt-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={4}
        >
          <Link
            to="/zakat"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-gold"
          >
            <Calculator size={14} />
            Or try the free zakat calculator now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
