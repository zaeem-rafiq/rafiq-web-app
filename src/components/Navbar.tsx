import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import rafiqLogo from "@/assets/rafiq-logo.png";

const calculatorLinks = [
  { to: "/zakat", label: "Zakat Calculator" },
  { to: "/tatheer", label: "Tatheer (Purification)" },
  { to: "/khums", label: "Khums Calculator" },
  { to: "/giving", label: "Sadaqah & Giving" },
];

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/screener", label: "Halal Stock Screener" },
  { to: "/ask", label: "Ask Rafiq" },
];

const authedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/screener", label: "Stock Screener" },
  { to: "/ask", label: "Ask Rafiq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuth();

  const navLinks = user ? authedLinks : publicLinks;

  const isCalculatorActive = calculatorLinks.some(
    (link) => location.pathname === link.to
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const initials = (userProfile?.displayName || user?.displayName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-border/60 bg-card/98 shadow-md backdrop-blur-lg"
          : "border-border/40 bg-card/95 backdrop-blur-lg"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <img src={rafiqLogo} alt="Rafiq" className="h-8 w-auto" />
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`relative rounded-full px-4 py-2 font-ui text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-glow-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}

          {/* Calculators dropdown */}
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1 rounded-full px-4 py-2 font-ui text-sm font-medium transition-all duration-200 ${
                    isCalculatorActive
                      ? "bg-primary text-primary-foreground shadow-glow-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Calculators <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {calculatorLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.to}
                    onClick={() => navigate(link.to)}
                    className="cursor-pointer"
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>

          {/* Auth button or avatar */}
          <li className="ml-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
                    <Avatar className="h-8 w-8 cursor-pointer border-2 border-border/50">
                      <AvatarFallback
                        className="font-ui text-xs font-semibold text-white"
                        style={{ backgroundColor: "#2D5A3D" }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer gap-2">
                    <LayoutDashboard size={14} /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2">
                    <Settings size={14} /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive">
                    <LogOut size={14} /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="rounded-full px-5 py-2 font-ui text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: "#2D5A3D" }}
              >
                Sign In
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile toggle */}
        <div className="flex items-center gap-3 md:hidden">
          {user && (
            <Avatar className="h-8 w-8 border-2 border-border/50">
              <AvatarFallback
                className="font-ui text-xs font-semibold text-white"
                style={{ backgroundColor: "#2D5A3D" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40 bg-card md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`block rounded-lg px-4 py-2.5 font-ui text-sm font-medium transition-colors ${
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

              {/* Calculator links section */}
              <li className="mt-2 mb-1 px-4">
                <span className="font-ui text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Calculators
                </span>
              </li>
              {calculatorLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`block rounded-lg px-4 py-2.5 font-ui text-sm font-medium transition-colors ${
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

              {user && (
                <li>
                  <Link
                    to="/settings"
                    className={`block rounded-lg px-4 py-2.5 font-ui text-sm font-medium transition-colors ${
                      location.pathname === "/settings"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    Settings
                  </Link>
                </li>
              )}
              <li>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-4 py-2.5 text-left font-ui text-sm font-medium text-destructive transition-colors hover:bg-muted"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="block rounded-lg px-4 py-2.5 font-ui text-sm font-semibold transition-colors"
                    style={{ color: "#2D5A3D" }}
                  >
                    Sign In
                  </Link>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
