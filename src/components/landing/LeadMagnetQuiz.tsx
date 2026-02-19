import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Lock, Briefcase, BookOpen, Settings, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlist, db } from "@/lib/waitlist";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AnswerType = "yn" | "yns" | "scale5" | "multi";

interface Question {
  id: number;
  text: string;
  helper: string;
  category: "assets" | "knowledge" | "process";
  answerType: AnswerType;
  options: string[];
}

type Answers = Record<number, string>;

type Screen = "entry" | "interstitial" | "question" | "preview" | "email" | "results";

interface CategoryScore {
  score: number;
  max: number;
  label: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  assets: "Your Assets",
  knowledge: "Your Knowledge",
  process: "Your Process",
};

const INTERSTITIALS: Record<string, string> = {
  assets: "First, let\u2019s look at what you own.",
  knowledge: "Now, let\u2019s see what you know.",
  process: "Finally, let\u2019s look at how you calculate.",
};

const questions: Question[] = [
  // Category 1: Assets (1-5)
  { id: 1, text: "Do you own individual stocks or ETFs?", helper: "This includes brokerage accounts, Robinhood, Fidelity, Schwab, or any platform where you buy stocks or funds.", category: "assets", answerType: "yn", options: ["Yes", "No"] },
  { id: 2, text: "Do you have RSUs, stock options, or equity compensation from your employer?", helper: "Restricted Stock Units (RSUs) and stock options are common in tech and finance. If your employer grants you shares that vest over time, select Yes.", category: "assets", answerType: "yn", options: ["Yes", "No"] },
  { id: 3, text: "Do you hold any cryptocurrency?", helper: "Bitcoin, Ethereum, stablecoins, or any other digital currency \u2014 on an exchange or in a wallet.", category: "assets", answerType: "yn", options: ["Yes", "No"] },
  { id: 4, text: "Do you own rental or investment property (not your primary residence)?", helper: "This means property you earn rental income from or hold as an investment. Your home does not count.", category: "assets", answerType: "yn", options: ["Yes", "No"] },
  { id: 5, text: "Do you have a 401(k), IRA, or other retirement account?", helper: "Includes 401(k), Traditional IRA, Roth IRA, 403(b), SEP IRA, or any employer-sponsored retirement plan.", category: "assets", answerType: "yn", options: ["Yes", "No"] },
  // Category 2: Knowledge (6-10)
  { id: 6, text: "Do you know which madhab (school of thought) you follow for zakat?", helper: "The five major schools \u2014 Hanafi, Maliki, Shafi\u2019i, Hanbali, and Ja\u2019fari \u2014 have different rules for how zakat is calculated on certain assets.", category: "knowledge", answerType: "yns", options: ["Yes", "No", "Not sure"] },
  { id: 7, text: "Do you know whether your retirement accounts are subject to zakat?", helper: "This is one of the most debated questions in Islamic finance. The answer depends on your madhab, the type of account, and whether you can access the funds.", category: "knowledge", answerType: "yns", options: ["Yes", "No", "Not sure"] },
  { id: 8, text: "Do you know the current nisab threshold?", helper: "The nisab is the minimum amount of wealth you must hold before zakat becomes obligatory. It changes based on the current price of gold or silver.", category: "knowledge", answerType: "yns", options: ["Yes", "No", "Not sure"] },
  { id: 9, text: "Have you heard of khums, and do you know if it applies to you?", helper: "Khums is a 20% obligation on annual surplus wealth observed by Muslims who follow the Ja\u2019fari (Shia) school. It is separate from zakat.", category: "knowledge", answerType: "yns", options: ["Yes", "No", "Not sure"] },
  { id: 10, text: "Do you know how to purify income from dividends or interest?", helper: "Many stocks pay dividends, and some may include impermissible income. Purification is the process of calculating and donating the impermissible portion.", category: "knowledge", answerType: "yns", options: ["Yes", "No", "Not sure"] },
  // Category 3: Process (11-15)
  { id: 11, text: "How long does it typically take you to calculate your zakat each year?", helper: "Your best estimate. Include the time you spend gathering account balances, looking up rules, and doing the math.", category: "process", answerType: "multi", options: ["Under 30 minutes", "30 minutes to 2 hours", "More than 2 hours", "I don\u2019t calculate it"] },
  { id: 12, text: "How confident are you that your zakat calculation is accurate?", helper: "Be honest. There\u2019s no wrong answer here.", category: "process", answerType: "scale5", options: ["1 \u2014 Not at all", "2 \u2014 Slightly", "3 \u2014 Somewhat", "4 \u2014 Fairly", "5 \u2014 Very confident"] },
  { id: 13, text: "Do you keep records of your assets and zakat payments year over year?", helper: "This means having a record of what you owned, what you calculated, and what you paid \u2014 not just a memory of it.", category: "process", answerType: "multi", options: ["Yes", "Partially", "No"] },
  { id: 14, text: "Have you ever consulted a scholar or used a zakat calculator for your calculation?", helper: "Scholars include imams, muftis, or Islamic finance advisors. Calculators include any online zakat calculator or app.", category: "process", answerType: "multi", options: ["Yes, a scholar", "Yes, a calculator", "Both", "Neither"] },
  { id: 15, text: "Which best describes how you currently calculate zakat?", helper: "No judgment. Most people don\u2019t have a formal system.", category: "process", answerType: "multi", options: ["I use a calculator app", "I use a spreadsheet", "I do mental math", "I estimate or guess", "I don\u2019t calculate it"] },
];

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

