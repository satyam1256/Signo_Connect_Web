import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  User, 
  Star, 
  MapPin, 
  Filter,
  MessageSquare
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const FleetOwnerDrivers = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Get drivers based on current filters
  const { data: drivers, isLoading: driversLoading } = useQuery<Driver[]>({
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

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const filteredDrivers = driversLoading 
    ? [] 
    : [
        {
          id: 1, 
          name: "Rajesh Singh", 
          experience: "5 years", 
          location: "Delhi NCR",
          rating: 4.8,
          tags: ["Heavy Vehicle License", "Long Routes"]
        },
        {
          id: 2, 
          name: "Amit Kumar", 
          experience: "3 years", 
          location: "Delhi NCR",
          rating: 4.5,
          tags: ["Medium Vehicle License", "Local Routes"]
        },
        {
          id: 3, 
          name: "Sunil Verma", 
          experience: "7 years", 
          location: "Mumbai",
          rating: 4.9,
          tags: ["Heavy Vehicle License", "Interstate"]
        },
        {
          id: 4, 
          name: "Manoj Sharma", 
          experience: "2 years", 
          location: "Pune",
          rating: 4.3,
          tags: ["Light Vehicle License", "City Routes"]
        },
        {
          id: 5, 
          name: "Harpreet Singh", 
          experience: "4 years", 
          location: "Chandigarh",
          rating: 4.6,
          tags: ["Medium Vehicle License", "Regional Routes"]
        }
      ].filter(driver => {
        // Apply search filter
        if (searchTerm && !driver.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !driver.location.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Apply tag filters if any are selected
        if (activeFilters.length > 0) {
          return driver.tags.some(tag => activeFilters.includes(tag));
        }

        return true;
      });

  const allTags = [
    "Heavy Vehicle License", 
    "Medium Vehicle License", 
    "Light Vehicle License",
    "Long Routes",
    "Local Routes",
    "Interstate",
    "City Routes",
    "Regional Routes"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header showBack backTo="/fleet-owner/dashboard">
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("find_drivers")}
        </h1>
      </Header>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input 
              placeholder="Search drivers by name or location" 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center bg-[#FFF3E0] text-[#FF6D00] rounded-full py-1 px-3">
              <Filter className="h-4 w-4 mr-1" />
              <span className="text-sm">Filters</span>
            </div>

            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={activeFilters.includes(tag) ? "default" : "outline"}
                className={`rounded-full text-xs py-1 h-auto whitespace-nowrap ${
                  activeFilters.includes(tag) 
                    ? "bg-[#FF6D00] hover:bg-[#E65100]" 
                    : "bg-white"
                }`}
                onClick={() => toggleFilter(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Driver List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-neutral-800">
              {filteredDrivers.length} Drivers Found
            </h2>
            {activeFilters.length > 0 && (
              <Button 
                variant="link" 
                className="text-[#FF6D00] text-sm p-0 h-auto"
                onClick={() => setActiveFilters([])}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {driversLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
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
          ) : filteredDrivers.length > 0 ? (
            <div className="space-y-4">
              {filteredDrivers.map((driver) => (
                <Card 
                  key={driver.id}
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mr-4">
                        <User className="text-neutral-400 h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium text-neutral-800">{driver.name}</h4>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{driver.rating}</span>
                          </div>
                        </div>
                        <p className="text-neutral-500 text-sm mb-2">{driver.experience} {t("years_experience")}</p>
                        <div className="flex items-center mb-3">
                          <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                          <span className="text-neutral-500 text-sm">{driver.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {driver.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-[#FF6D00] border-[#FF6D00]"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-1">No drivers found</h3>
              <p className="text-neutral-500">
                Try adjusting your search filters
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation userType="fleet_owner" />
      <Chatbot />
    </div>
  );
};

export default FleetOwnerDrivers;