import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Loans from "@/pages/Loans";
import MyLoans from "@/pages/MyLoans";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import LandingPage from "@/pages/LandingPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useUser();
  const [location] = useLocation();

  // Admin route — fully standalone, no user auth needed
  if (location.startsWith("/admin")) {
    return <AdminDashboard />;
  }

  const resetMatch = location.match(/^\/reset-password/);
  const resetToken = resetMatch
    ? new URLSearchParams(window.location.search).get("token")
    : null;

  if (resetToken) {
    return <ResetPasswordPage token={resetToken} />;
  }

  // Auth page — always accessible at /auth
  if (location.startsWith("/auth")) {
    if (user) {
      // already logged in, send to dashboard
      window.location.replace("/");
      return null;
    }
    return <AuthPage />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in — show landing page at /
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/loans" component={Loans} />
            <Route path="/my-loans" component={MyLoans} />
            <Route path="/history" component={History} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