function computeScores(answers: Answers) {
  // Asset Complexity: count Yes in Q1-5
  let assetComplexity = 0;
  for (let i = 1; i <= 5; i++) {
    if (answers[i] === "Yes") assetComplexity++;
  }

  // Knowledge Gap: count No/Not sure in Q6-10
  let knowledgeGap = 0;
  for (let i = 6; i <= 10; i++) {
    if (answers[i] !== "Yes") knowledgeGap++;
  }

  // Process Maturity: composite from Q11-15
  let processRaw = 0;
  // Q11
  const q11 = answers[11];
  if (q11 === "Under 30 minutes") processRaw += 2;
  else if (q11 === "30 minutes to 2 hours") processRaw += 1;
  // Q12
  const q12 = answers[12];
  if (q12?.startsWith("5")) processRaw += 2;
  else if (q12?.startsWith("4")) processRaw += 1.5;
  else if (q12?.startsWith("3")) processRaw += 1;
  else if (q12?.startsWith("2")) processRaw += 0.5;
  // Q13
  const q13 = answers[13];
  if (q13 === "Yes") processRaw += 2;
  else if (q13 === "Partially") processRaw += 1;
  // Q14
  const q14 = answers[14];
  if (q14 === "Both") processRaw += 2;
  else if (q14 === "Yes, a scholar") processRaw += 1.5;
  else if (q14 === "Yes, a calculator") processRaw += 1;
  // Q15
  const q15 = answers[15];
  if (q15 === "I use a calculator app") processRaw += 2;
  else if (q15 === "I use a spreadsheet") processRaw += 1.5;
  else if (q15 === "I do mental math") processRaw += 1;
  else if (q15 === "I estimate or guess") processRaw += 0.5;

  const processMaturity = Math.round((processRaw / 2) * 2) / 2; // round to nearest 0.5, max 5

  const readiness = Math.max(0, Math.round(100 - (assetComplexity * 8 + knowledgeGap * 7 + (5 - processMaturity) * 5)));

  let grade: string;
  let gradeLabel: string;
  if (readiness >= 90) { grade = "A"; gradeLabel = "Zakat Ready"; }
  else if (readiness >= 75) { grade = "B"; gradeLabel = "Mostly Prepared"; }
  else if (readiness >= 60) { grade = "C"; gradeLabel = "Some Gaps"; }
  else if (readiness >= 45) { grade = "D"; gradeLabel = "Significant Gaps"; }
  else { grade = "F"; gradeLabel = "Needs Attention"; }

  return { assetComplexity, knowledgeGap, processMaturity, readiness, grade, gradeLabel };
}

function getGradeSummary(grade: string) {
  switch (grade) {
    case "A": return "You\u2019re well-prepared for zakat season. But there may still be details worth checking.";
    case "B": return "You\u2019re in good shape, but there are a few areas where you could be more precise.";
    case "C": return "You have some gaps in your zakat preparation. Your full report shows exactly where.";
    case "D": return "There are significant gaps between your situation and your preparation. Your report breaks it down.";
    default: return "Your zakat situation needs attention. The good news: your report tells you exactly what to focus on.";
  }
}

function getGradeColor(grade: string) {
  switch (grade) {
    case "A": return "text-emerald-500";
    case "B": return "text-green-500";
    case "C": return "text-amber-500";
    case "D": return "text-orange-500";
    default: return "text-red-500";
  }
}

