import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Pencil,
  Check,
  X,
  Moon,
  Sun,
  Monitor,
  CalendarDays,
  HelpCircle,
  Search,
  MapPin,
  ExternalLink,
  LogOut,
  Trash2,
  Download,
  Mail,
  ChevronRight,
  Shield,
  BookOpen,
  Scale,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth, MADHAB_LABELS, type Madhab, type Marja } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const MADHAB_INFO: { value: Madhab; label: string; desc: string }[] = [
  { value: "hanafi", label: "Hanafi", desc: "Followed by the majority in South Asia, Turkey, and Central Asia" },
  { value: "shafii", label: "Shafi'i", desc: "Predominant in Southeast Asia, East Africa, and parts of the Middle East" },
  { value: "maliki", label: "Maliki", desc: "Followed widely in North and West Africa" },
  { value: "hanbali", label: "Hanbali", desc: "Predominant in the Arabian Peninsula" },
  { value: "jafari", label: "Ja'fari", desc: "The primary Shia school of Islamic jurisprudence" },
];

const MARJA_OPTIONS: { value: Marja; label: string }[] = [
  { value: "sistani", label: "Ayatollah Sistani" },
  { value: "khamenei", label: "Ayatollah Khamenei" },
  { value: "other", label: "Other" },
];

const FAQ_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { q: "What is Rafiq?", a: "Rafiq (\"companion\" in Arabic) is North America's Islamic Wealth Platform. It provides madhab-aware zakat and khums calculators, halal stock screening, dividend purification, and AI-powered Islamic finance guidance." },
      { q: "How do I set up my account?", a: "After signing up, you'll go through onboarding where you select your school of thought (madhab), home mosque, nisab standard, and zakat anniversary date. You can change any of these in Settings at any time." },
      { q: "Is my data secure?", a: "Yes. Rafiq uses Firebase Authentication and Firestore with encryption in transit and at rest. We follow least-privilege access principles and never sell or share your financial data." },
    ],
  },
  {
    title: "Zakat & Khums",
    items: [
      { q: "What's the difference between zakat and khums?", a: "Zakat is an obligation in all five schools — 2.5% of eligible wealth above nisab after one lunar year. Khums (20% of annual surplus) is specific to Ja'fari jurisprudence, split between Sahm al-Imam and Sahm al-Sadat." },
      { q: "How does nisab work?", a: "Nisab is the minimum wealth threshold that makes zakat obligatory. It can be based on gold (85g) or silver (595g). Hanafi scholars allow either standard; most other schools use gold. The threshold updates with live metal prices." },
      { q: "When should I pay zakat?", a: "Zakat is due once a full lunar year (hawl) has passed since your wealth first exceeded nisab. Your zakat anniversary date tracks this. Many Muslims pay during Ramadan for extra reward." },
      { q: "Are retirement accounts zakatable?", a: "It depends on your madhab. Shafi'i and Hanbali scholars consider accessible retirement funds zakatable (at a 1/3 ratio for tangible assets). Hanafi scholars generally don't require zakat on retirement accounts until withdrawal." },
    ],
  },
  {
    title: "Halal Investing",
    items: [
      { q: "How does stock screening work?", a: "Rafiq screens stocks against AAOIFI criteria: debt ratio (<33%), interest income (<5%), cash and interest-bearing securities (<33%), and core business activity compliance. Stocks are classified as Halal, Not Halal, or Questionable." },
      { q: "What is Tatheer (purification)?", a: "Tatheer is the process of purifying dividends from stocks that have some non-compliant income. The non-compliant percentage of your dividends should be donated to charity. For fully haram stocks, 100% of dividends plus any gains should be donated." },
      { q: "What does 'Questionable' status mean?", a: "A 'Questionable' stock is near the AAOIFI screening thresholds. Some scholars may consider it permissible while others may not. We recommend consulting your local scholar for guidance on these stocks." },
    ],
  },
  {
    title: "Account & Security",
    items: [
      { q: "How do I change my madhab?", a: "You can change your school of thought at any time in Settings under Islamic Settings. This will update all calculations across the app to use the rulings of your selected school." },
      { q: "Can I export my data?", a: "Yes. In Settings under Account Actions, you can export all your profile data as a JSON file. This includes your preferences, calculation settings, and account information." },
      { q: "How do I delete my account?", a: "You can delete your account in Settings under Account Actions. This permanently removes all your data including your profile, calculation history, and linked preferences. This action cannot be undone." },
    ],
  },
];

interface MosqueResult {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile, updateUserProfile, logout, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  // Islamic settings
  const [savingMadhab, setSavingMadhab] = useState(false);
  const [savingMarja, setSavingMarja] = useState(false);
  const [savingNisab, setSavingNisab] = useState(false);

