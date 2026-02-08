import { useState } from "react";
import { Search, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { searchStocks, findStock, type HalalStock } from "@/data/halal-stocks";

const statusConfig = {
  HALAL: { color: "bg-halal text-white", icon: CheckCircle2, label: "HALAL" },
  "NOT HALAL": { color: "bg-haram text-white", icon: XCircle, label: "NOT HALAL" },
  QUESTIONABLE: { color: "bg-questionable text-white", icon: AlertTriangle, label: "QUESTIONABLE" },
};

function RatioCard({
  label,
  value,
  threshold,
  unit,
  pass,
}: {
  label: string;
  value: number;
  threshold: number;
  unit: string;
  pass: boolean;
}) {
  const pct = Math.min((value / threshold) * 100, 150);
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-ui text-sm font-medium text-foreground">{label}</span>
        {pass ? (
          <CheckCircle2 className="h-5 w-5 text-halal" />
        ) : (
          <XCircle className="h-5 w-5 text-haram" />
        )}
      </div>
      <div className="mb-2 font-heading text-2xl font-bold text-foreground">
        {value.toFixed(1)}%
      </div>
      <Progress
        value={Math.min(pct, 100)}
        className="h-2 bg-muted [&>div]:bg-primary"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Threshold: {unit} {threshold}%
      </p>
    </div>
  );
}

const SCREEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/screen-stock`;

export default function Screener() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HalalStock | null>(null);
  const [suggestions, setSuggestions] = useState<HalalStock[]>([]);
  const [isScreening, setIsScreening] = useState(false);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.trim().length >= 1) {
      setSuggestions(searchStocks(val).slice(0, 8));
    } else {
      setSuggestions([]);
    }
  };

  const selectStock = (stock: HalalStock) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = findStock(query);
    if (found) {
      setSelected(found);
      setSuggestions([]);
    } else if (suggestions.length > 0) {
      selectStock(suggestions[0]);
    } else if (query.trim()) {
      // Live screening fallback for tickers not in local data
      setIsScreening(true);
      setSelected(null);
      try {
        const resp = await fetch(SCREEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ symbol: query.trim() }),
        });
        if (resp.ok) {
          const result = await resp.json();
          console.log("Live screening result:", result);
          setSelected(result as HalalStock);
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Live screening failed:", err);
      } finally {
        setIsScreening(false);
      }
    }
  };

  const cfg = selected ? statusConfig[selected.status] : null;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Halal Stock Screener
        </h1>
        <p className="mt-3 text-muted-foreground">
          Check Shariah compliance using AAOIFI screening criteria
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="relative mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search any stock ticker (e.g. AAPL, MSFT)"
            className="h-12 rounded-2xl bg-card pl-12 text-base shadow-sm"
          />
        </div>

        {/* Dropdown suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg"
            >
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => selectStock(s)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted"
                >
                  <span className="font-ui font-semibold text-foreground">{s.symbol}</span>
                  <span className="flex-1 truncate text-sm text-muted-foreground">{s.name}</span>
                  <Badge className={`text-xs ${statusConfig[s.status].color}`}>
                    {s.status}
                  </Badge>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isScreening ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-heading text-lg font-semibold text-muted-foreground">
              Performing live AAOIFI screening...
            </p>
          </motion.div>
        ) : selected && cfg ? (
          <motion.div
            key={selected.symbol}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stock info card */}
            <Card className="mb-6 border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground">{selected.symbol}</h2>
                    <p className="text-sm text-muted-foreground">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.sector}</p>
                  </div>
                </div>
                <Badge className={`px-4 py-1.5 font-ui text-sm font-bold ${cfg.color}`}>
                  <cfg.icon className="mr-1.5 h-4 w-4" />
                  {cfg.label}
                </Badge>
              </CardContent>
            </Card>

            {/* AAOIFI Ratios */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg">AAOIFI Screening Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <RatioCard
                    label="Debt Ratio"
                    value={selected.ratios.debtRatio}
                    threshold={33}
                    unit="<"
                    pass={selected.ratios.debtRatio < 33}
                  />
                  <RatioCard
                    label="Interest Income"
                    value={selected.ratios.interestIncome}
                    threshold={5}
                    unit="<"
                    pass={selected.ratios.interestIncome < 5}
                  />
                  <RatioCard
                    label="Cash & Securities"
                    value={selected.ratios.cashSecurities}
                    threshold={33}
                    unit="<"
                    pass={selected.ratios.cashSecurities < 33}
                  />
                  <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-ui text-sm font-medium text-foreground">Business Activity</span>
                      {selected.ratios.businessActivity === "PASS" ? (
                        <CheckCircle2 className="h-5 w-5 text-halal" />
                      ) : selected.ratios.businessActivity === "FAIL" ? (
                        <XCircle className="h-5 w-5 text-haram" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-questionable" />
                      )}
                    </div>
                    <div className="font-heading text-2xl font-bold text-foreground">
                      {selected.ratios.businessActivity}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Core business must be Shariah-compliant
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-heading text-lg font-semibold text-muted-foreground">
              Search a stock to check its Shariah compliance
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Our database includes 2,127 pre-screened stocks. If a stock isn't
              found locally, we'll perform a live AAOIFI screening.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
