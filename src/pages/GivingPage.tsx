import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RamadanBanner } from "@/components/RamadanBanner";
import { CharitySection } from "@/components/CharitySection";
import SadaqahGivingTab from "@/components/calculators/SadaqahGivingTab";

export default function GivingPage() {
  const [activeAmount, setActiveAmount] = useState(0);
  const handleAmountChange = useCallback((amount: number) => setActiveAmount(amount), []);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-14">
      {/* Floating crescent decorations */}
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={`crescent-${i}`}
          className="pointer-events-none absolute select-none text-xl sm:text-2xl opacity-30"
          style={{
            top: `${10 + i * 15}%`,
            left: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
            right: i % 2 === 1 ? `${5 + i * 3}%` : undefined,
            color: i % 3 === 0 ? '#2D5A3D' : '#C9A962',
          }}
          animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        >
          ☪
        </motion.span>
      ))}

      {/* Gradient blob behind content */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, #C9A962 0%, #2D5A3D 50%, transparent 70%)' }} />

      <div className="container relative z-10 mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl" style={{ color: '#2D5A3D' }}>
            Sadaqah & Giving
          </h1>
          <p className="mt-3 text-muted-foreground">
            Track your voluntary charity and Zakat al-Fitr
          </p>
        </div>

        {/* Ramadan Banner — self-hides outside Ramadan */}
        <div className="mb-6">
          <RamadanBanner compact />
        </div>

        <SadaqahGivingTab onAmountChange={handleAmountChange} />

        {/* Charity Section — shown when amount > 0 */}
        {activeAmount > 0 && (
          <CharitySection activeTab="sadaqah" amount={activeAmount} />
        )}
      </div>
    </main>
  );
}
