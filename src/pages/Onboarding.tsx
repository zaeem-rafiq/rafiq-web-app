import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, CalendarDays, HelpCircle, Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useAuth, type Madhab, MADHAB_LABELS } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
} from "firebase/firestore";
import rafiqLogo from "@/assets/rafiq-logo.png";

interface MosqueResult {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

const MADHAB_INFO: { value: Madhab; label: string; desc: string }[] = [
  { value: "hanafi", label: "Hanafi", desc: "Followed by the majority in South Asia, Turkey, and Central Asia" },
  { value: "shafii", label: "Shafi'i", desc: "Predominant in Southeast Asia, East Africa, and parts of the Middle East" },
  { value: "maliki", label: "Maliki", desc: "Followed widely in North and West Africa" },
  { value: "hanbali", label: "Hanbali", desc: "Predominant in the Arabian Peninsula" },
  { value: "jafari", label: "Ja'fari", desc: "The primary Shia school of Islamic jurisprudence" },
];

const transition = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAuth();

  // Steps: 1=Madhab, 2=Mosque, 3=Nisab(Hanafi only), 4=Dates, 5=Summary
  const [step, setStep] = useState(1);
  const [madhab, setMadhab] = useState<Madhab>("");
  const [nisabStandard, setNisabStandard] = useState<"gold" | "silver">("silver");
  const [zakatDate, setZakatDate] = useState<Date | undefined>(undefined);
  const [khumsDate, setKhumsDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Mosque state
  const [mosqueQuery, setMosqueQuery] = useState("");
  const [mosqueResults, setMosqueResults] = useState<MosqueResult[]>([]);
  const [mosqueLoading, setMosqueLoading] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<MosqueResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const mosqueSearchRef = useRef<HTMLDivElement>(null);

  const firstName = userProfile?.displayName?.split(" ")[0] || "friend";

  // Search mosques in Firestore
  useEffect(() => {
    if (mosqueQuery.length < 2) {
      setMosqueResults([]);
      return;
    }

    const searchLower = mosqueQuery.toLowerCase();
    const timer = setTimeout(async () => {
      setMosqueLoading(true);
      try {
        const q = query(
          collection(db, "mosques"),
          orderBy("searchName"),
          startAt(searchLower),
          endAt(searchLower + "\uf8ff"),
          limit(20),
        );
        const snap = await getDocs(q);
        const results: MosqueResult[] = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          address: d.data().address || "",
          city: d.data().city || "",
          state: d.data().state || "",
        }));
        setMosqueResults(results);
        setShowResults(true);
      } catch {
        setMosqueResults([]);
      } finally {
        setMosqueLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mosqueQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mosqueSearchRef.current && !mosqueSearchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMadhabSelect = async (m: Madhab) => {
    setMadhab(m);
    if (m !== "hanafi") {
      setNisabStandard("gold");
    }
    await updateUserProfile({ madhab: m });
  };

  const goNext = () => {
    if (step === 2 && madhab !== "hanafi") {
      // Skip nisab step for non-Hanafi: mosque → dates
      setStep(4);
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step === 4 && madhab !== "hanafi") {
      // Skip nisab step for non-Hanafi: dates → mosque
      setStep(2);
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    await updateUserProfile({
      madhab,
      nisabStandard,
      homeMosqueId: selectedMosque?.id ?? null,
      homeMosqueName: selectedMosque?.name ?? null,
      zakatAnniversaryDate: zakatDate ? zakatDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      khumsAnniversaryDate: madhab === "jafari" && khumsDate ? khumsDate.toISOString().split("T")[0] : null,
      onboardingComplete: true,
    });
    setSaving(false);
    navigate("/dashboard", { replace: true });
  };

  // Compute visible step number and total (nisab step is hidden for non-Hanafi)
  const getStepNumber = () => {
    if (madhab === "hanafi") return step;
    // Non-Hanafi: steps 1,2 map to 1,2; step 4→3, step 5→4 (step 3 skipped)
    if (step <= 2) return step;
    return step - 1;
  };
  const stepNumber = getStepNumber();
  const displaySteps = madhab === "hanafi" ? 5 : 4;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: "#2D5A3D" }} />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: "#C9A962" }} />
      </div>

      {/* Floating crescents */}
      {["☪", "☪", "☪"].map((c, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute select-none text-2xl opacity-10"
          style={{
            top: `${15 + i * 25}%`,
            left: i % 2 === 0 ? `${5 + i * 10}%` : undefined,
            right: i % 2 !== 0 ? `${5 + i * 10}%` : undefined,
          }}
          animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        >
          {c}
        </motion.span>
      ))}

