import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/welcome";
import LoginPage from "@/pages/login";
import DriverRegistration from "@/pages/driver/registration";
import DriverDashboard from "@/pages/driver/dashboard";
import DriverJobs from "@/pages/driver/jobs";
import DriverAlerts from "@/pages/driver/alerts";
import DriverProfile from "@/pages/driver/profile";
import FleetOwnerRegistration from "@/pages/fleet-owner/registration";
import FleetOwnerDashboard from "@/pages/fleet-owner/dashboard";
import FleetOwnerJobs from "@/pages/fleet-owner/jobs";
import FleetOwnerProfile from "@/pages/fleet-owner/profile";
import FleetOwnerDrivers from "@/pages/fleet-owner/drivers";
import { AuthProvider } from "@/contexts/auth-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomePage} />
      <Route path="/login" component={LoginPage} />

      {/* Driver Routes */}
      <Route path="/driver/register" component={DriverRegistration} />
      <Route path="/driver/dashboard" component={DriverDashboard} />
      <Route path="/driver/jobs" component={DriverJobs} />
      <Route path="/driver/alerts" component={DriverAlerts} />
      <Route path="/driver/profile" component={DriverProfile} />

      {/* Fleet Owner Routes */}
      <Route path="/fleet-owner/register" component={FleetOwnerRegistration} />
      <Route path="/fleet-owner/dashboard" component={FleetOwnerDashboard} />
      <Route path="/fleet-owner/jobs" component={FleetOwnerJobs} />
      <Route path="/fleet-owner/profile" component={FleetOwnerProfile} />
      <Route path="/fleet-owner/drivers" component={FleetOwnerDrivers} />

      {/* Fallback */}
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
