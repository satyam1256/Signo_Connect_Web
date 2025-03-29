import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  MapPin, 
  User, 
  ChevronRight,
  Fuel,
  Utensils,
  Wrench,
  Heart,
  Info
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";

// Sample job type (would normally be from shared schema)
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
}

// Sample facility type
interface Facility {
  id: number;
  type: string;
  icon: React.ReactNode;
  count: number;
  color: string;
}

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();

  // Get recommended jobs based on location
  const { data: recommendedJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    enabled: !!user
  });

  // Mock data for facilities (in a real app, this would be fetched from an API)
  const [facilities, setFacilities] = useState<Facility[]>([
    {
      id: 1,
      type: t("fuel_stations"),
      icon: <Fuel className="h-4 w-4" />,
      count: 3,
      color: "bg-primary-50 text-primary"
    },
    {
      id: 2,
      type: t("rest_areas"),
      icon: <Utensils className="h-4 w-4" />,
      count: 2,
      color: "bg-accent-50 text-accent"
    },
    {
      id: 3,
      type: t("service_centers"),
      icon: <Wrench className="h-4 w-4" />,
      count: 1,
      color: "bg-secondary-50 text-secondary"
    },
    {
      id: 4,
      type: t("hospitals"),
      icon: <Heart className="h-4 w-4" />,
      count: 2,
      color: "bg-red-100 text-red-500"
    }
  ]);

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("driver")}
        </h1>
        <div className="ml-auto mr-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary font-medium"
            onClick={() => logout()}
          >
            {t("sign_out")}
          </Button>
        </div>
      </Header>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Welcome Card */}
        <Card className="bg-primary text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <User className="text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-medium">{t("welcome_user")} {user.fullName}!</h2>
                <p className="text-primary-100">Delhi NCR Area</p>
              </div>
            </div>
            
            <div className="bg-primary-dark bg-opacity-30 rounded-md p-3 mb-4">
              <p className="text-sm flex items-start">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>Complete your profile to increase visibility to employers</span>
              </p>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-neutral-100"
              >
                {t("complete_profile")}
              </Button>
              <Button 
                variant="destructive" 
                className="bg-primary-dark text-white hover:bg-primary-dark/90"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {t("find_jobs")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Job Recommendations */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              {t("recommended_jobs")}
            </h3>
            
            {jobsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-neutral-200 rounded-md p-4 animate-pulse">
                    <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/4 mb-3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-neutral-100 rounded w-20"></div>
                      <div className="h-6 bg-neutral-100 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sample job cards - in a real app, these would be populated from API data */}
                <div className="border border-neutral-200 rounded-md p-4 hover:border-primary cursor-pointer transition duration-200">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-neutral-800">Truck Driver - 14 Wheeler</h4>
                    <span className="text-accent font-medium">₹25,000/month</span>
                  </div>
                  <p className="text-neutral-500 text-sm mb-2">ABC Logistics</p>
                  <div className="flex items-center mb-3">
                    <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="text-neutral-500 text-sm">Delhi to Mumbai Route</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Heavy Vehicle</span>
                    <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">3+ Years Experience</span>
                    <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Long Routes</span>
                  </div>
                </div>
                
                <div className="border border-neutral-200 rounded-md p-4 hover:border-primary cursor-pointer transition duration-200">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-neutral-800">Delivery Driver - Local</h4>
                    <span className="text-accent font-medium">₹18,000/month</span>
                  </div>
                  <p className="text-neutral-500 text-sm mb-2">XYZ Distribution</p>
                  <div className="flex items-center mb-3">
                    <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="text-neutral-500 text-sm">Delhi NCR</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Light Vehicle</span>
                    <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">1+ Year Experience</span>
                    <span className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">Local Routes</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center mt-4">
              <Button variant="link" className="text-primary font-medium">
                {t("view_all_jobs")} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Nearby Facilities */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              {t("nearby_facilities")}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {facilities.map((facility) => (
                <div 
                  key={facility.id} 
                  className="border border-neutral-200 rounded-md p-3 flex items-center"
                >
                  <div className={`w-10 h-10 ${facility.color} rounded-full flex items-center justify-center mr-3`}>
                    {facility.icon}
                  </div>
                  <div>
                    <h5 className="font-medium text-neutral-800 text-sm">{facility.type}</h5>
                    <p className="text-neutral-500 text-xs">{facility.count} {t("nearby")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation userType="driver" />
      <Chatbot />
    </div>
  );
};

export default DriverDashboard;
