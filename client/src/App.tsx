import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import WelcomePage from "./pages/welcome";
import NotFound from "./pages/not-found";
import LoginPage from "./pages/login";
import DriverRegistration from "./pages/driver/registration";
import DriverDashboard from "./pages/driver/dashboard";
import DriverJobs from "./pages/driver/jobs";
import DriverAlerts from "./pages/driver/alerts";
import DriverProfile from "./pages/driver/profile";
import FleetOwnerRegistration from "./pages/fleet-owner/registration";
import FleetOwnerDashboard from "./pages/fleet-owner/dashboard";
import FleetOwnerJobs from "./pages/fleet-owner/jobs";
import FleetOwnerProfile from "./pages/fleet-owner/profile";
import FleetOwnerDrivers from "./pages/fleet-owner/drivers";
import { create } from "zustand";

// Create a simple auth store to replace the Auth context
type User = {
  id: number;
  fullName: string;
  phoneNumber: string;
  userType: "driver" | "fleet_owner";
  email?: string;
  profileCompleted: boolean;
};

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
};

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  updateUser: (userData) => set((state) => ({ 
    user: state.user ? { ...state.user, ...userData } : null 
  })),
}));

// Create a simple language store to replace the i18n context
type LanguageStore = {
  currentLanguage: string;
  t: (key: string) => string;
  setLanguage: (lang: string) => void;
};

const useLanguageStore = create<LanguageStore>((set) => ({
  currentLanguage: "en",
  t: (key) => key, // Simplified translation function
  setLanguage: (lang) => set({ currentLanguage: lang }),
}));

const RouterComponent = () => {
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
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterComponent />
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
