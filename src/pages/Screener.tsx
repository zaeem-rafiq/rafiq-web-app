import { useState, useEffect } from "react";
import { Search, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { httpsCallable, functions } from "@/lib/firebase";
import {
  searchExtended,
  findStock,
  findInIndex,
  loadShariahIndex,
  isHalalStock,
  type HalalStock,
  type ShariahIndexEntry,
} from "@/data/halal-stocks";

const askRafiq = httpsCallable(functions, "askRafiqWeb");

interface LiveScreeningResult {
  symbol: string;
  name: string;
  sector: string;
  status: "HALAL" | "NOT HALAL" | "QUESTIONABLE";
  ratios: {
    debtRatio: number;
    interestIncome: number;
    cashSecurities: number;
    businessActivity: "PASS" | "FAIL" | "QUESTIONABLE";
  };
  notes: string;
}

function buildScreeningPrompt(ticker: string): string {
  return `You are a Shariah compliance screening assistant. Analyze the stock ticker "${ticker}" using AAOIFI financial screening standards.

Research this company's most recent annual financial statements and calculate these ratios:
1. Debt Ratio: (Total Interest-Bearing Debt / Trailing 36-Month Average Market Capitalization) x 100
2. Interest Income Ratio: (Interest Income / Total Revenue) x 100
3. Cash & Interest-Bearing Securities Ratio: (Cash + Interest-Bearing Securities / Trailing 36-Month Average Market Capitalization) x 100
4. Business Activity Screen: Does the company derive significant revenue from prohibited activities (alcohol, tobacco, gambling, pork, conventional financial services, weapons, adult entertainment)?

Thresholds:
- Debt Ratio must be < 33%
- Interest Income must be < 5%
- Cash & Securities must be < 33%
- Business Activity: PASS if compliant, FAIL if core business is haram, QUESTIONABLE if borderline

Overall Status:
- "HALAL" if all ratios pass AND business activity is PASS
- "NOT HALAL" if any ratio fails OR business activity is FAIL
- "QUESTIONABLE" if ratios are borderline (within 3% of threshold) OR business activity is QUESTIONABLE

You MUST respond with ONLY a JSON code block in this exact format, no other text before or after:

\`\`\`json
{
  "symbol": "${ticker}",
  "name": "Full Company Name",
  "sector": "Sector Name",
  "status": "HALAL | NOT HALAL | QUESTIONABLE",
  "ratios": {
    "debtRatio": 0.0,
    "interestIncome": 0.0,
    "cashSecurities": 0.0,
    "businessActivity": "PASS | FAIL | QUESTIONABLE"
  },
  "notes": "Brief explanation of the screening result and any caveats about data recency."
}
\`\`\``;
}

function parseLiveScreeningResponse(
  response: string
): LiveScreeningResult | null {
  try {
    const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)```/);
    const rawJson = jsonBlockMatch ? jsonBlockMatch[1].trim() : response.trim();
    const parsed = JSON.parse(rawJson);

    if (
      typeof parsed.symbol !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.sector !== "string" ||
      !["HALAL", "NOT HALAL", "QUESTIONABLE"].includes(parsed.status) ||
      typeof parsed.ratios?.debtRatio !== "number" ||
      typeof parsed.ratios?.interestIncome !== "number" ||
      typeof parsed.ratios?.cashSecurities !== "number" ||
      !["PASS", "FAIL", "QUESTIONABLE"].includes(parsed.ratios?.businessActivity)
    ) {
      return null;
    }

    return {
      symbol: parsed.symbol.toUpperCase(),
      name: parsed.name,
      sector: parsed.sector,
      status: parsed.status,
      ratios: {
        debtRatio: parsed.ratios.debtRatio,
        interestIncome: parsed.ratios.interestIncome,
        cashSecurities: parsed.ratios.cashSecurities,
        businessActivity: parsed.ratios.businessActivity,
      },
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return null;
  }
}

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

export default function Screener() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HalalStock | ShariahIndexEntry | null>(null);
  const [suggestions, setSuggestions] = useState<(HalalStock | ShariahIndexEntry)[]>([]);
  const [shariahIndex, setShariahIndex] = useState<ShariahIndexEntry[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [liveScreening, setLiveScreening] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveScreeningResult | null>(null);
  const [liveRawResponse, setLiveRawResponse] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    loadShariahIndex().then(setShariahIndex);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    setNotFound(false);
    setLiveResult(null);
    setLiveRawResponse(null);
    setLiveError(null);
    setLiveScreening(false);
    if (val.trim().length >= 1) {
      setSuggestions(searchExtended(val, shariahIndex).slice(0, 8));
    } else {
      setSuggestions([]);
    }
  };

  const selectStock = (stock: HalalStock | ShariahIndexEntry) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || liveScreening) return;

    // Reset live screening state
    setLiveResult(null);
    setLiveRawResponse(null);
    setLiveError(null);

    const ticker = query.trim().toUpperCase();

    // Try local detailed stocks
    const found = findStock(ticker);
    if (found) {
      setSelected(found);
      setSuggestions([]);
      setNotFound(false);
      return;
    }

    // Try shariah index
    const indexEntry = findInIndex(ticker, shariahIndex);
    if (indexEntry) {
      setSelected(indexEntry);
      setSuggestions([]);
      setNotFound(false);
      return;
    }

    // Try first suggestion
    if (suggestions.length > 0) {
      selectStock(suggestions[0]);
      setNotFound(false);
      return;
    }

    // Not found locally — trigger live AAOIFI screening
    setSelected(null);
    setSuggestions([]);
    setNotFound(true);
    setLiveScreening(true);

    try {
      const prompt = buildScreeningPrompt(ticker);
      const result = await askRafiq({ message: prompt, conversationHistory: [] });
      const response = (result.data as { response: string }).response;

      const parsed = parseLiveScreeningResponse(response);
      if (parsed) {
        setLiveResult(parsed);
      } else {
        setLiveRawResponse(response);
      }
    } catch (err) {
      console.error("Live screening error:", err);
      setLiveError("Could not complete live screening. Please try again later.");
    } finally {
      setLiveScreening(false);
    }
  };

  const selectedIsDetailed = selected && isHalalStock(selected);
  const cfg = selectedIsDetailed ? statusConfig[selected.status] : selected ? statusConfig["HALAL"] : null;

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
            placeholder="Search by ticker or company name (e.g. AAPL, Cummins)"
            className="h-12 rounded-2xl bg-card pl-12 text-base shadow-sm"
          />
        </div>

        {/* Dropdown suggestions */}
        <AnimatePresence>
          {query.trim().length >= 1 && !selected && !notFound && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg"
            >
              {suggestions.length > 0 ? (
                suggestions.map((s) => {
                  const detailed = isHalalStock(s);
                  const status = detailed ? s.status : "HALAL";
                  return (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => selectStock(s)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted"
                    >
                      <span className="font-ui font-semibold text-foreground">{s.symbol}</span>
                      <span className="flex-1 truncate text-sm text-muted-foreground">
                        {detailed ? s.name : s.sector}
                      </span>
                      <Badge className={`text-xs ${statusConfig[status].color}`}>
                        {status}
                      </Badge>
                    </button>
                  );
                })
              ) : (
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Press Enter to screen <span className="font-semibold text-foreground">"{query.trim()}"</span>
                  </span>
                </button>
              )}
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
                    <p className="text-sm text-muted-foreground">
                      {selectedIsDetailed ? selected.name : selected.sector}
                    </p>
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
            {selectedIsDetailed ? (
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
            ) : (
              <Card className="border-border/50 bg-card shadow-sm">
                <CardContent className="p-7">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-halal" />
                    <div>
                      <p className="font-ui text-sm font-medium text-foreground">
                        Shariah Index Constituent
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This stock is included in the Dow Jones Islamic Market / S&P Shariah Index
                        and has passed Shariah screening criteria. Detailed AAOIFI ratio breakdowns
                        are not yet available for this stock.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : notFound && liveScreening ? (
          <motion.div
            key="live-screening-loading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6 border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-28 rounded-full" />
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                      <Skeleton className="mb-2 h-8 w-16" />
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="mt-2 h-3 w-28" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Performing live AAOIFI screening for {query.toUpperCase()}...
            </p>
          </motion.div>
        ) : notFound && liveResult ? (
          <motion.div
            key={`live-${liveResult.symbol}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6 border-border/50 bg-card shadow-sm">
              <CardContent className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-foreground">{liveResult.symbol}</h2>
                    <p className="text-sm text-muted-foreground">{liveResult.name}</p>
                    <p className="text-xs text-muted-foreground">{liveResult.sector}</p>
                  </div>
                </div>
                <Badge className={`px-4 py-1.5 font-ui text-sm font-bold ${statusConfig[liveResult.status].color}`}>
                  {(() => { const Icon = statusConfig[liveResult.status].icon; return <Icon className="mr-1.5 h-4 w-4" />; })()}
                  {statusConfig[liveResult.status].label}
                </Badge>
              </CardContent>
            </Card>

            <Card className="mb-6 border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg">AAOIFI Screening Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <RatioCard label="Debt Ratio" value={liveResult.ratios.debtRatio} threshold={33} unit="<" pass={liveResult.ratios.debtRatio < 33} />
                  <RatioCard label="Interest Income" value={liveResult.ratios.interestIncome} threshold={5} unit="<" pass={liveResult.ratios.interestIncome < 5} />
                  <RatioCard label="Cash & Securities" value={liveResult.ratios.cashSecurities} threshold={33} unit="<" pass={liveResult.ratios.cashSecurities < 33} />
                  <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-ui text-sm font-medium text-foreground">Business Activity</span>
                      {liveResult.ratios.businessActivity === "PASS" ? (
                        <CheckCircle2 className="h-5 w-5 text-halal" />
                      ) : liveResult.ratios.businessActivity === "FAIL" ? (
                        <XCircle className="h-5 w-5 text-haram" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-questionable" />
                      )}
                    </div>
                    <div className="font-heading text-2xl font-bold text-foreground">
                      {liveResult.ratios.businessActivity}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Core business must be Shariah-compliant
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {liveResult.notes && (
              <Card className="mb-4 border-border/50 bg-card shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{liveResult.notes}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
              <div>
                <p className="font-ui text-sm font-medium text-foreground">AI-Generated Screening</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This result was generated by AI based on publicly available financial data and is not
                  verified by a certified Shariah auditor. Financial ratios may not reflect the most
                  recent filings. Please consult a qualified Islamic scholar before making investment decisions.
                </p>
              </div>
            </div>
          </motion.div>
        ) : notFound && liveRawResponse ? (
          <motion.div
            key="live-markdown"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-4 border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-heading text-lg">
                  Live AAOIFI Screening: {query.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{liveRawResponse}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
              <div>
                <p className="font-ui text-sm font-medium text-foreground">AI-Generated Screening</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This result was generated by AI based on publicly available financial data and is not
                  verified by a certified Shariah auditor. Please consult a qualified Islamic scholar
                  before making investment decisions.
                </p>
              </div>
            </div>
          </motion.div>
        ) : notFound && liveError ? (
          <motion.div
            key="live-error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="font-heading text-lg font-semibold text-foreground">Screening Failed</p>
            <p className="max-w-sm text-sm text-muted-foreground">{liveError}</p>
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
