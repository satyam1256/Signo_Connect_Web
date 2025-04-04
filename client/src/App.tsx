import { Switch, Route, Redirect, useLocation } from "wouter";
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
import AdminFrappeDrivers from "./pages/admin/frappe-drivers";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { WebSocketTest } from "@/components/websocket-test";

// Protected route that redirects logged-in users from auth pages to their dashboard
function AuthRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  
  if (isAuthenticated && user) {
    console.log("User already logged in, redirecting to dashboard");
    // Redirect to the appropriate dashboard based on user type
    const dashboardPath = user.userType === "driver" 
      ? "/driver/dashboard" 
      : "/fleet-owner/dashboard";
    
    return <Redirect to={dashboardPath} />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Show a basic loading state if auth state is still loading
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <Switch>
      {/* Public Routes - accessible to everyone */}
      <Route path="/" component={WelcomePage} />
      
      {/* Auth Routes - redirect logged-in users to their dashboard */}
      <Route path="/login">
        {(params) => <AuthRoute component={LoginPage} params={params} />}
      </Route>
      <Route path="/driver/register">
        {(params) => <AuthRoute component={DriverRegistration} params={params} />}
      </Route>
      <Route path="/fleet-owner/register">
        {(params) => <AuthRoute component={FleetOwnerRegistration} params={params} />}
      </Route>

      {/* Driver Routes */}
      <Route path="/driver/dashboard" component={DriverDashboard} />
      <Route path="/driver/jobs" component={DriverJobs} />
      <Route path="/driver/alerts" component={DriverAlerts} />
      <Route path="/driver/profile" component={DriverProfile} />

      {/* Fleet Owner Routes */}
      <Route path="/fleet-owner/dashboard" component={FleetOwnerDashboard} />
      <Route path="/fleet-owner/jobs" component={FleetOwnerJobs} />
      <Route path="/fleet-owner/profile" component={FleetOwnerProfile} />
      <Route path="/fleet-owner/drivers" component={FleetOwnerDrivers} />

      {/* Admin Routes */}
      <Route path="/admin/frappe-drivers" component={AdminFrappeDrivers} />

      {/* WebSocket Test Routes */}
      <Route path="/test/websocket" component={WebSocketTest} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