  // Date pickers
  const [zakatDate, setZakatDate] = useState<Date | undefined>(
    userProfile?.zakatAnniversaryDate ? new Date(userProfile.zakatAnniversaryDate) : undefined,
  );
  const [khumsDate, setKhumsDate] = useState<Date | undefined>(
    userProfile?.khumsAnniversaryDate ? new Date(userProfile.khumsAnniversaryDate) : undefined,
  );

  // Mosque search
  const [mosqueQuery, setMosqueQuery] = useState("");
  const [mosqueResults, setMosqueResults] = useState<MosqueResult[]>([]);
  const [mosqueLoading, setMosqueLoading] = useState(false);
  const [showMosqueResults, setShowMosqueResults] = useState(false);
  const mosqueSearchRef = useRef<HTMLDivElement>(null);

  // Contact support
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  // Account actions
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Sync dates when profile loads
  useEffect(() => {
    if (userProfile?.zakatAnniversaryDate) {
      setZakatDate(new Date(userProfile.zakatAnniversaryDate));
    }
    if (userProfile?.khumsAnniversaryDate) {
      setKhumsDate(new Date(userProfile.khumsAnniversaryDate));
    }
  }, [userProfile?.zakatAnniversaryDate, userProfile?.khumsAnniversaryDate]);

