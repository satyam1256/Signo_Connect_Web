import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  fullName: string;
  phoneNumber: string;
  userType: "driver" | "fleet_owner";
  email?: string;
  profileCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Load user data from localStorage
  const loadUserData = useCallback(() => {
    setIsLoading(true);
    
    try {
      // Check if user data exists in localStorage
      const storedUser = localStorage.getItem("signoUser");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("User loaded from localStorage:", parsedUser);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          localStorage.removeItem("signoUser");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initialize auth state on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUserData();
    }, 100); // Small delay to ensure consistent loading behavior
    
    return () => clearTimeout(timer);
  }, [loadUserData]);

  // Function to refresh auth state when needed
  const refreshAuth = useCallback(() => {
    loadUserData();
  }, [loadUserData]);

  // Login function
  const login = useCallback((userData: User) => {
    // First, clear any existing profile data to prevent mixing data between users
    localStorage.removeItem("driverProfile");
    localStorage.removeItem("fleetOwnerProfile");
    
    // Set the new user data
    setUser(userData);
    localStorage.setItem("signoUser", JSON.stringify(userData));

    // Log the user login for debugging
    console.log("User logged in:", userData);

    // Redirect based on user type and profile completion
    if (userData.userType === "driver") {
      navigate("/driver/dashboard");
    } else if (userData.userType === "fleet_owner") {
      navigate("/fleet-owner/dashboard");
    }

    toast({
      title: "Login successful",
      description: `Welcome, ${userData.fullName}!`,
    });
  }, [navigate, toast]);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    
    // Clear all user-related data from localStorage
    localStorage.removeItem("signoUser");
    localStorage.removeItem("driverProfile");
    localStorage.removeItem("fleetOwnerProfile");
    
    // Clear any other cached data that might be user-specific
    console.log("User logged out, cleared all profile data");
    
    navigate("/");

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  }, [navigate, toast]);

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("signoUser", JSON.stringify(updatedUser));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isLoading || !isInitialized,
        login,
        logout,
        updateUser,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
