import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Screener from "./pages/Screener";
import Zakat from "./pages/Zakat";
import AskRafiq from "./pages/AskRafiq";
import FAQ from "./pages/FAQ";
import TrustCharter from "./pages/TrustCharter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import TatheerPage from "./pages/TatheerPage";
import GivingPage from "./pages/GivingPage";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Khums = lazy(() => import("./pages/Khums"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/zakat" element={<Zakat />} />
            <Route path="/ask" element={<AskRafiq />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/trust-charter" element={<TrustCharter />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/login"
              element={<Suspense fallback={<LoadingScreen />}><Login /></Suspense>}
            />
            <Route
              path="/khums"
              element={<Suspense fallback={<LoadingScreen />}><Khums /></Suspense>}
            />
            <Route path="/tatheer" element={<TatheerPage />} />
            <Route path="/giving" element={<GivingPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}><Onboarding /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}><Settings /></Suspense>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
