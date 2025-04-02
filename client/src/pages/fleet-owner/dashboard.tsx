import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  User, 
  Building,
  ChevronRight,
  Search,
  ClipboardList,
  Star,
  MapPin,
  Info,
  Plus
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";

// Sample driver type (would normally be from shared schema)
interface Driver {
  id: number;
  name: string;
  experience: string;
  location: string;
  rating: number;
  tags: string[];
}

const FleetOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();

  // Get recommended drivers based on preferred locations
  const { data: recommendedDrivers, isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['/api/drivers'],
    enabled: !!user
  });

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // We'll use the user's full name for display

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("fleet_owner")}
        </h1>
        <div className="ml-auto mr-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-[#FF6D00] font-medium"
            onClick={() => logout()}
          >
            {t("sign_out")}
          </Button>
        </div>
      </Header>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Welcome Card */}
        <Card className="bg-[#FF6D00] text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <Building className="text-[#FF6D00] h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-medium">{t("welcome_user")} {user.fullName}!</h2>
                <p className="text-[#FFF3E0]">Fleet Owner ID: {user.id}</p>
              </div>
            </div>

            <div className="bg-[#E65100] bg-opacity-30 rounded-md p-3 mb-4">
              <p className="text-sm flex items-start">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>Post your first job to start connecting with drivers</span>
              </p>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="secondary" 
                className="bg-white text-[#FF6D00] hover:bg-neutral-100"
                onClick={() => navigate("/fleet-owner/profile")}
              >
                {t("complete_profile")}
              </Button>
              <Button 
                variant="destructive" 
                className="bg-[#E65100] text-white hover:bg-[#E65100]/90"
                onClick={() => navigate("/fleet-owner/jobs")}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("post_job")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="text-primary h-5 w-5" />
              </div>
              <h3 className="font-medium text-neutral-800 mb-1">{t("find_drivers")}</h3>
              <p className="text-neutral-500 text-sm mb-3">Search qualified drivers in your area</p>
              <Button 
                className="w-full"
                onClick={() => navigate("/fleet-owner/drivers")}
              >
                {t("search")}
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-[#FFF3E0] rounded-full flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="text-[#FF6D00] h-5 w-5" />
              </div>
              <h3 className="font-medium text-neutral-800 mb-1">{t("manage_jobs")}</h3>
              <p className="text-neutral-500 text-sm mb-3">View and manage your job postings</p>
              <Button 
                className="w-full bg-[#FF6D00] hover:bg-[#E65100]"
                onClick={() => navigate("/fleet-owner/jobs")}
              >
                {t("manage")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Driver Recommendations */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              {t("recommended_drivers")}
            </h3>

            {driversLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-neutral-200 rounded-md p-4 animate-pulse">
                    <div className="flex items-start">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-100 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-neutral-100 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-neutral-100 rounded w-1/5 mb-3"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-neutral-100 rounded w-20"></div>
                          <div className="h-6 bg-neutral-100 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sample driver cards - in a real app, these would be populated from API data */}
                <div className="border border-neutral-200 rounded-md p-4 hover:border-[#FF6D00] cursor-pointer transition duration-200">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mr-4">
                      <User className="text-neutral-400 h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium text-neutral-800">Rajesh Singh</h4>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span>4.8</span>
                        </div>
                      </div>
                      <p className="text-neutral-500 text-sm mb-2">5 {t("years_experience")}</p>
                      <div className="flex items-center mb-3">
                        <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                        <span className="text-neutral-500 text-sm">Delhi NCR</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Heavy Vehicle License</span>
                        <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Long Routes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-md p-4 hover:border-[#FF6D00] cursor-pointer transition duration-200">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mr-4">
                      <User className="text-neutral-400 h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium text-neutral-800">Amit Kumar</h4>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span>4.5</span>
                        </div>
                      </div>
                      <p className="text-neutral-500 text-sm mb-2">3 {t("years_experience")}</p>
                      <div className="flex items-center mb-3">
                        <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                        <span className="text-neutral-500 text-sm">Delhi NCR</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Medium Vehicle License</span>
                        <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Local Routes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-4">
              <Button 
                variant="link" 
                className="text-[#FF6D00] font-medium"
                onClick={() => navigate("/fleet-owner/drivers")}
              >
                {t("view_all_drivers")} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation userType="fleet_owner" />
      <Chatbot />
    </div>
  );
};

export default FleetOwnerDashboard;