function getCategoryDetails(scores: ReturnType<typeof computeScores>): CategoryScore[] {
  const { assetComplexity, knowledgeGap, processMaturity } = scores;

  const assetLabel = assetComplexity <= 1 ? "Simple portfolio" : assetComplexity <= 3 ? "Moderate complexity" : "High complexity";
  const assetDesc = assetComplexity <= 1
    ? "You have a relatively simple financial picture. Standard zakat calculators may work, but they often miss nuances around nisab thresholds and madhab differences."
    : assetComplexity <= 3
    ? "You have a mix of asset types that introduces real complexity. Different madhabs treat these assets differently \u2014 the gap between calculations can be significant."
    : "Your portfolio spans multiple complex asset classes. RSUs, crypto, retirement accounts, and investment property each have their own rules that change by madhab. Most calculators can\u2019t handle this.";

  const knowledgeLabel = knowledgeGap <= 1 ? "Strong foundation" : knowledgeGap <= 3 ? "Some blind spots" : "Major gaps";
  const knowledgeDesc = knowledgeGap <= 1
    ? "You have a solid understanding of the zakat rules relevant to your situation."
    : knowledgeGap <= 3
    ? "You have some blind spots that could affect the accuracy of your calculations."
    : "There are major knowledge gaps that could lead to miscalculating your obligation.";

  const processLabel = processMaturity >= 3.5 ? "Established process" : processMaturity >= 2 ? "Basic process" : "No formal process";
  const processDesc = processMaturity >= 3.5
    ? "You have a working system. The question is whether it accounts for the complexity of your assets and applies the correct madhab-specific rules."
    : processMaturity >= 2
    ? "You have the beginnings of a process, but it\u2019s not consistent or thorough. Adding record-keeping and scholarly backing would increase your confidence."
    : "You don\u2019t have a reliable system for calculating zakat. A structured tool would make a significant difference.";

  return [
    { score: assetComplexity, max: 5, label: assetLabel, description: assetDesc },
    { score: knowledgeGap, max: 5, label: knowledgeLabel, description: knowledgeDesc },
    { score: Math.round(processMaturity * 10) / 10, max: 5, label: processLabel, description: processDesc },
  ];
}

