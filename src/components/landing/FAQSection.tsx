import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What assets does Rafiq support?",
    a: "Cash and savings, gold and silver, stocks, ETFs, and mutual funds, retirement accounts (401k, IRA, Roth IRA), RSUs and stock options, ESPP shares, cryptocurrency (including staking rewards), rental and investment property, business inventory, livestock, and agricultural produce. If you hold it, Rafiq can calculate zakat on it.",
  },
  {
    q: "Which madhabs does Rafiq support?",
    a: "All five major schools of Islamic jurisprudence: Hanafi, Shafi'i, Maliki, Hanbali, and Ja'fari. Each madhab has different rules for which assets are zakatable, how debts are deducted, whether jewelry counts, and what nisab threshold applies. Rafiq applies the correct rules for the school you follow.",
  },
  {
    q: "Does Rafiq calculate khums?",
    a: "Yes. Rafiq is the first platform to support both zakat and khums in a single workflow. Khums (20% of annual surplus income) is calculated with proper Sahm al-Imam and Sahm al-Sadat splits according to Ja'fari jurisprudence.",
  },
  {
    q: "How accurate are the calculations?",
    a: "Our rules engine covers 500+ rules across 5 madhabs and has been validated against 150+ real-world edge cases — including RSU vesting schedules, crypto staking yields, and mixed halal/haram portfolios. On our held-out test set, accuracy is 94%. When a scenario involves scholarly disagreement or unusual complexity, Rafiq flags it and recommends consulting a scholar rather than guessing.",
  },
  {
    q: "Can I see how my zakat was calculated?",
    a: "Yes. This is what makes Rafiq different. Every calculation shows the specific rulings applied, the nisab threshold used (with live gold and silver prices), all assumptions made, and citations to scholarly sources. You can toggle between madhabs to see how your obligation changes under different schools.",
  },
  {
    q: "Is my financial data secure?",
    a: "Rafiq uses encryption in transit and at rest, follows least-privilege access principles, and does not sell or share your financial data. We process donations through verified partners so Rafiq never custodies your funds.",
  },
  {
    q: "How much does Rafiq cost?",
    a: "Rafiq is free during the launch period. Premium features — including full audit trail, multi-year records, and advanced edge-case handling — will be available via a monthly subscription. Pricing details will be announced before Ramadan.",
  },
  {
    q: "When does Rafiq launch?",
    a: "Ramadan 2026. Join the waitlist to get early access and launch updates.",
  },
  {
    q: "Is Rafiq a replacement for consulting a scholar?",
    a: "No. Rafiq is a calculation and tracking tool that helps you understand your obligations with citations and transparency. For complex personal situations or questions of scholarly interpretation, we always recommend consulting a qualified Islamic scholar. In fact, when Rafiq encounters a genuinely uncertain scenario, it tells you to do exactly that.",
  },
  {
    q: "What makes Rafiq different from other zakat calculators?",
    a: "Three things. First, we support all 5 madhabs across modern assets that other calculators ignore — RSUs, crypto, ESPP, retirement accounts under each school. Second, we show our work: every number comes with citations, assumptions, and a madhab toggle. Third, we support both zakat and khums, and provide a full calculate-explain-give-track workflow — not just a number.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function FAQSection() {
  return (
    <section className="relative px-4 py-20 sm:py-28">
      <div className="container relative mx-auto max-w-3xl">
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={1}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border/50"
              >
                <AccordionTrigger className="text-left font-heading text-sm font-semibold text-foreground hover:no-underline hover:text-primary sm:text-base [&>svg]:text-gold">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
