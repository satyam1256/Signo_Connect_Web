import { useState, useEffect } from "react";
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
import { AuthProvider, useAuth } from "@/contexts/auth-context";
// Import the SimpleWebSocketProvider instead of the standard one
import { SimpleWebSocketProvider } from "@/contexts/simple-websocket-context";
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

// Fallback component to use while app is initializing
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-50">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary opacity-25"></div>
          <div className="w-16 h-16 rounded-full border-4 border-t-primary animate-spin absolute top-0 left-0"></div>
        </div>
        <h2 className="mt-4 text-xl font-medium text-neutral-700">Loading SIGNO Connect...</h2>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  
  // Ensure the app has a minimum loading time to prevent flash of content
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading fallback until auth is ready and minimum load time is met
  if (isLoading || !appReady) {
    return <LoadingFallback />;
  }
  
  return (
    <Switch>
      {/* Public Routes - accessible to everyone */}
      <Route path="/">
        {() => <WelcomePage />}
      </Route>
      
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
      <Route path="/driver/dashboard">
        {() => <DriverDashboard />}
      </Route>
      <Route path="/driver/jobs">
        {() => <DriverJobs />}
      </Route>
      <Route path="/driver/alerts">
        {() => <DriverAlerts />}
      </Route>
      <Route path="/driver/profile">
        {() => <DriverProfile />}
      </Route>

      {/* Fleet Owner Routes */}
      <Route path="/fleet-owner/dashboard">
        {() => <FleetOwnerDashboard />}
      </Route>
      <Route path="/fleet-owner/jobs">
        {() => <FleetOwnerJobs />}
      </Route>
      <Route path="/fleet-owner/profile">
        {() => <FleetOwnerProfile />}
      </Route>
      <Route path="/fleet-owner/drivers">
        {() => <FleetOwnerDrivers />}
      </Route>

      {/* WebSocket Test Routes */}
      <Route path="/test/websocket">
        {() => <WebSocketTest />}
      </Route>

      {/* Catch-all route */}
      <Route>
        {() => {
          console.log("Route not found, redirecting to home");
          return <Redirect to="/" />;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  // Two-stage initialization to prevent flash of content
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullyReady, setIsFullyReady] = useState(false);
  
  // First stage initialization - make sure DOM is ready
  useEffect(() => {
    // Use requestAnimationFrame to ensure we're in the next paint cycle
    const initFrame = requestAnimationFrame(() => {
      setIsInitialized(true);
    });
    
    return () => cancelAnimationFrame(initFrame);
  }, []);
  
  // Second stage initialization - allow components to mount
  useEffect(() => {
    if (isInitialized) {
      // Add a longer delay to ensure all child components have a chance to initialize
      // and the DOM is fully ready before attempting WebSocket connections
      const timer = setTimeout(() => {
        setIsFullyReady(true);
        // Add a class to the document to signal app is ready for styling
        document.documentElement.classList.add('app-ready');
        console.log("App is fully ready, WebSocket can now be initialized");
      }, 500); // Increased from 100ms to 500ms
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);
  
  // Show loading spinner during initialization
  if (!isInitialized) {
    return <LoadingFallback />;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isFullyReady ? (
          <SimpleWebSocketProvider 
            autoReconnect={true}
            reconnectInterval={5000} 
            maxReconnectAttempts={10}
          >
            <div className="app-container app-visible">
              <Router />
              <Toaster />
            </div>
          </SimpleWebSocketProvider>
        ) : (
          <div className="app-container app-initializing">
            <Router />
            <Toaster />
          </div>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
