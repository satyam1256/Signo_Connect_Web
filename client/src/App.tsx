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
import DriverTrips from "@/pages/driver/trips";
import TransporterRegistration from "@/pages/transporter/registration";
import TransporterDashboard from "@/pages/transporter/dashboard";
import TransporterJobsPage from "@/pages/transporter/jobs";
import TransporterProfile from "@/pages/transporter/profile";
import TransporterDrivers from "@/pages/transporter/drivers";
import TransporterTrips from "@/pages/transporter/trips";
import DriverAnalytics from "@/pages/transporter/driver-analytics";
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
      <Route path="/driver/trips" component={DriverTrips} />      
      {/* <Route path='/driver/pf2' component={DBP2}/> */}
      {/* Fleet Owner Routes */}
      <Route path="/transporter/register" component={TransporterRegistration} />
      <Route path="/transporter/dashboard" component={TransporterDashboard} />
      <Route path="/transporter/jobs" component={TransporterJobsPage} />
      <Route path="/transporter/profile" component={TransporterProfile} />
      <Route path="/transporter/drivers" component={TransporterDrivers} />
      <Route path="/transporter/trips" component={TransporterTrips} />
      <Route path="/transporter/driver/:phoneNumber/analytics" component={DriverAnalytics} />

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