function getRecommendations(answers: Answers, scores: ReturnType<typeof computeScores>) {
  const recs: { title: string; body: string }[] = [];
  const { assetComplexity, knowledgeGap } = scores;

  if (assetComplexity >= 3 && knowledgeGap >= 3) recs.push({ title: "Your portfolio is more complex than your preparation.", body: "You hold asset types \u2014 like RSUs, crypto, or retirement accounts \u2014 that most zakat calculators can\u2019t handle. The rules differ across madhabs, and the gap between calculations can be hundreds or thousands of dollars. Rafiq calculates zakat across all 5 schools of thought with scholarly citations for every number." });
  if (answers[12]?.startsWith("1") || answers[12]?.startsWith("2")) {
    if (answers[13] === "No") recs.push({ title: "You\u2019re not confident, and you don\u2019t have a paper trail.", body: "Without records, you can\u2019t verify past calculations or track whether your obligation has been met year over year. Rafiq shows its work and builds an audit trail so you can look back." });
  }
  if (answers[9] !== "Yes") recs.push({ title: "There\u2019s an obligation you may not know about.", body: "Khums is a 20% obligation on annual surplus wealth observed by Muslims who follow the Ja\u2019fari school. Even if you don\u2019t follow this school, understanding khums helps you see the full picture. Rafiq is the first platform that calculates both zakat and khums side by side." });
  if (answers[5] === "Yes" && answers[7] !== "Yes") recs.push({ title: "Your retirement accounts might be zakatable \u2014 and you\u2019re not sure.", body: "Whether a 401(k) or IRA is subject to zakat depends on your madhab, the account type, and whether the funds are accessible. Rafiq handles all of this automatically based on your chosen school." });
  if (answers[11] === "More than 2 hours") recs.push({ title: "Two hours is too long.", body: "If you\u2019re spending hours gathering balances, looking up rules, and doing math by hand, you\u2019re solving a problem that should be automated. Rafiq gives you a complete calculation in minutes \u2014 with full scholarly backing." });
  if (answers[15] === "I do mental math" || answers[15] === "I estimate or guess") recs.push({ title: "Guessing isn\u2019t a calculation.", body: "Estimating your zakat means you might be underpaying your obligation \u2014 or overpaying. Rafiq gives you a precise, source-backed number based on your actual assets and your chosen madhab." });
  if (answers[3] === "Yes" && knowledgeGap >= 2) recs.push({ title: "Crypto zakat is a gray area \u2014 and you\u2019re in it.", body: "Is cryptocurrency treated as currency, trade goods, or something else? The answer changes your obligation significantly and scholars disagree. Rafiq applies the ruling from your chosen madhab and shows you the scholarly basis." });
  if (answers[14] === "Neither") recs.push({ title: "You\u2019ve been doing this entirely on your own.", body: "No scholar, no calculator, no external check. Rafiq was built with input from scholars across all 5 madhabs. It gives you the confidence of a scholarly consultation without the appointment." });

  if (recs.length < 2) recs.push({ title: "Rafiq handles the hard parts.", body: "Rafiq is an AI-powered platform that calculates zakat and khums across all 5 madhabs with scholarly citations. It connects to your accounts, applies the correct rules, and shows its work. No spreadsheets. No guessing." });

  return recs.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface LeadMagnetQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadMagnetQuiz({ isOpen, onClose }: LeadMagnetQuizProps) {
  const [screen, setScreen] = useState<Screen>("entry");
  const [currentQ, setCurrentQ] = useState(0); // 0-indexed into questions array
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const { toast } = useToast();

  // Track if we need an interstitial before the current question
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialCategory, setInterstitialCategory] = useState<string>("assets");

  const currentQuestion = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  const scores = useMemo(() => {
    if (Object.keys(answers).length < 15) return null;
    return computeScores(answers);
  }, [answers]);

  const categoryDetails = useMemo(() => scores ? getCategoryDetails(scores) : null, [scores]);
  const recommendations = useMemo(() => scores ? getRecommendations(answers, scores) : [], [answers, scores]);

  const handleAnswer = useCallback((answer: string) => {
    const q = questions[currentQ];
    setAnswers(prev => ({ ...prev, [q.id]: answer }));

    // Move to next question or finish
    if (currentQ < questions.length - 1) {
      const nextQ = questions[currentQ + 1];
      if (nextQ.category !== q.category) {
        // Show interstitial before next category
        setInterstitialCategory(nextQ.category);
        setShowInterstitial(true);
        setScreen("interstitial");
        setTimeout(() => {
          setCurrentQ(currentQ + 1);
          setShowInterstitial(false);
          setScreen("question");
        }, 1800);
      } else {
        setCurrentQ(currentQ + 1);
      }
    } else {
      // All done
      setScreen("preview");
    }
  }, [currentQ]);

  const handleBack = useCallback(() => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  }, [currentQ]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    try {
      const computedScores = computeScores(answers);
      await addDoc(collection(db, "quiz_leads"), {
        email: email.toLowerCase().trim(),
        answers,
        assetComplexity: computedScores.assetComplexity,
        knowledgeGap: computedScores.knowledgeGap,
        processMaturity: computedScores.processMaturity,
        readinessScore: computedScores.readiness,
        grade: computedScores.grade,
        createdAt: serverTimestamp(),
      });
      // Also add to main waitlist
      await addToWaitlist(email, "quiz");
      setScreen("results");
    } catch {
      toast({ title: "Something went wrong.", description: "Please try again.", variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  const resetQuiz = useCallback(() => {
    setScreen("entry");
    setCurrentQ(0);
    setAnswers({});
    setEmail("");
  }, []);

  if (!isOpen) return null;

  const computedScores = Object.keys(answers).length === 15 ? computeScores(answers) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl"
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X size={18} />
        </button>

        <AnimatePresence mode="wait">
          {/* -------- ENTRY SCREEN -------- */}
          {screen === "entry" && (
            <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 py-10 text-center sm:px-10 sm:py-14">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground">How ready are you for zakat season?</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Answer 15 quick questions. Get your Zakat Readiness Score instantly. Find out where you stand before Ramadan &mdash; and what to fix.</p>
              <Button onClick={() => { setScreen("interstitial"); setInterstitialCategory("assets"); setShowInterstitial(true); setTimeout(() => { setShowInterstitial(false); setScreen("question"); }, 1800); }} className="mt-8 gap-2 px-8 font-ui font-semibold">
                Start the Quiz <ArrowRight size={16} />
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">Takes about 2 minutes. No account needed.</p>
            </motion.div>
          )}

          {/* -------- INTERSTITIAL -------- */}
          {screen === "interstitial" && (
            <motion.div key="interstitial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[300px] items-center justify-center px-6 py-14 text-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-primary">{CATEGORY_LABELS[interstitialCategory]}</p>
                <p className="mt-3 font-heading text-xl font-semibold text-foreground">{INTERSTITIALS[interstitialCategory]}</p>
              </div>
            </motion.div>
          )}

          {/* -------- QUESTION SCREEN -------- */}
          {screen === "question" && currentQuestion && (
            <motion.div key={`q-${currentQuestion.id}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="px-6 pb-8 pt-10 sm:px-10">
              {/* Progress bar */}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Question {currentQuestion.id} of 15 &mdash; {CATEGORY_LABELS[currentQuestion.category]}</span>
              </div>
              <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              {/* Question */}
              <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">{currentQuestion.text}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{currentQuestion.helper}</p>

              {/* Options */}
              <div className="mt-6 flex flex-col gap-2.5">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition
                      ${answers[currentQuestion.id] === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Back button */}
              {currentQ > 0 && (
                <button onClick={handleBack} className="mt-4 flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground">
                  <ArrowLeft size={12} /> Back
                </button>
              )}
            </motion.div>
          )}

          {/* -------- SCORE PREVIEW -------- */}
          {screen === "preview" && computedScores && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 py-10 text-center sm:px-10">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Zakat Readiness Score</p>
              <p className={`mt-3 font-heading text-6xl font-bold ${getGradeColor(computedScores.grade)}`}>{computedScores.readiness}</p>
              <p className="mt-1 text-sm font-medium text-foreground">Grade: {computedScores.grade} &mdash; {computedScores.gradeLabel}</p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{getGradeSummary(computedScores.grade)}</p>

              {/* Blurred category cards */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { icon: Briefcase, name: "Asset Complexity", teaser: "See your breakdown" },
                  { icon: BookOpen, name: "Knowledge Gaps", teaser: "See what you\u2019re missing" },
                  { icon: Settings, name: "Process Maturity", teaser: "See your rating" },
                ].map(({ icon: Icon, name, teaser }) => (
                  <div key={name} className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/40 px-3 py-4">
                    <Icon size={18} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-[11px] font-medium text-foreground">{name}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground/20 blur-[6px]">3.5/5</p>
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-muted/80 to-transparent pb-2">
                      <Lock size={10} className="mr-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{teaser}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => setScreen("email")} className="mt-8 gap-2 px-8 font-ui font-semibold">
                Get Your Full Report <ArrowRight size={16} />
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Free. Just takes an email.</p>
            </motion.div>
          )}

          {/* -------- EMAIL GATE -------- */}
          {screen === "email" && computedScores && (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">Unlock Your Full Report</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your score is <span className="font-semibold text-foreground">{computedScores.readiness}</span> ({computedScores.grade}). Enter your email to see your full category breakdowns and personalized recommendations.
              </p>
              <form onSubmit={handleEmailSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="flex-1 bg-background" />
                <Button type="submit" disabled={emailLoading} className="gap-2 font-ui font-semibold">
                  {emailLoading ? "Sending..." : "Send My Report"} <ArrowRight size={16} />
                </Button>
              </form>
              <p className="mt-3 text-[11px] text-muted-foreground">We&apos;ll also notify you when Rafiq launches. No spam. Unsubscribe anytime.</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">Your data is private. We never share your email.</p>
            </motion.div>
          )}

          {/* -------- FULL RESULTS -------- */}
          {screen === "results" && computedScores && categoryDetails && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-h-[80vh] overflow-y-auto px-6 py-8 sm:px-10">
              {/* Score header */}
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Zakat Readiness Score</p>
                <p className={`mt-2 font-heading text-5xl font-bold ${getGradeColor(computedScores.grade)}`}>{computedScores.readiness}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{computedScores.grade} &mdash; {computedScores.gradeLabel}</p>
              </div>

              {/* Category cards */}
              <div className="mt-8 space-y-4">
                {["Asset Complexity", "Knowledge Gaps", "Process Maturity"].map((name, i) => {
                  const cat = categoryDetails[i];
                  const icons = [Briefcase, BookOpen, Settings];
                  const Icon = icons[i];
                  return (
                    <div key={name} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{cat.label} &mdash; {cat.score}/{cat.max}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{cat.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recommendations */}
              <div className="mt-8">
                <h3 className="font-heading text-base font-bold text-foreground">What This Means for You</h3>
                <div className="mt-4 space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rec.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waitlist CTA */}
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                <h3 className="font-heading text-lg font-bold text-foreground">Rafiq launches Ramadan 2026.</h3>
                <p className="mt-2 text-sm text-muted-foreground">The first platform that calculates zakat and khums across all 5 madhabs &mdash; with scholarly citations for every number.</p>
                <Button onClick={onClose} className="mt-4 gap-2 font-ui font-semibold">
                  Join the Waitlist <ArrowRight size={16} />
                </Button>
                <p className="mt-2 text-[11px] text-muted-foreground">Free to join. We&apos;ll email you when it&apos;s ready.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
