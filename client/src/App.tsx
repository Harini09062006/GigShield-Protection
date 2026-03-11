import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import WorkerRegister from "@/pages/worker-register";
import WorkerPlans from "@/pages/worker-plans";
import WorkerDashboard from "@/pages/worker-dashboard";
import ClaimHistory from "@/pages/claim-history";
import SupportPage from "@/pages/support";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={WorkerRegister} />
      <Route path="/plans" component={WorkerPlans} />
      <Route path="/dashboard" component={WorkerDashboard} />
      <Route path="/claims" component={ClaimHistory} />
      <Route path="/support" component={SupportPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
