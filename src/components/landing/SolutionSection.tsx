import { BookOpen, Eye, Users, Workflow, ShieldCheck } from "lucide-react";
import { DiamondAccent } from "@/assets/islamic-patterns";

const differentiators = [
  {
    icon: BookOpen,
    title: "Every school. Every asset.",
    description:
      "Rafiq supports all 5 madhabs — Hanafi, Shafi'i, Maliki, Hanbali, and Ja'fari — across the assets your financial life actually includes: RSUs, stock options, ESPP shares, crypto staking rewards, 401(k)s, IRAs, rental properties, business inventory, gold, and silver.",
  },
  {
    icon: Eye,
    title: "Show your work.",
    description:
      "Every calculation comes with citations to scholarly sources, explicit assumptions you can review and override, and a madhab toggle so you can compare approaches side by side. When a scenario is ambiguous, Rafiq tells you — instead of pretending it's simple.",
  },
  {
    icon: Users,
    title: "Zakat and khums. One platform.",
    description:
      "The first platform purpose-built for both zakat (2.5% obligation) and khums (20% surplus income). Whether you follow the Ja'fari school or any of the four Sunni schools, your obligations are calculated correctly, in one place.",
  },
  {
    icon: Workflow,
    title: "Calculate. Explain. Give. Track.",
    description:
      "Rafiq isn't a calculator. It's a workflow. Calculate your obligation. Read the explanation. Distribute to verified recipients. Get a receipt. Build multi-year records that make next year take minutes instead of hours.",
  },
  {
    icon: ShieldCheck,
    title: "150+ edge cases. Validated.",
    description:
      "RSU vesting schedules with different grant dates. Crypto staking yields. Mixed halal-and-haram portfolios. Partial-year residency. Retirement accounts under each madhab. We've tested against the real-world scenarios that other calculators ignore.",
  },
];

function DifferentiatorCard({ d }: { d: typeof differentiators[number] }) {
  return (
    <div className="flex-shrink-0 w-[320px] sm:w-[360px] rounded-2xl border border-white/10 bg-white/[0.05] p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
        <d.icon size={22} className="text-gold" />
      </div>
      <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-white">
        <DiamondAccent size={6} className="text-gold" />
        {d.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{d.description}</p>
    </div>
  );
}

export default function SolutionSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 pattern-islamic-gold opacity-30" />

      <div className="relative mb-14 text-center">
        <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
          What Rafiq does differently
        </h2>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex w-max gap-6 animate-scroll-left hover:[animation-play-state:paused]">
          {differentiators.map((d) => (
            <DifferentiatorCard key={d.title} d={d} />
          ))}
          {/* Duplicate set for seamless loop */}
          {differentiators.map((d) => (
            <DifferentiatorCard key={`dup-${d.title}`} d={d} />
          ))}
        </div>
      </div>
    </section>
  );
}
