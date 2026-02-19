import { Link } from "react-router-dom";
import { Twitter, Instagram, Linkedin, Mail, Heart } from "lucide-react";
import rafiqLogo from "@/assets/rafiq-logo.png";
import { DiamondAccent, CrescentMoon } from "@/assets/islamic-patterns";

const footerLinks = {
  features: [
    { label: "Stock Screener", to: "/screener" },
    { label: "Zakat Calculator", to: "/zakat" },
    { label: "Ask Rafiq", to: "/ask" },
  ],
  resources: [
    { label: "Blog", to: "#" },
    { label: "FAQ", to: "/faq" },
    { label: "Trust Charter", to: "/trust-charter" },
    { label: "Contact", to: "#" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function FooterSection() {
  return (
    <footer className="relative overflow-hidden bg-gradient-hero px-4 py-16">
      {/* Golden Islamic pattern background */}
      <div className="pointer-events-none absolute inset-0 pattern-islamic-gold opacity-40" />

      {/* Decorative crescent */}
      <div className="pointer-events-none absolute -right-20 -top-20 opacity-5">
        <CrescentMoon size={300} className="text-gold" />
      </div>

      <div className="container relative mx-auto max-w-5xl">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src={rafiqLogo} alt="Rafiq" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Your trusted Islamic finance companion for halal investing and giving.
            </p>
          </div>

          {/* Features column */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-gold">
              <DiamondAccent size={8} className="text-gold" />
              Features
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.features.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-gold">
              <DiamondAccent size={8} className="text-gold" />
              Resources
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter column */}
          <div>
            <h4 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-gold">
              <DiamondAccent size={8} className="text-gold" />
              Stay Updated
            </h4>
            <p className="mb-3 text-sm text-white/60">
              Get notified when we launch.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>
              <button className="rounded-lg bg-gold px-4 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-gold/90">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          {/* Social links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10"
              >
                <social.icon size={16} />
              </a>
            ))}
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-3 text-xs">
            <Link to="/terms" className="text-white/50 transition-colors hover:text-white">Terms</Link>
            <span className="text-white/30">•</span>
            <Link to="/privacy" className="text-white/50 transition-colors hover:text-white">Privacy</Link>
          </div>

          {/* Copyright & tagline */}
          <div className="flex flex-col items-center gap-1 text-center md:flex-row md:gap-3">
            <span className="text-xs text-white/50">
              © 2026 Rafiq. All rights reserved.
            </span>
            <span className="hidden text-white/30 md:inline">•</span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              Made with <Heart size={12} className="fill-haram text-haram" /> for the Ummah
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}