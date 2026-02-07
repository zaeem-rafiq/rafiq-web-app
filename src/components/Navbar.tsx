import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import rafiqLogo from "@/assets/rafiq-logo.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/screener", label: "Screener" },
  { to: "/zakat", label: "Zakat" },
  { to: "/ask", label: "Ask Rafiq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={rafiqLogo} alt="Rafiq" className="h-9 w-auto" />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/60 md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
