import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import CountdownTimer from "@/components/CountdownTimer";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-secondary/[0.04]" />
      {/* Subtle geometric pattern at 10% opacity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B4D3E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative mx-auto max-w-4xl text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-ui text-xs font-semibold uppercase tracking-wider text-accent">
            Launching Ramadan 2026
          </span>
        </motion.div>

        <motion.h1
          className="mt-8 font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          Your Islamic Finance{" "}
          <span className="text-primary">Companion</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
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
          className="mt-12"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <p className="mb-5 font-ui text-sm font-medium text-muted-foreground">
            Ramadan 2026 Countdown
          </p>
          <CountdownTimer />
        </motion.div>
      </div>
    </section>
  );
}
