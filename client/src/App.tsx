import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/welcome";
import DriverRegistration from "@/pages/driver/registration";
import DriverDashboard from "@/pages/driver/dashboard";
import FleetOwnerRegistration from "@/pages/fleet-owner/registration";
import FleetOwnerDashboard from "@/pages/fleet-owner/dashboard";
import { AuthProvider } from "@/contexts/auth-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomePage} />
      <Route path="/driver/register" component={DriverRegistration} />
      <Route path="/driver/dashboard" component={DriverDashboard} />
      <Route path="/fleet-owner/register" component={FleetOwnerRegistration} />
      <Route path="/fleet-owner/dashboard" component={FleetOwnerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