      <div className="container relative z-10 mx-auto max-w-xl">
        {/* Logo */}
        <div className="mb-6 text-center">
          <img src={rafiqLogo} alt="Rafiq" className="mx-auto h-10 w-auto" />
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: displaySteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s <= stepNumber ? "w-8" : "w-2"
              }`}
              style={{ backgroundColor: s <= stepNumber ? "#2D5A3D" : "#d1d5db" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Madhab Selection */}
          {step === 1 && (
            <motion.div key="step1" {...transition}>
              <div className="mb-8 text-center">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl" style={{ color: "#2D5A3D" }}>
                  Assalamu Alaikum, {firstName}!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Let's set up your companion. Which school of thought do you follow?
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {MADHAB_INFO.map((m) => {
                  const selected = madhab === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => handleMadhabSelect(m.value)}
                      className={`group relative rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md ${
                        selected
                          ? "border-[#2D5A3D] bg-[#2D5A3D]/5 shadow-md"
                          : "border-border/50 bg-white/70 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading text-base font-semibold" style={{ color: selected ? "#2D5A3D" : undefined }}>
                            {m.label}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: "#2D5A3D" }}
                          >
                            <Check size={14} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {madhab === "jafari" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex gap-3 rounded-2xl p-4"
                  style={{ borderColor: "#C9A96233", backgroundColor: "#C9A96210", borderWidth: 1 }}
                >
                  <span className="text-lg">✨</span>
                  <p className="text-sm text-foreground">
                    We're one of the only platforms that supports Ja'fari fiqh — including khums calculation.
                  </p>
                </motion.div>
              )}

              <div className="mt-8 text-center">
                <Button
                  onClick={goNext}
                  disabled={!madhab}
                  className="gap-2 rounded-full px-10 py-6 font-ui text-base font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  style={{ backgroundColor: "#2D5A3D" }}
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Home Mosque */}
          {step === 2 && (
            <motion.div key="step2" {...transition}>
              <div className="mb-8 text-center">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl" style={{ color: "#2D5A3D" }}>
                  Your Home Mosque
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Select the mosque or Islamic center you're affiliated with
                </p>
              </div>

              {selectedMosque ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-[#2D5A3D] border-2 bg-[#2D5A3D]/5 shadow-md rounded-2xl overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#2D5A3D" }}>
                            <MapPin size={18} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-heading text-base font-semibold" style={{ color: "#2D5A3D" }}>
                              {selectedMosque.name}
                            </h3>
                            {selectedMosque.address && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{selectedMosque.address}</p>
                            )}
                            {(selectedMosque.city || selectedMosque.state) && (
                              <p className="text-xs text-muted-foreground">
                                {[selectedMosque.city, selectedMosque.state].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMosque(null);
                            setMosqueQuery("");
                            setMosqueResults([]);
                          }}
                          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div ref={mosqueSearchRef} className="relative">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={mosqueQuery}
                      onChange={(e) => {
                        setMosqueQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => mosqueResults.length > 0 && setShowResults(true)}
                      placeholder="Search by mosque name..."
                      className="h-14 rounded-2xl border-border/50 bg-white/70 pl-11 pr-4 font-ui text-base shadow-sm transition-all focus:border-[#2D5A3D] focus:shadow-md"
                    />
                    {mosqueLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2D5A3D] border-t-transparent" />
                      </div>
                    )}
                  </div>

                  {showResults && mosqueQuery.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-20 mt-2 w-full rounded-2xl border border-border/50 bg-white shadow-xl overflow-hidden"
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {mosqueResults.length > 0 ? (
                          mosqueResults.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedMosque(m);
                                setShowResults(false);
                                setMosqueQuery("");
                              }}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#2D5A3D]/5"
                            >
                              <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{m.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[m.city, m.state].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            {mosqueLoading ? "Searching..." : "No mosques found"}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={goBack} className="gap-2 rounded-full px-8 py-6 font-ui font-semibold transition-all hover:scale-105">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={goNext}
                    disabled={!selectedMosque}
                    className="gap-2 rounded-full px-10 py-6 font-ui text-base font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    style={{ backgroundColor: "#2D5A3D" }}
                  >
                    Continue <ArrowRight size={16} />
                  </Button>
                </div>
                <button
                  onClick={() => {
                    setSelectedMosque(null);
                    goNext();
                  }}
                  className="font-ui text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  I'll add this later
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Nisab Standard (Hanafi only) */}
          {step === 3 && (
            <motion.div key="step3" {...transition}>
              <div className="mb-8 text-center">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl" style={{ color: "#2D5A3D" }}>
                  Nisab Standard
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Hanafi scholars differ on whether to use gold or silver as the nisab threshold.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { value: "gold" as const, label: "Gold Standard", amount: "85g of gold", note: "Higher threshold — fewer people are required to pay zakat" },
                  { value: "silver" as const, label: "Silver Standard", amount: "595g of silver", note: "Lower threshold — recommended by most Hanafi scholars" },
                ].map((opt) => {
                  const selected = nisabStandard === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setNisabStandard(opt.value)}
                      className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md ${
                        selected ? "border-[#2D5A3D] bg-[#2D5A3D]/5 shadow-md" : "border-border/50 bg-white/70"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading text-base font-semibold" style={{ color: selected ? "#2D5A3D" : undefined }}>
                            {opt.label}
                          </h3>
                          <p className="mt-0.5 text-sm font-medium" style={{ color: "#C9A962" }}>{opt.amount}</p>
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{opt.note}</p>
                        </div>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: "#2D5A3D" }}
                          >
                            <Check size={14} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <Button variant="outline" onClick={goBack} className="gap-2 rounded-full px-8 py-6 font-ui font-semibold transition-all hover:scale-105">
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button
                  onClick={async () => { await updateUserProfile({ nisabStandard }); goNext(); }}
                  className="gap-2 rounded-full px-10 py-6 font-ui text-base font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  style={{ backgroundColor: "#2D5A3D" }}
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Zakat Anniversary Date */}
          {step === 4 && (
            <motion.div key="step4" {...transition}>
              <div className="mb-8 text-center">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl" style={{ color: "#2D5A3D" }}>
                  Zakat Anniversary
                </h1>
                <p className="mt-2 text-muted-foreground">
                  When did you first reach nisab (the minimum wealth threshold)?
                </p>
              </div>

              <Card className="border-border/30 bg-white/70 shadow-xl backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full max-w-xs gap-2 rounded-xl py-6 font-ui">
                          <CalendarDays size={16} />
                          {zakatDate ? zakatDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                          mode="single"
                          selected={zakatDate}
                          onSelect={setZakatDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <button
                      onClick={() => setZakatDate(new Date())}
                      className="mt-3 flex items-center gap-1.5 font-ui text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <HelpCircle size={14} />
                      I'm not sure — use today's date
                    </button>
                  </div>

                  {madhab === "jafari" && (
                    <div className="border-t border-border/30 pt-5">
                      <h3 className="mb-3 text-center font-heading text-base font-semibold" style={{ color: "#C9A962" }}>
                        Khums Year Start Date
                      </h3>
                      <p className="mb-4 text-center text-xs text-muted-foreground">
                        The date you set as the start of your annual khums calculation (ra's al-sanah)
                      </p>
                      <div className="flex flex-col items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full max-w-xs gap-2 rounded-xl py-6 font-ui">
                              <CalendarDays size={16} />
                              {khumsDate ? khumsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Select a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                              mode="single"
                              selected={khumsDate}
                              onSelect={setKhumsDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <button
                          onClick={() => setKhumsDate(new Date())}
                          className="mt-3 flex items-center gap-1.5 font-ui text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <HelpCircle size={14} />
                          I'm not sure — use today's date
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-8 flex items-center justify-center gap-4">
                <Button variant="outline" onClick={goBack} className="gap-2 rounded-full px-8 py-6 font-ui font-semibold transition-all hover:scale-105">
                  <ArrowLeft size={16} /> Back
                </Button>
                <Button
                  onClick={() => { goNext(); }}
                  className="gap-2 rounded-full px-10 py-6 font-ui text-base font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  style={{ backgroundColor: "#2D5A3D" }}
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Done */}
          {step === 5 && (
            <motion.div key="step5" {...transition}>
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#2D5A3D" }}
                >
                  <Check size={36} className="text-white" />
                </motion.div>

                <h1 className="font-heading text-2xl font-bold sm:text-3xl" style={{ color: "#2D5A3D" }}>
                  You're all set!
                </h1>
                <p className="mt-2 text-lg" style={{ color: "#C9A962" }}>
                  Ramadan Mubarak 🌙
                </p>

                <Card className="mx-auto mt-8 max-w-sm border-border/30 bg-white/70 shadow-lg backdrop-blur-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-5 space-y-3 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">School</span>
                      <span className="font-medium">{MADHAB_LABELS[madhab] || madhab}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Home Mosque</span>
                      <span className="font-medium">{selectedMosque?.name || "Not set"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nisab</span>
                      <span className="font-medium capitalize">{nisabStandard} standard</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Anniversary</span>
                      <span className="font-medium">
                        {zakatDate
                          ? zakatDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Today"}
                      </span>
                    </div>
                    {madhab === "jafari" && khumsDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Khums year start</span>
                        <span className="font-medium">
                          {khumsDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="mt-8">
                  <Button
                    onClick={handleFinish}
                    disabled={saving}
                    className="gap-2 rounded-full px-10 py-6 font-ui text-base font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    style={{ backgroundColor: "#2D5A3D" }}
                  >
                    {saving ? "Saving..." : "Go to Dashboard"} <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
