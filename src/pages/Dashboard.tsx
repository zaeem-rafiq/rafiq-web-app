import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Heart,
  Search,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { RamadanBanner } from "@/components/RamadanBanner";

const HADITHS = [
  {
    text: "Charity does not decrease wealth.",
    source: "Sahih Muslim 2588",
  },
  {
    text: "The upper hand is better than the lower hand — the upper hand being the one that gives, and the lower hand being the one that receives.",
    source: "Sahih al-Bukhari 1427",
  },
  {
    text: "Protect yourselves from the Fire even if with half a date in charity.",
    source: "Sahih al-Bukhari 1417",
  },
  {
    text: "The believer's shade on the Day of Resurrection will be their charity.",
    source: "Musnad Ahmad 17333",
  },
  {
    text: "Give charity without delay, for it stands in the way of calamity.",
    source: "Al-Tirmidhi 589",
  },
  {
    text: "The best charity is that given in Ramadan.",
    source: "Al-Tirmidhi 663",
  },
  {
    text: "Whoever gives food for a fasting person to break their fast, they will have a reward like theirs.",
    source: "Al-Tirmidhi 807",
  },
  {
    text: "A man's spending on his family is charity.",
    source: "Sahih al-Bukhari 55",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [hadithIndex, setHadithIndex] = useState(0);

  const firstName = (userProfile?.displayName || "").split(" ")[0] || "there";
  const isJafari = userProfile?.madhab === "jafari";

  // Rotate hadith every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHadithIndex((prev) => (prev + 1) % HADITHS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      label: "Calculate Zakat",
      icon: Calculator,
      to: "/zakat",
      color: "#2D5A3D",
      bg: "rgba(45, 90, 61, 0.08)",
    },
    {
      label: "Purify Dividends",
      icon: Sparkles,
      to: "/tatheer",
      color: "#2D5A3D",
      bg: "rgba(45, 90, 61, 0.08)",
    },
    {
      label: "Give",
      icon: Heart,
      to: "/giving",
      color: "#C9A962",
      bg: "rgba(201, 169, 98, 0.08)",
    },
    {
      label: "Screen a Stock",
      icon: Search,
      to: "/screener",
      color: "#2D5A3D",
      bg: "rgba(45, 90, 61, 0.08)",
    },
    {
      label: "Ask Rafiq",
      icon: MessageCircle,
      to: "/ask",
      color: "#C9A962",
      bg: "rgba(201, 169, 98, 0.08)",
    },
    ...(isJafari
      ? [
          {
            label: "Calculate Khums",
            icon: Calculator,
            to: "/khums",
            color: "#C9A962" as string,
            bg: "rgba(201, 169, 98, 0.08)",
          },
        ]
      : []),
  ];

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-14">
      {/* Floating crescent decorations */}
      {[...Array(4)].map((_, i) => (
        <motion.span
          key={`crescent-${i}`}
          className="pointer-events-none absolute select-none text-xl opacity-20"
          style={{
            top: `${15 + i * 20}%`,
            left: i % 2 === 0 ? `${3 + i * 4}%` : undefined,
            right: i % 2 === 1 ? `${3 + i * 4}%` : undefined,
            color: i % 2 === 0 ? "#2D5A3D" : "#C9A962",
          }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          ☪
        </motion.span>
      ))}

      <div className="container relative z-10 mx-auto max-w-2xl">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl text-foreground">
            As-salamu alaykum, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{getGreeting()}</p>
        </div>

        {/* Ramadan Banner */}
        <div className="mb-6">
          <RamadanBanner compact />
        </div>

        {/* Quick Actions */}
        <div className={`mb-8 grid gap-3 ${quickActions.length > 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <Card className="border-border/30 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                <CardContent className="flex flex-col items-center gap-2 p-5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: action.bg }}
                  >
                    <action.icon size={20} style={{ color: action.color }} />
                  </div>
                  <span className="font-ui text-xs font-semibold text-foreground text-center">
                    {action.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Obligations Snapshot */}
        <Card className="mb-6 rounded-3xl border-border/30 bg-white/70 shadow-xl backdrop-blur-xl">
          <CardContent className="p-6">
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
              Obligations
            </h2>
            <div className="space-y-3">
              <Link to="/zakat">
                <div className="flex items-center justify-between rounded-2xl border border-border/20 p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <p className="font-ui text-sm font-semibold text-foreground">Zakat</p>
                    <p className="text-xs text-muted-foreground">
                      2.5% on qualifying wealth above nisab
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#2D5A3D" }}>
                    Calculate <ArrowRight size={14} />
                  </span>
                </div>
              </Link>

              {isJafari && (
                <Link to="/khums">
                  <div className="flex items-center justify-between rounded-2xl border border-border/20 p-4 transition-colors hover:bg-muted/30">
                    <div>
                      <p className="font-ui text-sm font-semibold text-foreground">Khums</p>
                      <p className="text-xs text-muted-foreground">
                        20% on annual surplus income
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#C9A962" }}>
                      Calculate <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              )}

              <Link to="/tatheer">
                <div className="flex items-center justify-between rounded-2xl border border-border/20 p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <p className="font-ui text-sm font-semibold text-foreground">Tatheer</p>
                    <p className="text-xs text-muted-foreground">
                      Purify dividends from non-compliant activity
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#2D5A3D" }}>
                    Calculate <ArrowRight size={14} />
                  </span>
                </div>
              </Link>

              <Link to="/giving">
                <div className="flex items-center justify-between rounded-2xl border border-border/20 p-4 transition-colors hover:bg-muted/30">
                  <div>
                    <p className="font-ui text-sm font-semibold text-foreground">Zakat al-Fitr</p>
                    <p className="text-xs text-muted-foreground">
                      Due before Eid prayer
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#2D5A3D" }}>
                    View <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Rotating Hadith */}
        <Card
          className="rounded-3xl border-border/30 shadow-sm"
          style={{ backgroundColor: "rgba(201, 169, 98, 0.06)" }}
        >
          <CardContent className="p-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={hadithIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
              >
                <p className="font-heading text-sm italic text-foreground leading-relaxed">
                  "{HADITHS[hadithIndex].text}"
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  — {HADITHS[hadithIndex].source}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex justify-center gap-1">
              {HADITHS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === hadithIndex ? 16 : 6,
                    backgroundColor: i === hadithIndex ? "#C9A962" : "#E5E7EB",
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