  // Mosque search effect
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
        setMosqueResults(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name,
            address: d.data().address || "",
            city: d.data().city || "",
            state: d.data().state || "",
          })),
        );
        setShowMosqueResults(true);
      } catch {
        setMosqueResults([]);
      } finally {
        setMosqueLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [mosqueQuery]);

  // Close mosque results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mosqueSearchRef.current && !mosqueSearchRef.current.contains(e.target as Node)) {
        setShowMosqueResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (userProfile?.displayName || user?.displayName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    const nameParts = trimmed.split(/\s+/);
    await updateUserProfile({
      displayName: trimmed,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
    });
    setEditingName(false);
    toast({ title: "Name updated", description: "Your display name has been saved." });
  };

  const handleMadhabChange = async (m: Madhab) => {
    setSavingMadhab(true);
    const updates: any = { madhab: m };
    // Enforce gold nisab for non-Hanafi
    if (m !== "hanafi") {
      updates.nisabStandard = "gold";
    }
    // Clear marja if not Ja'fari
    if (m !== "jafari") {
      updates.marja = "";
      updates.khumsAnniversaryDate = null;
    }
    await updateUserProfile(updates);
    setSavingMadhab(false);
    toast({ title: "School updated", description: `Set to ${MADHAB_LABELS[m]}` });
  };

  const handleMarjaChange = async (m: Marja) => {
    setSavingMarja(true);
    await updateUserProfile({ marja: m });
    setSavingMarja(false);
    toast({ title: "Marja updated" });
  };

  const handleNisabChange = async (standard: "gold" | "silver") => {
    setSavingNisab(true);
    await updateUserProfile({ nisabStandard: standard });
    setSavingNisab(false);
    toast({ title: "Nisab standard updated", description: `Set to ${standard} standard` });
  };

  const handleZakatDateChange = async (date: Date | undefined) => {
    setZakatDate(date);
    if (date) {
      await updateUserProfile({ zakatAnniversaryDate: date.toISOString().split("T")[0] });
      toast({ title: "Zakat anniversary updated" });
    }
  };

  const handleKhumsDateChange = async (date: Date | undefined) => {
    setKhumsDate(date);
    if (date) {
      await updateUserProfile({ khumsAnniversaryDate: date.toISOString().split("T")[0] });
      toast({ title: "Khums year start updated" });
    }
  };

  const handleMosqueSelect = async (mosque: MosqueResult) => {
    await updateUserProfile({ homeMosqueId: mosque.id, homeMosqueName: mosque.name });
    setShowMosqueResults(false);
    setMosqueQuery("");
    toast({ title: "Home mosque updated", description: mosque.name });
  };

  const handleClearMosque = async () => {
    await updateUserProfile({ homeMosqueId: null, homeMosqueName: null });
    toast({ title: "Home mosque removed" });
  };

  const handleExportData = async () => {
    if (!userProfile) return;
    setExporting(true);
    const data = {
      ...userProfile,
      exportedAt: new Date().toISOString(),
      exportedFrom: "rafiq-web",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rafiq-profile-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: "Data exported", description: "Your profile data has been downloaded." });
  };

  const handleContactSupport = () => {
    const email = "support@rafiq.money";
    const subject = encodeURIComponent(supportSubject || "Support Request");
    const body = encodeURIComponent(
      `${supportMessage}\n\n---\nUser: ${userProfile?.email || ""}\nMadhab: ${MADHAB_LABELS[userProfile?.madhab || ""] || "Not set"}`,
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    setSupportSubject("");
    setSupportMessage("");
    toast({ title: "Opening email client" });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate("/");
      toast({ title: "Account deleted", description: "Your account and data have been permanently removed." });
    } catch (err: any) {
      toast({
        title: "Error deleting account",
        description: err?.message?.includes("requires-recent-login")
          ? "Please sign out, sign back in, and try again."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const currentMadhab = userProfile?.madhab || "";
  const isJafari = currentMadhab === "jafari";
  const isHanafi = currentMadhab === "hanafi";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="relative min-h-screen px-4 pb-20 pt-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: "#2D5A3D" }} />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: "#C9A962" }} />
      </div>

      <div className="container relative z-10 mx-auto max-w-2xl space-y-6">
        {/* Page title */}
        <motion.h1
          className="font-heading text-3xl font-bold"
          style={{ color: "#2D5A3D" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Settings
        </motion.h1>

        {/* ─── 1. Profile Hero Card ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border/30">
                  <AvatarFallback
                    className="font-heading text-xl font-bold text-white"
                    style={{ backgroundColor: "#2D5A3D" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="h-9 rounded-lg"
                        placeholder="Your name"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      />
                      <button onClick={handleSaveName} className="rounded-full p-1.5 text-primary hover:bg-primary/10">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingName(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-heading text-lg font-semibold">
                        {userProfile?.displayName || "Add Your Name"}
                      </h2>
                      <button
                        onClick={() => {
                          setNameValue(userProfile?.displayName || "");
                          setEditingName(true);
                        }}
                        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{userProfile?.email || user?.email}</p>
                  {currentMadhab && (
                    <span
                      className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: "#2D5A3D" }}
                    >
                      {MADHAB_LABELS[currentMadhab]}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 2. Islamic Settings ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <BookOpen size={18} style={{ color: "#2D5A3D" }} />
                Islamic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              {/* Madhab */}
              <div>
                <Label className="mb-2 block text-sm font-medium text-muted-foreground">School of Thought</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MADHAB_INFO.map((m) => {
                    const selected = currentMadhab === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => handleMadhabChange(m.value)}
                        disabled={savingMadhab}
                        className={`rounded-xl border-2 p-3 text-left transition-all duration-200 hover:shadow-sm ${
                          selected
                            ? "border-[#2D5A3D] bg-[#2D5A3D]/5"
                            : "border-border/40 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold" style={{ color: selected ? "#2D5A3D" : undefined }}>
                              {m.label}
                            </span>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{m.desc}</p>
                          </div>
                          {selected && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#2D5A3D" }}>
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Marja (Ja'fari only) */}
              {isJafari && (
                <div>
                  <Label className="mb-2 block text-sm font-medium text-muted-foreground">Marja (Source of Emulation)</Label>
                  <div className="flex flex-wrap gap-2">
                    {MARJA_OPTIONS.map((opt) => {
                      const selected = userProfile?.marja === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleMarjaChange(opt.value)}
                          disabled={savingMarja}
                          className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                            selected
                              ? "border-[#C9A962] bg-[#C9A962]/10 text-[#C9A962]"
                              : "border-border/40 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nisab Standard */}
              {isHanafi && (
                <div>
                  <Label className="mb-2 block text-sm font-medium text-muted-foreground">Nisab Standard</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "gold" as const, label: "Gold", amount: "85g of gold" },
                      { value: "silver" as const, label: "Silver", amount: "595g of silver" },
                    ]).map((opt) => {
                      const selected = userProfile?.nisabStandard === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleNisabChange(opt.value)}
                          disabled={savingNisab}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            selected
                              ? "border-[#C9A962] bg-[#C9A962]/5"
                              : "border-border/40 hover:border-border"
                          }`}
                        >
                          <span className="text-sm font-semibold" style={{ color: selected ? "#C9A962" : undefined }}>
                            {opt.label}
                          </span>
                          <p className="text-xs text-muted-foreground">{opt.amount}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!isHanafi && currentMadhab && (
                <div>
                  <Label className="mb-1 block text-sm font-medium text-muted-foreground">Nisab Standard</Label>
                  <p className="text-sm">Gold (85g) — enforced by {MADHAB_LABELS[currentMadhab]} school</p>
                </div>
              )}

              {/* Zakat Anniversary Date */}
              <div>
                <Label className="mb-2 block text-sm font-medium text-muted-foreground">Zakat Anniversary Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-xl py-5 font-ui text-sm">
                      <CalendarDays size={16} />
                      {zakatDate
                        ? zakatDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                        : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={zakatDate} onSelect={handleZakatDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
                {!zakatDate && (
                  <button
                    onClick={() => handleZakatDateChange(new Date())}
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle size={12} /> I'm not sure — use today's date
                  </button>
                )}
              </div>

              {/* Khums Anniversary Date (Ja'fari only) */}
              {isJafari && (
                <div>
                  <Label className="mb-2 block text-sm font-medium text-muted-foreground">Khums Year Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 rounded-xl py-5 font-ui text-sm">
                        <CalendarDays size={16} />
                        {khumsDate
                          ? khumsDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                          : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={khumsDate} onSelect={handleKhumsDateChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {!khumsDate && (
                    <button
                      onClick={() => handleKhumsDateChange(new Date())}
                      className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle size={12} /> I'm not sure — use today's date
                    </button>
                  )}
                </div>
              )}

              {/* Home Mosque */}
              <div>
                <Label className="mb-2 block text-sm font-medium text-muted-foreground">Home Mosque</Label>
                {userProfile?.homeMosqueName ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#2D5A3D]/30 bg-[#2D5A3D]/5 p-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} style={{ color: "#2D5A3D" }} />
                      <span className="text-sm font-medium">{userProfile.homeMosqueName}</span>
                    </div>
                    <button
                      onClick={handleClearMosque}
                      className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div ref={mosqueSearchRef} className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={mosqueQuery}
                        onChange={(e) => { setMosqueQuery(e.target.value); setShowMosqueResults(true); }}
                        onFocus={() => mosqueResults.length > 0 && setShowMosqueResults(true)}
                        placeholder="Search by mosque name..."
                        className="rounded-xl pl-9"
                      />
                      {mosqueLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2D5A3D] border-t-transparent" />
                        </div>
                      )}
                    </div>
                    {showMosqueResults && mosqueQuery.length >= 2 && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-border/50 bg-white shadow-xl dark:bg-card">
                        <div className="max-h-48 overflow-y-auto">
                          {mosqueResults.length > 0 ? mosqueResults.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleMosqueSelect(m)}
                              className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#2D5A3D]/5"
                            >
                              <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{m.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[m.city, m.state].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            </button>
                          )) : (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                              {mosqueLoading ? "Searching..." : "No mosques found"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 3. Appearance ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Sun size={18} style={{ color: "#C9A962" }} />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <Label className="mb-2 block text-sm font-medium text-muted-foreground">Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "system" as const, label: "System", icon: Monitor },
                  { value: "light" as const, label: "Light", icon: Sun },
                  { value: "dark" as const, label: "Dark", icon: Moon },
                ]).map((opt) => {
                  const Icon = opt.icon;
                  const selected = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                        selected
                          ? "border-[#2D5A3D] bg-[#2D5A3D]/5 text-[#2D5A3D] dark:text-primary"
                          : "border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <Icon size={16} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 4. Help & FAQ ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <HelpCircle size={18} style={{ color: "#2D5A3D" }} />
                Help & FAQ
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              {FAQ_SECTIONS.map((section) => (
                <div key={section.title} className="mb-4 last:mb-0">
                  <h3 className="mb-1 text-sm font-semibold text-muted-foreground">{section.title}</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {section.items.map((item, i) => (
                      <AccordionItem key={i} value={`${section.title}-${i}`} className="border-border/30">
                        <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 5. Contact Support ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Mail size={18} style={{ color: "#2D5A3D" }} />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <div>
                <Label htmlFor="support-subject" className="text-sm text-muted-foreground">Subject</Label>
                <Input
                  id="support-subject"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="support-message" className="text-sm text-muted-foreground">Message</Label>
                <Textarea
                  id="support-message"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or feedback..."
                  className="mt-1 min-h-[100px] rounded-xl"
                />
              </div>
              <Button
                onClick={handleContactSupport}
                disabled={!supportMessage.trim()}
                className="gap-2 rounded-xl"
                style={{ backgroundColor: "#2D5A3D" }}
              >
                <Mail size={14} /> Send via Email
              </Button>
              <p className="text-xs text-muted-foreground">We typically respond within 24 hours.</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 6. Legal Links ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Scale size={18} style={{ color: "#2D5A3D" }} />
                Legal
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="divide-y divide-border/30">
                {[
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                  { label: "Trust Charter", to: "/trust-charter" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center justify-between py-3 text-sm font-medium transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 p-3">
                <Shield size={14} className="shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Rafiq provides financial tracking tools and educational information about Islamic finance. It does not constitute financial, legal, tax, or religious advice.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 7. Account Actions ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="overflow-hidden rounded-2xl border-border/30 bg-white/70 shadow-lg backdrop-blur-xl dark:bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <User size={18} style={{ color: "#2D5A3D" }} />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              {/* Export Data */}
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={exporting}
                className="w-full justify-start gap-2 rounded-xl"
              >
                <Download size={16} />
                {exporting ? "Exporting..." : "Export Data (JSON)"}
              </Button>

              {/* Sign Out */}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start gap-2 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive"
              >
                <LogOut size={16} />
                Sign Out
              </Button>

              {/* Delete Account */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes your account, all financial data, and calculation history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <p className="text-xs text-muted-foreground">
                Deleting your account permanently removes all your data. This action cannot be undone.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
