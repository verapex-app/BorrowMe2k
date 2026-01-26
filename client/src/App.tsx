import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Cards from "@/pages/Cards";
import Payments from "@/pages/Payments";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

// Stub pages for new functionality
const PrivacySecurity = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold mb-4">Privacy & Security</h1>
    <p className="text-muted-foreground text-sm">Security settings and privacy controls will appear here.</p>
  </div>
);

const AccountSettings = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold mb-4">Account Settings</h1>
    <p className="text-muted-foreground text-sm">Update your personal information and account preferences.</p>
  </div>
);

const AddFunds = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold mb-4">Add Funds</h1>
    <p className="text-muted-foreground text-sm">Top up your account using various payment methods.</p>
  </div>
);

const RequestFunds = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold mb-4">Request Funds</h1>
    <p className="text-muted-foreground text-sm">Request money from your friends and family.</p>
  </div>
);

const MoreActions = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold mb-4">More Actions</h1>
    <p className="text-muted-foreground text-sm">Additional banking services and features.</p>
  </div>
);

function Router() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/cards" component={Cards} />
            <Route path="/payments" component={Payments} />
            <Route path="/history" component={History} />
            <Route path="/profile" component={Profile} />
            <Route path="/privacy-security" component={PrivacySecurity} />
            <Route path="/account-settings" component={AccountSettings} />
            <Route path="/add-funds" component={AddFunds} />
            <Route path="/request" component={RequestFunds} />
            <Route path="/more" component={MoreActions} />
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
