import type { Variants } from "framer-motion";
import { motion } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const sections = [
  {
    heading: "Our Core Promise: Service Before Status",
    intro:
      "We built Rafiq to help you fulfill obligations\u2014not to replace your judgment.",
    items: [
      {
        label: "Free Core Guarantee",
        text: "Essential obligation-completion tools will remain free (e.g., Zakat calculation). We will not make core obligation-completion dependent on payment.",
      },
      {
        label: "Privacy as Dignity",
        text: "Your financial data is an amanah. We do not sell personal financial data to third-party advertisers.",
      },
      {
        label: "Security by Default",
        text: "We protect your data with encryption, least-privilege access, and routine security reviews. We collect only what we need, and you can export and delete your data.",
      },
    ],
  },
  {
    heading: "How We Handle Uncertainty",
    intro:
      "Islamic finance includes legitimate scholarly disagreement. We choose humility over false certainty.",
    items: [
      {
        label: "We Show Our Work",
        text: "When outputs rely on a specific methodology or scholarly view, we state it clearly\u2014inputs, assumptions, and sources.",
      },
      {
        label: "Honest Differences",
        text: "Where valid disagreement exists, we\u2019ll acknowledge it and, when possible, let you choose the setting aligned with your school of thought.",
      },
      {
        label: "AI as Support, Not Mufti",
        text: "AI features summarize and assist\u2014they do not issue independent fatwas. For complex matters, consult qualified scholars. (Rafiq is educational planning software\u2014not legal, tax, or financial advice.)",
      },
    ],
  },
  {
    heading: "Our Business Model: Convenience, Not Compliance",
    intro:
      "We\u2019re a sustainable business. Revenue comes from added value\u2014not restricting access.",
    items: [
      {
        label: "What You Pay For",
        text: "Premium covers convenience and automation (syncing, alerts, advanced analytics, planning tools) that save time.",
      },
      {
        label: "What You Don\u2019t Pay For",
        text: "You will never have to pay to see the full methodology behind your Zakat calculation or compliance screen.",
      },
    ],
  },
  {
    heading: "Our Standard for Mistakes",
    intro: "We strive for ihsan, but we\u2019re human.",
    items: [
      {
        label: "Correction Protocol",
        text: "If we discover an error in a calculation, methodology, guidance, or data source, we fix it quickly and publish a transparent correction note. No silent patches.",
      },
      {
        label: "Community Accountability",
        text: "We review community feedback monthly. If you report a trust issue, you\u2019ll receive a substantive response\u2014not a generic dismissal.",
      },
    ],
  },
  {
    heading: "Plain Language Commitment",
    intro: "Finance and fiqh can be complicated. We speak simply.",
    items: [
      {
        label: "No Jargon",
        text: "We explain financial and religious terms in plain language so you can decide with full understanding.",
      },
      {
        label: "Guidance Where You Need It",
        text: "Definitions and context appear inside the workflow\u2014so you don\u2019t have to leave the app to understand what you\u2019re agreeing to.",
      },
    ],
  },
];

export default function TrustCharterSection() {
  return (
    <section className="relative px-4 py-20 sm:py-28">
      <div className="container relative mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Trust Charter
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            To define how we serve, how we decide, and how we sustain the
            platform&mdash;without compromising your values.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i + 1}
            >
              <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl mb-3">
                <span className="text-gold">{i + 1})</span> {section.heading}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground mb-4">
                {section.intro}
              </p>
              <ul className="space-y-4 pl-1">
                {section.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" />
                    <div>
                      <span className="font-heading text-sm font-semibold text-foreground">
                        {item.label}:
                      </span>{" "}
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {item.text}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
