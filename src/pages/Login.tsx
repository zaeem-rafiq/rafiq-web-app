import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import rafiqLogo from "@/assets/rafiq-logo.png";

export default function Login() {
  const { login, signup, loginWithGoogle, user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // If already logged in, redirect
  if (user) {
    const dest = userProfile?.onboardingComplete === false ? "/onboarding" : from;
    navigate(dest, { replace: true });
    return null;
  }

  const handleRedirect = (profile: any) => {
    if (profile?.onboardingComplete === false) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      // Profile is set in context — redirect after a tick
      setTimeout(() => navigate(from, { replace: true }), 100);
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.code === "auth/user-not-found"
            ? "No account found with this email"
            : err.code === "auth/too-many-requests"
              ? "Too many attempts. Please try again later."
              : "Sign in failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "An account already exists with this email"
          : err.code === "auth/weak-password"
            ? "Password is too weak"
            : "Sign up failed. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      // Small delay to let userProfile update
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 200);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast({
          title: "Error",
          description: "Google sign-in failed. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-20">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: "#2D5A3D" }}
        />
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: "#C9A962" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <Link to="/">
            <img src={rafiqLogo} alt="Rafiq" className="mx-auto mb-4 h-12 w-auto" />
          </Link>
          <h1
            className="font-heading text-2xl font-bold sm:text-3xl"
            style={{ color: "#2D5A3D" }}
          >
            Welcome to Rafiq
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Islamic finance companion
          </p>
        </div>

        <Card className="border-border/30 bg-white/70 shadow-xl backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-transparent border-b border-border/50 rounded-none p-0 h-auto">
                <TabsTrigger
                  value="signin"
                  className="relative font-ui text-sm rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-b-[#2D5A3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#2D5A3D] data-[state=active]:font-semibold transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="relative font-ui text-sm rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-b-[#2D5A3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#2D5A3D] data-[state=active]:font-semibold transition-all"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label className="font-ui text-sm font-medium">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-card pl-10"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-ui text-sm font-medium">Password</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-card pl-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gap-2 font-ui font-semibold rounded-full py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: "#2D5A3D" }}
                  >
                    {loading ? "Signing in..." : "Sign In"} <ArrowRight size={16} />
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label className="font-ui text-sm font-medium">Full Name</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-card pl-10"
                        placeholder="Your name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-ui text-sm font-medium">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-card pl-10"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="font-ui text-sm font-medium">Password</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-card pl-10"
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gap-2 font-ui font-semibold rounded-full py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: "#2D5A3D" }}
                  >
                    {loading ? "Creating account..." : "Create Account"}{" "}
                    <ArrowRight size={16} />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/50" />
              <span className="font-ui text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {/* Google Sign-In */}
            <Button
              variant="outline"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full gap-3 font-ui font-medium rounded-full py-6 text-base transition-all duration-200 hover:scale-[1.02]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <p className="mt-6 text-center font-ui text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
