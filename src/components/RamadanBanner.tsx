import { getRamadanInfo } from "@/lib/giving-utils";
import { Progress } from "@/components/ui/progress";

export function RamadanBanner({ compact = false }: { compact?: boolean }) {
  const { isRamadan, dayOfRamadan, totalDays, isLast10 } = getRamadanInfo();

  if (!isRamadan) return null;

  const progress = (dayOfRamadan / totalDays) * 100;

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl border border-border/30 p-4"
        style={{ backgroundColor: "rgba(201, 169, 98, 0.08)" }}
      >
        <span className="text-2xl">☪</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Ramadan Day {dayOfRamadan} of {totalDays}
          </p>
          <Progress value={progress} className="mt-1.5 h-1.5" />
        </div>
        {isLast10 && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: "#C9A962" }}>
            Last 10 Nights
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border border-border/30 p-6 text-center shadow-sm"
      style={{ backgroundColor: "rgba(201, 169, 98, 0.08)" }}
    >
      <span className="text-4xl">☪</span>
      <h2 className="mt-3 font-heading text-xl font-bold text-foreground">
        Ramadan Mubarak
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Day <strong>{dayOfRamadan}</strong> of {totalDays}
        {isLast10 && (
          <span className="ml-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: "#C9A962" }}>
            Last 10 Nights
          </span>
        )}
      </p>
      <Progress value={progress} className="mx-auto mt-4 h-2 max-w-xs" />
      <p className="mt-3 text-xs text-muted-foreground italic">
        {isLast10
          ? "Seek Laylat al-Qadr — a night better than a thousand months"
          : "The best charity is that given in Ramadan — Tirmidhi"}
      </p>
    </div>
  );
}
