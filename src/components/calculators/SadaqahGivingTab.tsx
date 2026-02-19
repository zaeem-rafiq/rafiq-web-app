import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Moon, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  addGivingRecord,
  getGivingRecords,
  getRamadanInfo,
  type GivingRecord,
  type GivingType,
} from "@/lib/giving-utils";

const SADAQAH_PRESETS = [25, 50, 100, 250];
const FITR_PER_PERSON = 15;

const GIVING_LABELS: Record<GivingType, string> = {
  zakat: "Zakat",
  khums: "Khums",
  sadaqah: "Sadaqah",
  fitr: "Zakat al-Fitr",
  tatheer: "Tatheer (Purification)",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface SadaqahGivingTabProps {
  onAmountChange: (amount: number) => void;
}

export default function SadaqahGivingTab({ onAmountChange }: SadaqahGivingTabProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const ramadan = getRamadanInfo();

  // Sadaqah state
  const [sadaqahAmount, setSadaqahAmount] = useState<number>(0);
  const [customSadaqah, setCustomSadaqah] = useState<string>("");

  // Fitr state
  const [fitrHeadcount, setFitrHeadcount] = useState<number>(
    userProfile?.householdSize || 1
  );

  // Last 10 Nights state
  const [last10Total, setLast10Total] = useState<number>(0);

  // Record a Donation form
  const [donationAmount, setDonationAmount] = useState("");
  const [donationType, setDonationType] = useState<GivingType>("sadaqah");
  const [donationRecipient, setDonationRecipient] = useState("");
  const [donationDate, setDonationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [donationNotes, setDonationNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // History
  const [history, setHistory] = useState<(GivingRecord & { id: string })[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load history on mount (if authed)
  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    getGivingRecords(user.uid, 50)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [user]);

  // Report sadaqah amount to parent
  useEffect(() => {
    onAmountChange(sadaqahAmount);
  }, [sadaqahAmount, onAmountChange]);

  const handleSadaqahPreset = (amount: number) => {
    setSadaqahAmount(amount);
    setCustomSadaqah("");
  };

  const handleCustomSadaqah = (value: string) => {
    setCustomSadaqah(value);
    const parsed = parseFloat(value);
    setSadaqahAmount(parsed > 0 ? parsed : 0);
  };

  const handleSaveDonation = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your donation records.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(donationAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter an amount", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await addGivingRecord(user.uid, {
        amount,
        type: donationType,
        recipient: donationRecipient,
        date: donationDate,
        notes: donationNotes,
      });

      const updated = await getGivingRecords(user.uid, 50);
      setHistory(updated);

      setDonationAmount("");
      setDonationRecipient("");
      setDonationNotes("");

      toast({ title: "Donation recorded" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const historyTotal = history.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sadaqah Quick Give */}
      <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading">
            <Heart className="mr-2 inline h-5 w-5" /> Sadaqah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Sadaqah is voluntary charity given out of compassion, love, friendship, or
            generosity. Unlike Zakat, there is no minimum amount — every act of
            goodness counts.
          </p>

          {/* Preset amounts */}
          <div>
            <Label className="font-ui text-sm font-medium">Quick Give</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SADAQAH_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleSadaqahPreset(amount)}
                  className={`rounded-full px-5 py-2.5 font-ui text-sm font-medium transition-all ${sadaqahAmount === amount && !customSadaqah
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <Label className="font-ui text-sm font-medium">Custom Amount</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                value={customSadaqah}
                onChange={(e) => handleCustomSadaqah(e.target.value)}
                className="bg-card pl-8"
                placeholder="Enter any amount"
              />
            </div>
          </div>

          {sadaqahAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-primary p-5 text-center text-primary-foreground"
            >
              <p className="font-ui text-xs font-medium opacity-80">
                Your Sadaqah
              </p>
              <p className="mt-1.5 font-heading text-2xl font-bold">
                {fmt(sadaqahAmount)}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Zakat al-Fitr */}
      <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg" style={{ color: "#2D5A3D" }}>
            <Heart size={20} /> Zakat al-Fitr
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {fmt(FITR_PER_PERSON)} per person before Eid prayer
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={fitrHeadcount}
                onChange={(e) => setFitrHeadcount(parseInt(e.target.value) || 1)}
                className="w-16 bg-card text-center"
              />
              <span className="text-xs text-muted-foreground">people</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50/60 px-4 py-2">
            <span className="text-sm text-muted-foreground">Total Fitr</span>
            <span className="font-heading text-lg font-bold" style={{ color: "#2D5A3D" }}>
              {fmt(FITR_PER_PERSON * fitrHeadcount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Last 10 Nights Calculator (Ramadan only) */}
      {ramadan.isRamadan && (
        <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg" style={{ color: "#C9A962" }}>
              <Moon size={20} /> Last 10 Nights Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Split your total donation evenly across 10 nights to ensure you give on Laylat al-Qadr.
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  USD
                </span>
                <Input
                  type="number"
                  min={0}
                  value={last10Total || ""}
                  onChange={(e) => setLast10Total(parseFloat(e.target.value) || 0)}
                  className="bg-card pl-14"
                  placeholder="Total amount to give"
                />
              </div>
              <span className="text-sm text-muted-foreground">÷ 10 =</span>
              <div className="rounded-xl bg-amber-50/60 px-4 py-2">
                <span className="font-heading text-lg font-bold" style={{ color: "#C9A962" }}>
                  {fmt(last10Total / 10)}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">/night</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record a Donation */}
      <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg" style={{ color: "#2D5A3D" }}>
            <Plus size={20} /> Record a Donation
          </CardTitle>
          {!user && (
            <p className="text-xs text-muted-foreground">
              <Link to="/login" className="font-semibold underline" style={{ color: "#2D5A3D" }}>
                Sign in
              </Link>{" "}
              to save your donation history
            </p>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="font-ui text-sm font-medium">Amount</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                USD
              </span>
              <Input
                type="number"
                min={0}
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="bg-card pl-14"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label className="font-ui text-sm font-medium">Type</Label>
            <Select
              value={donationType}
              onValueChange={(v) => setDonationType(v as GivingType)}
            >
              <SelectTrigger className="mt-1.5 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GIVING_LABELS) as GivingType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {GIVING_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-ui text-sm font-medium">Recipient / Organization</Label>
            <Input
              value={donationRecipient}
              onChange={(e) => setDonationRecipient(e.target.value)}
              className="mt-1.5 bg-card"
              placeholder="e.g. Islamic Relief"
            />
          </div>

          <div>
            <Label className="font-ui text-sm font-medium">Date</Label>
            <Input
              type="date"
              value={donationDate}
              onChange={(e) => setDonationDate(e.target.value)}
              className="mt-1.5 bg-card"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="font-ui text-sm font-medium">Notes (optional)</Label>
            <Textarea
              value={donationNotes}
              onChange={(e) => setDonationNotes(e.target.value)}
              className="mt-1.5 bg-card"
              placeholder="Any notes about this donation..."
              rows={2}
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              onClick={handleSaveDonation}
              disabled={saving}
              className="w-full gap-2 font-ui font-semibold text-white"
              style={{ backgroundColor: "#2D5A3D" }}
            >
              {saving ? "Saving..." : "Save Donation Record"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Giving History */}
      {user && (
        <Card className="border-border/30 bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-heading text-lg" style={{ color: "#2D5A3D" }}>
              <span className="flex items-center gap-2">
                <Calendar size={20} /> Giving History
              </span>
              {history.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Total: <strong style={{ color: "#2D5A3D" }}>{fmt(historyTotal)}</strong>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-center text-sm text-muted-foreground">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No donations recorded yet. Use the form above to track your giving.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-xl border border-border/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {GIVING_LABELS[record.type] || record.type}
                        {record.recipient && (
                          <span className="ml-1 text-muted-foreground">
                            — {record.recipient}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{record.date}</p>
                    </div>
                    <span className="font-heading text-sm font-bold" style={{ color: "#2D5A3D" }}>
                      {fmt(record.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
