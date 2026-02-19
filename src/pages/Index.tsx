import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import ShowYourWorkPanel from "@/components/landing/ShowYourWorkPanel";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeatureCards from "@/components/landing/FeatureCards";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import FooterSection from "@/components/landing/FooterSection";
import LeadMagnetQuiz from "@/components/landing/LeadMagnetQuiz";

export default function Index() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <main className="flex flex-col">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ShowYourWorkPanel />
      <HowItWorksSection />
      <FeatureCards />
      <SocialProofSection />
      <FinalCTASection />
      <FooterSection />

      {/* Floating quiz widget */}
      <button
        onClick={() => setQuizOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-ui text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
      >
        <ClipboardCheck size={16} />
        <span className="hidden sm:inline">Get Your Zakat Readiness Score</span>
        <span className="sm:hidden">Quiz</span>
      </button>

      {/* Quiz modal */}
      <LeadMagnetQuiz isOpen={quizOpen} onClose={() => setQuizOpen(false)} />
    </main>
  );
}
