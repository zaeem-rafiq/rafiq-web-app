import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Before Rafiq, I spent 6 hours every Ramadan second-guessing my calculations. This year, I did it in 20 minutes, and for the first time I actually understood why each asset was treated the way it was.",
    name: "Safeer A.",
    title: "Software Engineer",
    location: "New York City",
  },
  {
    quote:
      "For the first time in 10 years, I now know how to purify my wealth.",
    name: "Zohair M.",
    title: "Product Manager",
    location: "Seattle",
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

export default function SocialProofSection() {
  return (
    <section className="relative px-4 py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 pattern-islamic opacity-20" />

      <div className="container relative mx-auto max-w-4xl">
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Built for the Ummah ❤️. By the Ummah
          </h2>
        </motion.div>

        {/* Testimonials */}
        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="relative rounded-2xl border border-border/50 bg-card/80 p-8 shadow-sm backdrop-blur-sm"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              <Quote size={24} className="mb-4 text-gold/40" />
              <p className="text-sm leading-relaxed text-foreground">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-heading text-sm font-semibold text-primary">
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.title}, {t.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div
          className="mt-10 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={5}
        >
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            Rafiq is an educational calculation tool, not a religious authority or tax advisor.
            For complex personal situations, we recommend consulting a qualified Islamic scholar.
            Rafiq does not custody funds — donations are processed through verified partners.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
