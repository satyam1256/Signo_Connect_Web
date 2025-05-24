import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  User, 
  Star, 
  MapPin, 
  Filter,
  MessageSquare,
  Mail,
  BarChart,
  Phone
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";

const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;

interface Driver {
  email: string | null;
  name: string;
  name1: string;
  experience: string | null;
  address: string | null;
  phone_number: string;
  catagory: string | null;
  is_kyc_verfied: number;
  dl_number: string | null;
  profile_pic: string | null;
  dl_front_pic: string | null;
  aadhar_number: string | null;
  aadhar_front_pic: string | null;
}

const formatWhatsAppNumber = (phone: string) => {
  // Remove any non-digit characters
  const cleanNumber = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  if (!cleanNumber.startsWith('91')) {
    return `91${cleanNumber}`;
  }
  
  return cleanNumber;
};

const allTags = [
  { value: "4-wheel", label: "4-Wheel Driver" },
  { value: "3-wheel", label: "3-Wheel Driver" },
  { value: "2-wheel", label: "2-Wheel Driver" },
  { value: "truck", label: "Truck Driver" },
  { value: "trailer", label: "Trailer Driver" },
  { value: "hazmat", label: "Hazmat Driver" },
  { value: "kyc_verified", label: "KYC Verified" },
  { value: "kyc_pending", label: "KYC Pending" }
];

// Add helper function to get vehicle type labels
const getVehicleTypeLabels = (types: string | null): string[] => {
  if (!types) return [];
  return types.split(',')
    .map(type => type.trim())
    .map(type => allTags.find(tag => tag.value === type.toLowerCase())?.label || type)
    .filter(Boolean);
};

const getProfileCompletionData = (driver: Driver | null) => {
  if (!driver) return 0;

  // Define required fields with their weights
  const fieldWeights: { field: keyof Driver; weight: number }[] = [
    { field: "name1", weight: 20 },        // Essential - Name
    { field: "phone_number", weight: 20 }, // Essential - Contact
    { field: "catagory", weight: 15 },     // Vehicle type
    { field: "dl_number", weight: 15 },    // DL number
    { field: "experience", weight: 10 },    // Experience
    { field: "address", weight: 10 },       // Location
    { field: "aadhar_number", weight: 10 }  // ID proof
  ];

  const totalWeight = fieldWeights.reduce((sum, field) => sum + field.weight, 0);
  const earnedWeight = fieldWeights.reduce((sum, field) => {
    const value = driver[field.field];
    // Consider empty strings and null as missing values
    const isValid = value !== null && value !== undefined && value !== '';
    return sum + (isValid ? field.weight : 0);
  }, 0);

  return Math.round((earnedWeight / totalWeight) * 100);
};

