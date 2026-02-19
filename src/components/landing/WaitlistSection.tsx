import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlist } from "@/lib/waitlist";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await addToWaitlist(email, "mid-page");
      setSubmitted(true);
      toast({
        title: "You're on the list.",
        description: "We'll email you before Ramadan with launch details.",
      });
      setEmail("");
    } catch {
      toast({
        title: "Something went wrong.",
        description: "Please try again or email zaeem@rafiq.money directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-border/40 bg-muted/30 px-4 py-16 sm:py-24">
      <div className="container mx-auto max-w-lg text-center">
        <Mail className="mx-auto mb-4 h-10 w-10 text-accent" />
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Join the Waitlist
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Get early access when Rafiq launches for Ramadan 2026.
        </p>

        {submitted ? (
          <p className="mt-6 rounded-2xl bg-primary/10 px-6 py-4 font-ui font-medium text-primary">
            You're on the list. We'll be in touch before Ramadan.
          </p>
        ) : (
          <form
            onSubmit={handleWaitlist}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-card"
            />
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 font-ui font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join the Waitlist"} <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
