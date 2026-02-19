import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Info,
  AlertTriangle,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  loadDJIMData,
  searchDJIM,
  findStock,
  type DJIMStock,
} from "@/data/halal-stocks";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface TatheerTabProps {
  onAmountChange: (amount: number) => void;
}

interface TatheerData {
  hasDividend?: boolean;
  companyName: string;
  annualDividend?: number;
  quarterlyDividend?: number;
  totalAnnualDividends?: number;
  totalQuarterlyDividends?: number;
  nonCompliantRatio?: number;
  annualPurification?: number;
  quarterlyPurification?: number;
  shares?: number;
  resolvedTicker?: string;
  inputWasResolved?: boolean;
  isNotHalal?: boolean;
  currentPrice?: number;
}

export default function TatheerTab({ onAmountChange }: TatheerTabProps) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState<number>(0);
  const [tatheerLoading, setTatheerLoading] = useState(false);
  const [tatheerData, setTatheerData] = useState<TatheerData | null>(null);
  const [tatheerError, setTatheerError] = useState<string | null>(null);
  const [costBasisInput, setCostBasisInput] = useState("");
  const [showCostBasis, setShowCostBasis] = useState(false);

  // Ticker Autocomplete State
  const [tickerInput, setTickerInput] = useState("");
  const [djimStocks, setDjimStocks] = useState<DJIMStock[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load DJIM data on mount
  useEffect(() => {
    loadDJIMData().then(setDjimStocks);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Report amount to parent
  useEffect(() => {
    if (!tatheerData) {
      onAmountChange(0);
      return;
    }
    if (tatheerData.isNotHalal) {
      const baseDonation = tatheerData.totalAnnualDividends ?? 0;
      const cb = parseFloat(costBasisInput);
      if (cb > 0 && tatheerData.currentPrice) {
        const unrealizedGains = (tatheerData.currentPrice - cb) * (tatheerData.shares ?? 0);
        onAmountChange(baseDonation + Math.max(unrealizedGains, 0));
      } else {
        onAmountChange(baseDonation);
      }
    } else {
      onAmountChange(tatheerData.annualPurification ?? 0);
    }
  }, [tatheerData, costBasisInput, onAmountChange]);

  // Filter stocks based on input
  const isExactTicker = /^[A-Z]{1,5}$/.test(tickerInput);
  const filteredStocks: DJIMStock[] = (() => {
    if (!tickerInput.trim() || isExactTicker) return [];
    return searchDJIM(tickerInput).slice(0, 8);
  })();

  const handleTickerInputChange = useCallback(
    (value: string) => {
      setTickerInput(value);
      const upper = value.trim().toUpperCase();
      if (/^[A-Z]{1,5}$/.test(upper)) {
        const isKnownTicker =
          djimStocks.some(s => s.symbol === upper) ||
          findStock(upper) !== undefined;
        const nameMatches = searchDJIM(value.trim());
        if (isKnownTicker && nameMatches.length <= 1) {
          setTicker(upper);
          setShowDropdown(false);
        } else if (nameMatches.length > 0) {
          setTicker("");
          setShowDropdown(true);
        } else {
          setTicker(upper);
          setShowDropdown(false);
        }
      } else {
        setTicker("");
        setShowDropdown(value.trim().length > 0);
      }
    },
    [djimStocks],
  );

  const handleSuggestionClick = useCallback(
    (stock: DJIMStock) => {
      setTicker(stock.symbol);
      setTickerInput(`${stock.name} (${stock.symbol})`);
      setShowDropdown(false);
    },
    [],
  );

  const handleTatheerLookup = async () => {
    setCostBasisInput("");
    setShowCostBasis(false);

    let resolvedTicker = ticker.trim().toUpperCase();
    let wasResolvedFromIndex = false;

    if (/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(resolvedTicker)) {
      // ticker is already a valid symbol
    } else if (tickerInput.trim()) {
      const q = tickerInput.trim().toLowerCase();

      const localMatch = findStock(q);
      if (localMatch) {
        resolvedTicker = localMatch.symbol;
        wasResolvedFromIndex = true;
      } else {
        const djimMatch = djimStocks.find(s =>
          s.name.toLowerCase().includes(q) || s.symbol.toLowerCase() === q
        );
        if (djimMatch) {
          resolvedTicker = djimMatch.symbol;
          wasResolvedFromIndex = true;
        } else {
          const cleaned = tickerInput.trim()
            .replace(/\b(Inc\.?|Corp\.?|Co\.?|Ltd\.?|LLC|PLC|Group|Company|Corporation|Incorporated)\s*$/i, "")
            .trim();
          resolvedTicker = (cleaned || tickerInput.trim()).toUpperCase();
        }
      }
    } else {
      return;
    }

    const displayFallback = tickerInput.trim() || resolvedTicker;

    setTatheerLoading(true);
    setTatheerError(null);
    setTatheerData(null);

    try {
      const callGetTatheerData = httpsCallable(functions, "getTatheerData");
      const result = await callGetTatheerData({ symbol: resolvedTicker, shares: shares });
      const raw = result.data as any;
      const data = raw?.data ?? raw?.result ?? raw;

      const cfResolved = !wasResolvedFromIndex && (data.inputWasResolved === true);
      const resolvedSymbol = data.resolvedTicker || resolvedTicker;
      const isNotHalal = data.isNotHalal === true
        || findStock(resolvedSymbol)?.status === "NOT HALAL";
      const price = Number(data.currentPrice) || undefined;

      if (data.hasDividend === false) {
        setTatheerData({
          hasDividend: false,
          companyName: data.companyName || displayFallback,
          resolvedTicker: resolvedSymbol,
          inputWasResolved: cfResolved,
          isNotHalal,
          currentPrice: price,
        });
      } else {
        setTatheerData({
          hasDividend: true,
          companyName: data.companyName || displayFallback,
          annualDividend: Number(data.annualDividend) || 0,
          quarterlyDividend: Number(data.quarterlyDividend) || 0,
          totalAnnualDividends: Number(data.totalAnnualDividends) || 0,
          totalQuarterlyDividends: Number(data.totalQuarterlyDividends) || 0,
          nonCompliantRatio: Number(data.nonCompliantRatio) || 0,
          annualPurification: Number(data.annualPurification) || 0,
          quarterlyPurification: Number(data.quarterlyPurification) || 0,
          shares: Number(data.shares) || 0,
          resolvedTicker: resolvedSymbol,
          inputWasResolved: cfResolved,
          isNotHalal,
          currentPrice: price,
        });
      }
    } catch (err) {
      console.error("getTatheerData error:", err);
      setTatheerError("Failed to fetch Tatheer data. Please try again.");
    } finally {
      setTatheerLoading(false);
    }
  };

  return (
    <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
      <CardHeader>
        <CardTitle className="font-heading">Stock Purification (Tatheer)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Purify your investment income by calculating the portion of dividends that
          may come from non-halal business activities.
        </p>

        <div ref={dropdownRef}>
          <Label className="font-ui text-sm font-medium">Stock Ticker or Company Name</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={tickerInput}
              onChange={(e) => handleTickerInputChange(e.target.value)}
              onFocus={() => {
                if (tickerInput.trim() && !isExactTicker) setShowDropdown(true);
              }}
              className="bg-card pl-11"
              placeholder="e.g. AAPL or Apple"
            />
            {showDropdown && filteredStocks.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-md border border-border bg-white shadow-lg"
                style={{ zIndex: 50 }}
              >
                {filteredStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:text-white"
                    style={{ backgroundColor: "white" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2D5A3D";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.color = "";
                    }}
                    onClick={() => handleSuggestionClick(stock)}
                  >
                    {stock.name} ({stock.symbol})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label className="font-ui text-sm font-medium">Number of Shares</Label>
          <div className="relative mt-1.5">
            <Input
              type="number"
              min={0}
              value={shares || ""}
              onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
              className="bg-card"
              placeholder="0"
            />
          </div>
        </div>

        <Button
          onClick={handleTatheerLookup}
          disabled={tatheerLoading || (!ticker.trim() && !tickerInput.trim())}
          className="w-full gap-2 font-ui font-semibold"
        >
          {tatheerLoading ? (
            "Looking up…"
          ) : (
            <>
              Look Up Dividend Data <Search size={16} />
            </>
          )}
        </Button>

        {tatheerError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm text-destructive">
            {tatheerError}
          </div>
        )}

        {tatheerData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Haram stock warning banner */}
            {tatheerData.isNotHalal && (
              <div className="flex gap-3 rounded-2xl border border-red-300 bg-red-50 p-5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="space-y-2 text-sm text-red-800">
                  <p className="font-semibold">
                    {tatheerData.companyName} is classified as Not Halal
                  </p>
                  <p>
                    Scholars recommend donating <strong>all</strong> dividend income
                    from this stock to charity and selling your shares as soon as
                    reasonably possible.
                  </p>
                  {tatheerData.hasDividend !== false && (
                    <p>
                      The amounts below reflect <strong>100%</strong> of your dividends,
                      not just the non-compliant portion.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Resolution confirmation banner */}
            {tatheerData.inputWasResolved && (
              <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Resolved to: <strong>{tatheerData.companyName}</strong>
                  {tatheerData.resolvedTicker && ` (${tatheerData.resolvedTicker})`}.
                  If incorrect, try entering the ticker symbol directly.
                </p>
              </div>
            )}

            <h3 className="font-heading text-sm font-semibold text-foreground">
              Results for {tatheerData.companyName}
            </h3>

            {tatheerData.hasDividend === false ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-5 text-center text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                <Info className="mx-auto mb-2 h-5 w-5" />
                {tatheerData.isNotHalal
                  ? "This stock doesn't pay dividends, but it is still classified as not halal. Consider selling your shares."
                  : "This stock doesn't pay dividends. No purification is needed."}
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const displayQuarterlyPurification = tatheerData.isNotHalal
                    ? (tatheerData.totalQuarterlyDividends ?? 0)
                    : (tatheerData.quarterlyPurification ?? 0);
                  const displayAnnualPurification = tatheerData.isNotHalal
                    ? (tatheerData.totalAnnualDividends ?? 0)
                    : (tatheerData.annualPurification ?? 0);

                  return (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Quarterly Column */}
                        <div className="space-y-3">
                          <h4 className="font-heading text-xs font-semibold text-muted-foreground text-center">Quarterly</h4>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Dividend / Share
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              ${(tatheerData.quarterlyDividend ?? 0).toFixed(4)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Total Dividends
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              {fmt(tatheerData.totalQuarterlyDividends ?? 0)}
                            </p>
                          </div>
                          <div className={`rounded-2xl p-5 text-center ${tatheerData.isNotHalal ? "bg-red-50" : ""}`} style={tatheerData.isNotHalal ? {} : { backgroundColor: "#C9A96220" }}>
                            <p className={`font-ui text-xs font-medium ${tatheerData.isNotHalal ? "text-red-600" : ""}`} style={tatheerData.isNotHalal ? {} : { color: "#C9A962" }}>
                              {tatheerData.isNotHalal ? "Donate (100%)" : "Purification"}
                            </p>
                            <p className={`mt-1.5 font-heading text-lg font-bold ${tatheerData.isNotHalal ? "text-red-700" : ""}`} style={tatheerData.isNotHalal ? {} : { color: "#C9A962" }}>
                              {fmt(displayQuarterlyPurification)}
                            </p>
                          </div>
                        </div>
                        {/* Annual Column */}
                        <div className="space-y-3">
                          <h4 className="font-heading text-xs font-semibold text-muted-foreground text-center">Annual</h4>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Dividend / Share
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              ${(tatheerData.annualDividend ?? 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-muted/40 p-5 text-center">
                            <p className="font-ui text-xs font-medium text-muted-foreground">
                              Total Dividends
                            </p>
                            <p className="mt-1.5 font-heading text-lg font-bold text-foreground">
                              {fmt(tatheerData.totalAnnualDividends ?? 0)}
                            </p>
                          </div>
                          <div className={`rounded-2xl p-5 text-center ${tatheerData.isNotHalal ? "bg-red-50" : ""}`} style={tatheerData.isNotHalal ? {} : { backgroundColor: "#C9A96220" }}>
                            <p className={`font-ui text-xs font-medium ${tatheerData.isNotHalal ? "text-red-600" : ""}`} style={tatheerData.isNotHalal ? {} : { color: "#C9A962" }}>
                              {tatheerData.isNotHalal ? "Donate (100%)" : "Purification"}
                            </p>
                            <p className={`mt-1.5 font-heading text-lg font-bold ${tatheerData.isNotHalal ? "text-red-700" : ""}`} style={tatheerData.isNotHalal ? {} : { color: "#C9A962" }}>
                              {fmt(displayAnnualPurification)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Non-compliant ratio or haram note */}
                      {tatheerData.isNotHalal ? (
                        <p className="text-center text-xs font-medium text-red-600">
                          Non-halal stock — 100% of dividends should be donated to charity
                        </p>
                      ) : tatheerData.nonCompliantRatio != null ? (
                        <p className="text-center text-xs text-muted-foreground">
                          Non-compliant ratio: {(tatheerData.nonCompliantRatio * 100).toFixed(2)}% — Based on latest annual income statement
                        </p>
                      ) : null}

                      {/* Cost basis → gains calculator (haram stocks only) */}
                      {tatheerData.isNotHalal && (
                        <div className="mt-2 space-y-3">
                          <button
                            onClick={() => setShowCostBasis(!showCostBasis)}
                            className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/60"
                            style={{ color: "#2D5A3D" }}
                          >
                            <span className="flex items-center gap-2">
                              <Calculator className="h-4 w-4" />
                              Calculate total gains for donation
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${showCostBasis ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {showCostBasis && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 space-y-4">
                                  <p className="text-xs text-muted-foreground">
                                    If you know your cost basis (what you paid per share), enter it
                                    below to calculate your total unrealized gains. Consider donating
                                    this amount to charity when you sell.
                                  </p>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      Cost Basis per Share ($)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="e.g. 120.50"
                                      value={costBasisInput}
                                      onChange={(e) => setCostBasisInput(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  {costBasisInput && parseFloat(costBasisInput) > 0 && tatheerData.currentPrice ? (
                                    (() => {
                                      const costBasis = parseFloat(costBasisInput);
                                      const currentPrice = tatheerData.currentPrice;
                                      const numShares = tatheerData.shares ?? 0;
                                      const totalGain = (currentPrice - costBasis) * numShares;
                                      const totalDonation = (tatheerData.totalAnnualDividends ?? 0) + Math.max(totalGain, 0);
                                      return (
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="rounded-xl bg-white p-3">
                                              <p className="text-xs text-muted-foreground">Current Price</p>
                                              <p className="font-heading text-sm font-bold text-foreground">{fmt(currentPrice)}</p>
                                            </div>
                                            <div className="rounded-xl bg-white p-3">
                                              <p className="text-xs text-muted-foreground">Your Cost Basis</p>
                                              <p className="font-heading text-sm font-bold text-foreground">{fmt(costBasis)}</p>
                                            </div>
                                          </div>
                                          <div className={`rounded-xl p-4 text-center ${totalGain >= 0 ? "bg-red-50" : "bg-amber-50"}`}>
                                            <p className="text-xs text-muted-foreground">
                                              {totalGain >= 0 ? "Unrealized Gains" : "Unrealized Loss"} ({numShares} shares)
                                            </p>
                                            <p className={`font-heading text-xl font-bold ${totalGain >= 0 ? "text-red-700" : "text-amber-700"}`}>
                                              {totalGain >= 0 ? fmt(totalGain) : `−${fmt(Math.abs(totalGain))}`}
                                            </p>
                                          </div>
                                          {totalGain > 0 && (
                                            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#C9A96220" }}>
                                              <p className="text-xs font-medium" style={{ color: "#C9A962" }}>
                                                Total Recommended Donation
                                              </p>
                                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                                Annual Dividends + Unrealized Gains
                                              </p>
                                              <p className="mt-1 font-heading text-xl font-bold" style={{ color: "#C9A962" }}>
                                                {fmt(totalDonation)}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()
                                  ) : costBasisInput && parseFloat(costBasisInput) > 0 && !tatheerData.currentPrice ? (
                                    <p className="text-xs text-amber-600">
                                      Current stock price unavailable. Try looking up the stock again.
                                    </p>
                                  ) : null}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