const TransporterDrivers = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const { data: driversResponse, isLoading: driversLoading } = useQuery<{status: boolean; data: Driver[]}>({
    queryKey: ['drivers'],
    queryFn: async () => {
      try{
        const response = await fetch(
          `https://internal.signodrive.com/api/method/signo_connect.api.proxy/Drivers?filters=[["is_active", "in", [0, 1]]]&limit_page_length=100&limit_start=0`,{
          method: "GET",
          headers: { 
            "Authorization": `token ${frappe_token}`,
            "x-key": x_key,
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const responseData = await response.json();
        console.log("Total drivers fetched:", responseData?.data?.length || 0);
        console.log("Full API Response:", responseData);

        // Check if we have the expected data structure
        if (!responseData.data || !Array.isArray(responseData.data)) {
          console.error("Unexpected data structure:", responseData);
          return { status: false, data: [] };
        }

        return responseData; 
      } catch (error) {
        console.error("Error fetching drivers:", error);
        throw error;
      }
    },
    enabled: !!user
  });

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
  : (driversResponse?.data || [])
    .filter(driver => {
      const completion = getProfileCompletionData(driver);
      console.log(`Driver ${driver.name1}: ${completion}%`); // For debugging

      // Check profile completion first (reduced from 70% to 60%)
      if (completion < 60) {
        return false;
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = driver.name1?.toLowerCase().includes(searchLower);
        const addressMatch = driver.address?.toLowerCase().includes(searchLower);
        if (!nameMatch && !addressMatch) {
          return false;
        }
      }

      // Apply tag filters if any are selected
      if (activeFilters.length > 0) {
        const driverTypes = driver.catagory?.split(',').map(type => type.trim().toLowerCase()) || [];
        const driverTags = [
          ...driverTypes,
          driver.is_kyc_verfied ? 'kyc_verified' : 'kyc_pending'
        ];
        return activeFilters.some(filter => driverTags.includes(filter));
      }

      return true;
    });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header showBack backTo="/transporter/dashboard">
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
                key={tag.value}
                variant={activeFilters.includes(tag.value) ? "default" : "outline"}
                className={`rounded-full text-xs py-1 h-auto whitespace-nowrap ${
                  activeFilters.includes(tag.value) 
                    ? "bg-[#FF6D00] hover:bg-[#E65100]" 
                    : "bg-white"
                }`}
                onClick={() => toggleFilter(tag.value)}
              >
                {tag.label}
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDrivers.length > 0 ? (
            <div className="space-y-4">
              {filteredDrivers.map((driver) => (
                <Card 
                  key={driver.name}
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mr-4">
                        {driver.profile_pic ? (
                          <img 
                            src={driver.profile_pic} 
                            alt={driver.name1} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="text-neutral-400 h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium text-neutral-800">{driver.name1}</h4>

                        </div>
                        <p className="text-neutral-500 text-sm mb-2">
                          {driver.experience ? `${driver.experience} years experience` : 'Experience not specified'}
                        </p>
                        {driver.address && (
                          <div className="flex items-center mb-3">
                            <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                            <span className="text-neutral-500 text-sm">{driver.address}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {driver.catagory && (
                            <>
                              {getVehicleTypeLabels(driver.catagory).map((label, index) => (
                                <span key={index} className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full">
                                  {label}
                                </span>
                              ))}
                            </>
                          )}
                          <span className={`text-xs py-1 px-2 rounded-full ${
                            driver.is_kyc_verfied 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {driver.is_kyc_verfied ? 'KYC Verified' : 'KYC Pending'}
                          </span>
                        </div>
                        
                        {/* Profile Completion Indicator
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-neutral-500">Profile Completion</span>
                            <span className="text-xs font-medium text-neutral-600">
                              {getProfileCompletionData(driver)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-300"
                              style={{ 
                                width: `${getProfileCompletionData(driver)}%`,
                                backgroundColor: getProfileCompletionData(driver) >= 90 
                                  ? '#10B981' // green
                                  : getProfileCompletionData(driver) >= 70 
                                    ? '#F59E0B' // amber
                                    : '#DC2626' // red
                              }}
                            />
                          </div>
                        </div> */}

                        <div className="flex justify-end gap-2 mt-3">
                          {driver.phone_number && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => window.open(`tel:${driver.phone_number}`, '_self')}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {driver.phone_number && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => window.open(`https://wa.me/${formatWhatsAppNumber(driver.phone_number)}`, '_blank')}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                              </svg>
                            </Button>
                          )}
                          {driver.email && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-[#FF6D00] border-[#FF6D00] hover:bg-orange-50"
                                onClick={() => window.open(`mailto:${driver.email}`, '_blank')}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                                <Button 
                                variant="outline" 
                                size="sm"
                                className="text-[#FF6D00] border-[#FF6D00]"
                                onClick={() => navigate(`/transporter/driver/${driver.phone_number}/analytics`)}
                                >
                                <BarChart className="h-4 w-4 mr-2" />
                                Analytics
                                </Button>
                            </>
                          )}
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

      <BottomNavigation userType="transporter" />
      <Chatbot />
    </div>
  );
};

export default TransporterDrivers;