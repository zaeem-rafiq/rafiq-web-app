import { useState } from "react";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Calculator, MessageCircle, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import CountdownTimer from "@/components/CountdownTimer";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import WaitlistSection from "@/components/landing/WaitlistSection";
import FooterSection from "@/components/landing/FooterSection";

export default function Index() {
  return (
    <main className="flex flex-col">
      <HeroSection />
      <FeatureCards />
      <WaitlistSection />
      <FooterSection />
    </main>
  );
}
