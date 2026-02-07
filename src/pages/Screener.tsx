import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadScreenerData, searchStocks, findStock, type HalalStock } from "@/data/halal-stocks";

const statusConfig = {
  HALAL: { color: "bg-halal text-white", icon: CheckCircle2, label: "HALAL" },
  "NOT HALAL": { color: "bg-haram text-white", icon: XCircle, label: "NOT HALAL" },
  QUESTIONABLE: { color: "bg-questionable text-white", icon: AlertTriangle, label: "QUESTIONABLE" },
};

export default function Screener() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HalalStock | null>(null);
  const [suggestions, setSuggestions] = useState<HalalStock[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Pre-load the DJIM dataset on mount
  useEffect(() => {
    loadScreenerData().then(() => setDataReady(true));
  }, []);

  const handleSearch = useCallback(async (val: string) => {
    setQuery(val);
    setNotFound(false);
    if (val.trim().length >= 1) {
      const results = await searchStocks(val);
      setSuggestions(results.slice(0, 8));
    } else {
      setSuggestions([]);
    }
  }, []);

  const selectStock = (stock: HalalStock) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setSuggestions([]);
    setNotFound(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = await findStock(query);
    if (found) {
      setSelected(found);
      setSuggestions([]);
      setNotFound(false);
    } else if (suggestions.length > 0) {
      selectStock(suggestions[0]);
    } else {
      setSelected(null);
      setSuggestions([]);
      setNotFound(true);
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
            placeholder={dataReady ? "Search any stock ticker (e.g. AAPL, MSFT)" : "Loading screener data..."}
            className="h-12 rounded-2xl bg-card pl-12 text-base shadow-sm"
            disabled={!dataReady}
          />
          {!dataReady && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
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
        {selected && cfg ? (
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

            {/* Status explanation */}
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg">Screening Result</CardTitle>
              </CardHeader>
              <CardContent>
                {selected.status === "HALAL" ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">{selected.symbol}</strong> is included in the
                    Dow Jones Islamic Market (DJIM) index, meaning it has passed Shariah screening
                    criteria including debt ratio, interest income, and business activity checks.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">{selected.symbol}</strong> is classified as{" "}
                    <strong className="text-haram">NOT HALAL</strong> because its core business involves
                    activities that are not permissible under Shariah law (e.g. conventional banking,
                    alcohol, tobacco, gambling, or weapons manufacturing).
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : notFound ? (
          <motion.div
            key="not-found"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <AlertTriangle className="h-8 w-8 text-questionable" />
            </div>
            <p className="font-heading text-lg font-semibold text-muted-foreground">
              Stock not found in our database
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              "{query.toUpperCase()}" was not found in the DJIM index or our known haram list.
              This doesn't mean it's halal or haram — please consult a qualified scholar or
              check the AAOIFI screening criteria manually.
            </p>
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
              Our database includes 2,127 pre-screened stocks, 5 ETFs, and 4 mutual funds
              from the Dow Jones Islamic Market index.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
