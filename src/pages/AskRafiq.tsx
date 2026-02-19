import { useState, useRef, useEffect, useMemo } from "react";
import { Send, ChevronDown, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { httpsCallable, functions } from "@/lib/firebase";
import { saveAskRafiqEmail } from "@/lib/waitlist";
import { findStock, halalStocks, loadDJIMData, type DJIMStock } from "@/data/halal-stocks";
import rafiqLogo from "@/assets/rafiq-logo.png";
import { CrescentMoon } from "@/assets/islamic-patterns.tsx";

const getTatheerDataFn = httpsCallable(functions, "getTatheerData");

interface Msg {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const suggestedQuestions = [
  "Is AAPL halal?",
  "I own 100 shares of Apple, how much should I purify?",
  "How do I calculate zakat?",
  "What's the difference between zakat and sadaqah?",
];

const askRafiq = httpsCallable(functions, "askRafiqWeb");

const COMMON_WORDS = new Set([
  "I", "A", "IS", "IT", "OR", "AN", "AM", "IF", "IN", "AI", "MY", "DO", "SO",
  "NO", "BE", "BY", "TO", "UP", "OF", "AT", "ON", "AS", "WE", "US", "OK", "GO",
  "HE", "ME", "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN",
  "HAS", "HER", "WAS", "ONE", "OUR", "HOW", "ETF", "IPO", "DJIM",
]);

function buildStockContext(text: string): string {
  const tickers = text.match(/\b[A-Z]{1,5}\b/g);
  if (!tickers) return "";

  const seen = new Set<string>();
  const contexts: string[] = [];

  for (const ticker of tickers) {
    if (seen.has(ticker) || COMMON_WORDS.has(ticker)) continue;
    seen.add(ticker);

    const stock = findStock(ticker);
    if (stock) {
      if (stock.status === "HALAL") {
        contexts.push(`[SCREENING DATA: ${stock.symbol} is CONFIRMED Shariah-compliant. It is included in the Dow Jones Islamic Market (DJIM) Shariah Index as of 2026-02-06, sector: ${stock.sector}. It has passed all AAOIFI screening criteria including debt ratio <33%, interest income <5%, and cash & securities ratio <33%. This is verified data from our curated index of 2,127 screened stocks. Please state this compliance status definitively — do not hedge or suggest checking other services. If relevant, mention that dividend purification may still apply.]`);
      } else if (stock.status === "NOT HALAL") {
        contexts.push(`[SCREENING DATA: ${stock.symbol} is NOT Shariah-compliant. It is classified as haram due to: ${stock.sector}. This is a definitive classification — do not hedge. State clearly that this stock should be avoided by Muslim investors.]`);
      } else {
        contexts.push(`[SCREENING DATA: ${stock.symbol} (${stock.name}) has a QUESTIONABLE status in DJIM screening, sector: ${stock.sector}. Some financial ratios are near AAOIFI thresholds. Advise caution and suggest consulting a scholar.]`);
      }
    } else {
      contexts.push(`[SCREENING DATA: ${ticker} was not found in the curated DJIM index dataset of 2,127 screened stocks. It may still be halal or haram — advise the user to check further with a dedicated screening service.]`);
    }
  }

  return contexts.join("\n");
}

// --- Tatheer (dividend purification) enrichment ---

const TATHEER_KEYWORDS = [
  "purif", "tatheer", "dividend", "donate", "donation",
  "cleanse", "cleansing", "non-compliant", "noncompliant",
  "haram income", "haram earning",
  "how much should i give", "how much do i need to give",
  "how much to donate", "how much to purify",
  "clean my",
];

function detectTatheerIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return TATHEER_KEYWORDS.some(kw => lower.includes(kw));
}

interface StockMention {
  symbol: string;
  shares: number;
}

function resolveCompanyName(
  query: string,
  djimStocks: DJIMStock[],
): string | null {
  const q = query.toLowerCase();

  // Layer 1: halalStocks (40 curated with names)
  const localMatch = halalStocks.find(s => s.name.toLowerCase().includes(q));
  if (localMatch) return localMatch.symbol;

  // Layer 2: djimStocks (62 curated)
  const djimMatch = djimStocks.find(s => s.name.toLowerCase().includes(q));
  if (djimMatch) return djimMatch.symbol;

  return null;
}

function extractStockMentions(
  text: string,
  djimStocks: DJIMStock[],
): StockMention[] {
  const mentions: StockMention[] = [];
  const seen = new Set<string>();

  // Unified pattern: "100 shares of <word(s)>" — matches both tickers and company names
  const sharesPattern = /(\d+)\s+shares?\s+(?:of\s+)?([A-Za-z][A-Za-z\s&.'-]*[A-Za-z.])/gi;
  let m;
  while ((m = sharesPattern.exec(text)) !== null) {
    const sharesNum = parseInt(m[1], 10);
    const raw = m[2].trim();

    // Is it an exact uppercase ticker? (e.g. "AAPL", "MSFT" — NOT "Apple")
    if (/^[A-Z]{1,5}$/.test(raw) && !COMMON_WORDS.has(raw)) {
      if (!seen.has(raw)) {
        seen.add(raw);
        mentions.push({ symbol: raw, shares: sharesNum });
      }
      continue;
    }

    // Try resolving as company name (e.g. "Apple" → AAPL)
    const resolved = resolveCompanyName(raw, djimStocks);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      mentions.push({ symbol: resolved, shares: sharesNum });
      continue;
    }

    // Fallback: send raw text to CF for FMP name resolution
    const cleaned = raw.toUpperCase();
    if (!seen.has(cleaned) && !COMMON_WORDS.has(cleaned)) {
      seen.add(cleaned);
      mentions.push({ symbol: cleaned, shares: sharesNum });
    }
  }

  // Standalone tickers if no share-count patterns matched (e.g. "purify AAPL dividends")
  if (mentions.length === 0) {
    const tickers = text.match(/\b[A-Z]{1,5}\b/g);
    if (tickers) {
      for (const t of tickers) {
        if (!COMMON_WORDS.has(t) && !seen.has(t)) {
          seen.add(t);
          mentions.push({ symbol: t, shares: 1 });
        }
      }
    }
  }

  return mentions;
}

function buildTatheerContext(results: any[]): string {
  if (results.length === 0) return "";

  const contexts = results.map(data => {
    const ticker = data.resolvedTicker || data.symbol || "Unknown";
    const name = data.companyName || ticker;

    if (data.isNotHalal) {
      return `[TATHEER DATA for ${ticker} (${name}): This stock is classified as NOT HALAL / HARAM. ALL dividends received ($${(Number(data.totalAnnualDividends) || 0).toFixed(2)}/year for ${data.shares} shares) should be donated in full. Current price: $${(Number(data.currentPrice) || 0).toFixed(2)}. Advise the user clearly to divest and donate all earnings.]`;
    }

    if (!data.hasDividend) {
      return `[TATHEER DATA for ${ticker} (${name}): This stock does NOT pay dividends. No dividend purification is needed.]`;
    }

    const ratio = (Number(data.nonCompliantRatio) || 0) * 100;
    return `[TATHEER DATA for ${ticker} (${name}): ` +
      `Shares: ${data.shares}. ` +
      `Annual dividend/share: $${(Number(data.annualDividend) || 0).toFixed(4)}. ` +
      `Total annual dividends: $${(Number(data.totalAnnualDividends) || 0).toFixed(2)}. ` +
      `Non-compliant income ratio: ${ratio.toFixed(2)}%. ` +
      `ANNUAL purification amount: $${(Number(data.annualPurification) || 0).toFixed(2)} ` +
      `(= $${(Number(data.totalAnnualDividends) || 0).toFixed(2)} x ${ratio.toFixed(2)}%). ` +
      `QUARTERLY purification: $${(Number(data.quarterlyPurification) || 0).toFixed(2)}. ` +
      `This is REAL calculated data from live financial sources. ` +
      `Present these numbers confidently. ` +
      `The purification amount is the non-compliant portion of dividends that should be donated to charity.]`;
  });

  return contexts.join("\n");
}

// Relative timestamp formatter
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Floating geometric particles
function FloatingParticles() {
  const particles = useMemo(() =>
    [...Array(12)].map((_, i) => ({
      id: i,
      size: 4 + Math.random() * 8,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
    })), []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold)) 100%)`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Floating gradient orbs for empty state
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          left: "10%",
          top: "20%",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute h-48 w-48 rounded-full opacity-15 blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)",
          right: "15%",
          bottom: "30%",
          animation: "float 10s ease-in-out 2s infinite",
        }}
      />
    </div>
  );
}

// Enhanced typing indicator with AI avatar
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
        <img src={rafiqLogo} alt="" className="h-5 w-5" />
      </div>
      <div className="rounded-2xl border border-border/30 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5 px-4 py-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Message bubble with avatar
function MessageBubble({ msg, isLast }: { msg: Msg; isLast: boolean }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User size={16} />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <img src={rafiqLogo} alt="" className="h-5 w-5" />
        </div>
      )}

      {/* Message content */}
      <div className="flex flex-col gap-1" style={{ maxWidth: "75%" }}>
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${isUser
              ? "message-user text-white shadow-lg"
              : "message-ai border border-border/30 text-foreground shadow-sm"
            }`}
        >
          {!isUser ? (
            <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            msg.content
          )}
        </div>

        {/* Timestamp */}
        <span className={`text-[10px] text-muted-foreground/60 ${isUser ? "text-right mr-1" : "ml-1"}`}>
          {formatTimestamp(msg.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

export default function AskRafiq() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [djimStocks, setDjimStocks] = useState<DJIMStock[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Email gate state — localStorage is the primary enforcement
  const [email, setEmail] = useState(localStorage.getItem("rafiq_ask_email") || "");
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [hasUsedQuestion, setHasUsedQuestion] = useState(!!localStorage.getItem("rafiq_ask_used"));
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Load DJIM data for Tatheer enrichment
  useEffect(() => {
    loadDJIMData().then(setDjimStocks);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Track scroll position for "new message" indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle email gate submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setEmailError("");
    setEmailLoading(true);

    try {
      // Save email + question to Firestore (write-only, for your records)
      await saveAskRafiqEmail(trimmed, pendingQuestion);
      localStorage.setItem("rafiq_ask_email", trimmed);
      setShowEmailGate(false);

      // Now actually send the question
      const questionToSend = pendingQuestion;
      setPendingQuestion("");
      await sendToAI(questionToSend);
      setHasUsedQuestion(true);
      localStorage.setItem("rafiq_ask_used", "true");
    } catch (err) {
      console.error("Email gate error:", err);
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Gated send: checks email before allowing AI call
  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // If limit already reached, show message
    if (hasUsedQuestion) {
      toast({
        title: "Free question used",
        description: "Download the Rafiq iOS app (coming soon!) for unlimited access.",
      });
      return;
    }

    // If no email yet, show the gate modal
    setPendingQuestion(text.trim());
    setShowEmailGate(true);
    setInput("");
  };

  // Actual AI call logic (no gating — called after email is verified)
  const sendToAI = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", content: text.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = updatedMessages.map(({ role, content }) => ({ role, content }));
      const rawText = text.trim();
      const extractedTickers = rawText.match(/\b[A-Z]{1,5}\b/g);
      const stockContext = buildStockContext(rawText);

      // Tatheer enrichment: detect purification questions and fetch live data
      let tatheerContext = "";
      if (detectTatheerIntent(rawText)) {
        const mentions = extractStockMentions(rawText, djimStocks);
        if (mentions.length > 0) {
          console.log("[AskRafiq] Tatheer intent detected, fetching data for:", mentions);
          const results = await Promise.allSettled(
            mentions.map(m => getTatheerDataFn({ symbol: m.symbol, shares: m.shares }))
          );
          const tatheerResults = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
            .map(r => {
              const raw = r.value.data as any;
              return raw?.data ?? raw?.result ?? raw;
            });
          tatheerContext = buildTatheerContext(tatheerResults);
          console.log("[AskRafiq] Tatheer context:", tatheerContext);
        }
      }

      const enrichedMessage = [stockContext, tatheerContext, rawText]
        .filter(Boolean)
        .join("\n\n");
      console.log("[AskRafiq debug]", {
        input: rawText,
        extractedTickers,
        djimDataLoaded: halalStocks.length > 0,
        djimStockCount: halalStocks.length,
        stockContext: stockContext || "(none)",
        tatheerContext: tatheerContext || "(none)",
        enrichedMessage,
      });
      const result = await askRafiq({ message: enrichedMessage, conversationHistory });
      const response = (result.data as { response: string }).response;
      setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
    } catch (e) {
      console.error("Chat error:", e);
      toast({ title: "Error", description: "Could not reach Rafiq. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 pattern-islamic opacity-15" />
      <FloatingParticles />

      {/* Messages area */}
      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto px-4 py-8">
        <div className="container mx-auto max-w-2xl space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-8 py-16 text-center">
              {/* Floating gradient orbs */}
              <FloatingOrbs />

              {/* Animated logo with glow */}
              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Pulsing glow ring */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse-glow-strong scale-150" />

                {/* Orbiting crescent moon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-orbit">
                    <CrescentMoon size={16} className="text-gold" />
                  </div>
                </div>

                {/* Main logo */}
                <div className="relative rounded-3xl bg-white/80 p-5 shadow-premium backdrop-blur-sm">
                  <img
                    src={rafiqLogo}
                    alt="Rafiq"
                    className="h-24 w-auto drop-shadow-lg sm:h-28"
                  />
                </div>
              </motion.div>

              {/* Title with sparkle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold animate-wiggle" />
                  <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                    Ask Rafiq
                  </h2>
                  <Sparkles className="h-5 w-5 text-gold animate-wiggle" style={{ animationDelay: "1s" }} />
                </div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Your AI-powered Islamic personal finance assistant. Get guidance on halal stock screening, zakat & tatheer calculations, and Shariah-compliant financial decisions.
                </p>
              </motion.div>

              {/* Feature highlights with stagger animation */}
              <motion.div
                className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
              >
                {[
                  { label: "Stock Screening", color: "bg-halal" },
                  { label: "Zakat Guidance", color: "bg-gold" },
                  { label: "Islamic Finance", color: "bg-sage" },
                ].map((item) => (
                  <motion.span
                    key={item.label}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-card/80 px-4 py-2 shadow-sm backdrop-blur-sm"
                  >
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    {item.label}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={`${i}-${msg.timestamp}`}
                msg={msg}
                isLast={i === messages.length - 1}
              />
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <TypingIndicator />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105"
          >
            <ChevronDown className="mr-1 inline h-4 w-4" />
            New messages
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom input area */}
      <div className="relative border-t border-border/40 bg-card/95 px-4 pb-4 pt-4 backdrop-blur-xl">
        <div className="container mx-auto max-w-2xl">
          {/* Limit reached banner */}
          {hasUsedQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 text-center"
            >
              <p className="text-sm font-medium text-foreground">
                You've used your free question ✨
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                📱 The Rafiq iOS app is coming soon with unlimited access. We'll notify you at{" "}
                <span className="font-medium text-foreground">{email}</span>!
              </p>
            </motion.div>
          )}

          {/* Suggested questions with stagger animation */}
          {messages.length === 0 && !hasUsedQuestion && (
            <motion.div
              className="mb-4 flex flex-wrap justify-center gap-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } }
              }}
            >
              {suggestedQuestions.map((q) => (
                <motion.button
                  key={q}
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  onClick={() => send(q)}
                  className="group rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 font-ui text-xs font-medium text-primary shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:shadow-glow-primary btn-bounce"
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          )}

          {!hasUsedQuestion && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              {/* Gradient border input wrapper */}
              <div className="flex-1 gradient-border rounded-2xl">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Islamic finance..."
                  disabled={isLoading}
                  className="relative z-10 w-full rounded-2xl border-0 bg-card px-5 py-3.5 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 shrink-0 rounded-2xl shadow-lg shadow-primary/30 transition-all btn-bounce hover:shadow-xl hover:shadow-primary/40"
              >
                <Send size={18} />
              </Button>
            </form>
          )}

          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Rafiq provides educational guidance, not fatwas. Consult a qualified scholar for complex rulings.
          </p>
        </div>
      </div>

      {/* Email gate modal */}
      <AnimatePresence>
        {showEmailGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-md rounded-3xl border border-border/50 bg-card p-8 shadow-2xl"
            >
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl bg-white/80 p-3 shadow-lg">
                  <img src={rafiqLogo} alt="Rafiq" className="h-14 w-auto" />
                </div>
              </div>

              {/* Copy */}
              <h3 className="text-center font-heading text-xl font-bold text-foreground">
                Enter your email to ask Rafiq
              </h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Get one free answer to your Islamic finance question.
              </p>
              <p className="mt-3 text-center text-xs font-medium text-gold">
                📱 iOS app coming soon — unlimited access!
              </p>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="mt-6 space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-background"
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
                <Button
                  type="submit"
                  disabled={emailLoading || !email.trim()}
                  className="w-full gap-2 font-ui font-semibold"
                >
                  {emailLoading ? "Checking..." : "Ask Rafiq"} <Send size={16} />
                </Button>
              </form>

              {/* Cancel */}
              <button
                onClick={() => { setShowEmailGate(false); setPendingQuestion(""); }}
                className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
