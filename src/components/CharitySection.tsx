import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const CHARITIES = [
  { name: "Islamic Relief USA", url: "https://every.org/islamic-relief-usa" },
  { name: "ICNA Relief", url: "https://every.org/icna-relief" },
  { name: "Helping Hand HHRD", url: "https://every.org/hhrd" },
  { name: "Penny Appeal USA", url: "https://every.org/penny-appeal-usa" },
  { name: "Zakat Foundation of America", url: "https://every.org/zakat-foundation-of-america" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function CharitySection({ activeTab, amount }: { activeTab: string; amount: number }) {
  const headings: Record<string, string> = {
    zakat: "Give Your Zakat",
    tatheer: "Purify Your Earnings",
    khums: "Fulfill Your Khums",
    sadaqah: "Give Sadaqah",
    fitr: "Give Your Zakat al-Fitr",
  };

  return (
    <div className="mt-10 space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {headings[activeTab] || "Give With Confidence"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your calculated amount:{" "}
          <span className="font-semibold text-foreground">{fmt(amount)}</span>
        </p>
      </div>

      {/* LaunchGood Button */}
      <div className="text-center">
        <a
          href="https://www.launchgood.com/discover#checks[categories]=Zakat"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            className="gap-2 font-ui font-semibold text-white"
            style={{ backgroundColor: "#C9A962" }}
          >
            Browse on LaunchGood <ExternalLink size={16} />
          </Button>
        </a>
      </div>

      {/* Charity Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHARITIES.map((charity) => (
          <Card key={charity.name} className="border-border/50 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <span className="font-ui text-sm font-medium" style={{ color: "#2D5A3D" }}>
                {charity.name}
              </span>
              <a
                href={charity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-ui text-sm font-semibold transition-colors hover:underline"
                style={{ color: "#C9A962" }}
              >
                Donate →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground">
        Rafiq is not affiliated with any of the above organizations. Please verify each
        charity's credentials and ensure your donation meets your scholarly and personal
        requirements.
      </p>
    </div>
  );
}
