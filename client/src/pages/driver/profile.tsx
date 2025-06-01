import { useState, useEffect, useCallback, useRef } from "react"; // Added useRef
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User as UserIcon,
  MapPin,
  Mail,
  Phone,
  Shield,
  FileText,
  Languages,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  Info,
  Bell,
  Truck,
  Edit,
  Camera,
  Loader2,
  Check
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FileUpload } from "@/components/ui/file-upload";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth, User } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Cookies from "js-cookie";

const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY


const vehicleOptions = [
  { label: "4-Wheel Driver", value: "4-wheel" },
  { label: "3-Wheel Driver", value: "3-wheel" },
  { label: "2-Wheel Driver", value: "2-wheel" },
  { label: "Truck Driver", value: "truck" },
  { label: "Trailer Driver", value: "trailer" },
  { label: "Hazmat Driver", value: "hazmat" },
];




const getProfileCompletionData = (data: Record<string, any> | null) => {
  // Return default values if data is null or undefined
  if (!data) {
    return {
      completionPercentage: 0,
      missingItems: ["Name", "Phone Number", "Email", "Address", "Experience", "Category", "Driving License Number", 
                     "Driving License Front Image", "Aadhar Number", "Aadhar Front Image"],
      isProfileComplete: false
    };
  }

  const fieldWeights: { field: string; label: string; weight: number }[] = [
    { field: "name1", label: "Name", weight: 10 },
    { field: "phone_number", label: "Phone Number", weight: 10 },
    { field: "email", label: "Email", weight: 10 },
    { field: "address", label: "Address", weight: 10 },
    { field: "experience", label: "Experience", weight: 10 },
    { field: "catagory", label: "Category", weight: 10 },
    { field: "dl_number", label: "Driving License Number", weight: 10 },
    { field: "dl_front_pic", label: "Driving License Front Image", weight: 10 },
    { field: "aadhar_number", label: "Aadhar Number", weight: 10 },
    { field: "aadhar_front_pic", label: "Aadhar Front Image", weight: 10 }
  ];

  let totalPoints = 0;
  let earnedPoints = 0;
  const missingItems: string[] = [];

  fieldWeights.forEach(({ field, label, weight }) => {
    totalPoints += weight;
    const value = data[field];

    const isFilled = typeof value === "string"
      ? value.trim() !== ""
      : typeof value === "object" && value !== null
      ? true
      : typeof value === "number"
      ? true
      : false;

    if (isFilled) {
      earnedPoints += weight;
    } else {
      missingItems.push(label);
    }
  });

  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100);

  return {
    completionPercentage,
    missingItems,
    isProfileComplete: missingItems.length === 0
  };
};


interface UserProfile {
  name1: string;
  email: string;
  phone_number: string;
  emergency_contact_number: string;
  address: string;
  experience: string;
  catagory: string;
  dl_number: string;
  dl_front_pic: string | null;
  dl_back_pic: string | null;
  aadhar_number: string;
  aadhaar_front: string | null;
  aadhaar_back: string | null;
  dob: string;
  profile_pic: string | null;
  driver_id:string | null ;
}




const DriverProfilePage = () =>  {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast(); // Use the hook here

  // Add a ref for the Aadhar input field
  const aadharInputRef = useRef<HTMLInputElement>(null);

  // State declarations
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name1: "",
    email: "",
    phone_number: "",
    emergency_contact_number: "",
    address: "",
    experience: "",
    catagory: "",
    dl_number: "",
    dl_front_pic: null,
    dl_back_pic: null,
    aadhar_number: "",
    aadhaar_front: null,
    aadhaar_back: null,
    dob: "",
    profile_pic: null,
    driver_id:null
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [profile_pic, setprofile_pic] = useState<File | null>(null);
  const [dlFront, setDlFront] = useState<File | null>(null);
  const [dlBack, setDlBack] = useState<File | null>(null);
  const [aadhaar_front, setaadhaar_front] = useState<File | null>(null);
  const [aadhaar_back, setaadhaar_back] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Dialog states
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [languageSettingsOpen, setLanguageSettingsOpen] = useState(false);

  // Add new state for notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: false,
    sms: false
  });

  const [data,setData]= useState<any>(null);
  
  const getFullImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    
    if (url.startsWith('/files')) {
      return `https://internal.signodrive.com${url}`;
    }
    
    return url;
  };


  // Add uploadFile function
  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const myHeaders = new Headers();
    myHeaders.append("Authorization" ,`token ${frappe_token}`);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formData,
      redirect: "follow" as RequestRedirect
    };

    const response = await fetch(`https://internal.signodrive.com/api/method/signo_connect.api.upload_image`, requestOptions);
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Upload Error:", errorData);
      throw new Error("Failed to upload file");
    }

    const data = await response.json();

    let fileUrl = data.file_url || data.message?.file_url || (data.status && data.file_url) || "";
    
    if (data.status === true && typeof data.file_url === 'string') {
      if (data.file_url.startsWith('/files')) {
        fileUrl = `https://internal.signodrive.com${data.file_url}`;
        console.log("Constructed complete file URL:", fileUrl);
      } else {
        fileUrl = data.file_url;
      }
    }
    
    if (!fileUrl) {
      console.error("File URL structure in response:", JSON.stringify(data));
      throw new Error("File URL not found in response");
    }
    
    return fileUrl;
  };

  // Profile loading function wrapped in useCallback
  const loadProfile = useCallback(async () => {
    if (!user) {
      console.log("loadProfile called without user, returning.");
      return;
    }

    try {
      const userId = Cookies.get('userId');
      const phoneNumber = Cookies.get('phoneNumber');

      
      const res = await fetch(`https://internal.signodrive.com/api/method/signo_connect.apis.driver.get_driver_profile?phone_number=${phoneNumber}`, {
        method: "GET",
        headers: {
          "Authorization": `token ${frappe_token}`
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to load profile: ${res.statusText}`);
      }
      
      const json = await res.json();
      console.log("API Response:", json);
      
      
      const profileData = json.doc || {};
      console.log("profileData--->",profileData);

      if (profileData.profile_pic) {
        profileData.profile_pic = getFullImageUrl(profileData.profile_pic);
      }
      if (profileData.dl_front_pic) {
        profileData.dl_front_pic = getFullImageUrl(profileData.dl_front_pic);
      }
      if (profileData.dl_back_pic) {
        profileData.dl_back_pic = getFullImageUrl(profileData.dl_back_pic);
      }
      if (profileData.aadhar_front_pic) {
        profileData.aadhar_front_pic = getFullImageUrl(profileData.aadhar_front_pic);
      }
      if (profileData.aadhar_back_pic) {
        profileData.aadhar_back_pic = getFullImageUrl(profileData.aadhar_back_pic);
      }
      

      if (!profileData.name && profileData.name1) {
        profileData.name = profileData.name1;
      } else if (!profileData.name) {
        profileData.name = ""; 
      }
      
      setData(profileData);
      
      console.log("Loaded profile data:", profileData);
      

      setProfile({
        name1: profileData.name1 || "",
        email: profileData.email || "",
        phone_number: profileData.phone_number || "",
        emergency_contact_number: profileData.emergency_contact_number || "",
        address: profileData.address || "",
        experience: profileData.experience || "",
        catagory: profileData.catagory || "",
        dl_number: profileData.dl_number || "",
        dl_front_pic: profileData.dl_front_pic || null,
        dl_back_pic: profileData.dl_back_pic || null,
        aadhaar_front: profileData.aadhar_front_pic || null, 
        aadhaar_back: profileData.aadhar_back_pic || null,
        aadhar_number: profileData.aadhar_number || "",
        dob: profileData.dob || "",
        profile_pic: profileData.profile_pic || null,
        driver_id: userId ?? null
      });
      
      console.log("Profile loaded successfully");
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data"
      });
      
      // Initialize data with empty object to prevent null reference errors
      setData({
        name1: "",
        email: "",
        phone_number: "",
        emergency_contact_number: "",
        address: "",
        experience: "",
        catagory: "",
        dl_number: "",
        dl_front_pic: null,
        dl_back_pic: null,
        aadhar_number: "",
        aadhar_front_pic: null,
        aadhar_back_pic: null,
        dob: "",
        profile_pic: null
      });
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    setIsProfileLoading(true);
    loadProfile();
  }, [user, navigate, loadProfile]);

  // Handle profile update
  const handleProfileUpdate = async (formData: Partial<UserProfile>) => {
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      
      try {

        const fileUploads = [];
        
        // Profile Picture
        if (profile_pic) {
          fileUploads.push(
            uploadFile(profile_pic, 'profile_pic')
              .then(url => ({ field: 'profile_pic', url }))
          );
        }

        // Driving License Files
        if (dlFront) {
          fileUploads.push(
            uploadFile(dlFront, 'dl_front_pic')
              .then(url => ({ field: 'dl_front_pic', url }))
          );
        }
        if (dlBack) {
          fileUploads.push(
            uploadFile(dlBack, 'dl_back_pic')
              .then(url => ({ field: 'dl_back_pic', url }))
          );
        }

        // Aadhar Files
        if (aadhaar_front) {
          fileUploads.push(
            uploadFile(aadhaar_front, 'aadhar_front_pic')
              .then(url => ({ field: 'aadhar_front_pic', url }))
          );
        }
        if (aadhaar_back) {
          fileUploads.push(
            uploadFile(aadhaar_back, 'aadhar_back_pic')
              .then(url => ({ field: 'aadhar_back_pic', url }))
          );
        }


        const uploadedFiles = await Promise.all(fileUploads);
        const uploads = uploadedFiles.reduce((acc, { field, url }) => {
          acc[field] = url;
          return acc;
        }, {} as Record<string, string>);

        // Check directly from the DOM if available
        if (aadharInputRef.current) {
          const aadharInputValue = aadharInputRef.current.value;
          console.log("Aadhar value from input ref:", aadharInputValue);
          // Force set the aadhar_number from the actual DOM input
          editedProfile.aadhar_number = aadharInputValue;
        }

        const userId = Cookies.get('userId');

        const aadharValue = aadharInputRef.current?.value || editedProfile.aadhar_number || (data?.aadhar_number || "")
        
        // Create a complete update object with all fields explicitly defined
        const updatePayload = {
          driver_id: userId,
          name1: editedProfile.name1 ?? (data?.name1 || ""),
          email: editedProfile.email ?? (data?.email || ""),
          phone_number: editedProfile.phone_number ?? (data?.phone_number || ""),
          emergency_contact_number: editedProfile.emergency_contact_number ?? (data?.emergency_contact_number || ""),
          address: editedProfile.address ?? (data?.address || ""),
          experience: editedProfile.experience ?? (data?.experience || ""),
          catagory: editedProfile.catagory ?? (data?.catagory || ""),
          dl_number: editedProfile.dl_number ?? (data?.dl_number || ""),
          aadhar_number: editedProfile.aadhar_number || (data?.aadhar_number || ""),
          dob: editedProfile.dob ?? (data?.dob || ""),
          ...uploads // Include uploaded file URLs
        };
        
        // Remove any properties with undefined values
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key as keyof typeof updatePayload] === undefined) {
            delete updatePayload[key as keyof typeof updatePayload];
          }
        });
        

        const res1 = await fetch(`https://internal.signodrive.com/api/method/signo_connect.api.proxy/Drivers/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${frappe_token}`,
            "x-key":x_key
          },
          body: JSON.stringify(updatePayload),
        });
        
        let responseData;
        try {
          // Parse the response JSON
          responseData = await res1.json();
          console.log("Update Response:", responseData);
          
        } catch (jsonError) {
          console.error("Error parsing response JSON:", jsonError);
          throw new Error("Failed to parse server response");
        }

        if (!res1.ok) {
          console.error("Update Error Response:", responseData);
          throw new Error(responseData?.message || "Failed to update profile");
        }
        
        
        if (user) {
          const userUpdate: Partial<User> = {};
          
          if (editedProfile.name1) {
            userUpdate.fullName = editedProfile.name1;
          }
          
          if (editedProfile.email) {
            userUpdate.email = editedProfile.email;
          }
          
          // Update the user context if we have changes
          if (Object.keys(userUpdate).length > 0) {
            updateUser(userUpdate);
          }
        }

        // queryClient.invalidateQueries({ queryKey: [`/api/method/signo_connect.apis.driver.upload_image`] });
        queryClient.invalidateQueries({ queryKey: [`/api/method/signo_connect.apis.driver.get_driver_profile?driver_id=${user.id}`] });
        
        
        toast({ title: "Success", description: "Profile updated successfully" });
        await loadProfile();
        setIsEditingProfile(false);
  
        // Reset file states
        setprofile_pic(null);
        setDlFront(null);
        setDlBack(null);
        setaadhaar_front(null);
        setaadhaar_back(null);
        
        // Reload profile data and close the dialog
        await loadProfile();
        setIsEditingProfile(false);
      }
      catch (error) {
        const err = error as Error;
        console.error("Error updating profile:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to update profile"
        });
      }
      finally {
        setIsUpdatingProfile(false);
      }
    } catch (error: any) {
      console.error("Error in profile update outer try block:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile"
      });
      setIsUpdatingProfile(false);
    }
  };

  // Add handler for notification preference changes
  const handleNotificationChange = (type: 'email' | 'sms', checked: boolean) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: checked
    }));
  };

  if (!user) {
    return null;
  }

  // Show loading state while fetching profile data
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Header>
          <h1 className="text-xl font-bold text-neutral-800 ml-2">
            {t("profile")}
          </h1>
        </Header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-neutral-600">Loading profile...</p>
        </div>

        <BottomNavigation userType="driver" />
      </div>
    );
  }

  // Get profile status only if data is available
  const profileStatus = getProfileCompletionData(data);

  console.log("Data structure when rendering:", {
    hasData: !!data,
    keys: data ? Object.keys(data) : [],
    aadharValue: data?.aadhar_number,
    // Check various possible field names for Aadhar
    possibleAadharFields: data ? {
      aadhar_number: data.aadhar_number,
      aadharNumber: (data as any).aadharNumber,
      aadhaar_number: (data as any).aadhaar_number,
      aadhar: (data as any).aadhar
    } : {}
  });
  
  if (!user || !data) {
    if (!user) {
      navigate("/");
    }
    return null;
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Header>
          <h1 className="text-xl font-bold text-neutral-800 ml-2">
            {t("profile")}
          </h1>
        </Header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-neutral-600">Loading profile...</p>
        </div>

        <BottomNavigation userType="driver" />
      </div>
    );
  }

  // Helper function to extract name initials safely
  const getInitials = (name: string | undefined): string => {
    if (!name || typeof name !== 'string') return "";
    return name.slice(0, 2).toUpperCase();
  };

  // Inside the DriverProfilePage component, add this helper function
  const parseVehicleTypes = (types: string | undefined): string[] => {
    if (!types) return [];
    return types.split(',').map(type => type.trim()).filter(Boolean);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("profile")}
        </h1>
      </Header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                {/* Cover Photo */}
                <div className="h-32 sm:h-48 bg-gradient-to-r from-primary/80 to-primary relative">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-4 right-4"
                    onClick={() => {
                        if (!data) return;
                        
                        const profileToEdit = {
                          name1: data.name1 || "",
                          email: data.email || "",
                          phone_number: data.phone_number || "",
                          emergency_contact_number: data.emergency_contact_number || "",
                          address: data.address || "",
                          experience: parseInt(data.experience, 10).toString() || "0",
                          catagory: data.catagory || "",
                          dl_number: data.dl_number || "",
                          aadhar_number: data.aadhar_number || "",
                          dob: data.dob || "",
                          profile_pic: data.profile_pic || null
                        };
                        
                        console.log("Opening edit form with data:", profileToEdit);
                        console.log("Aadhar number from data:", data.aadhar_number);
                        
                        setEditedProfile(profileToEdit);
                        setIsEditingProfile(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("edit_profile")}
                  </Button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 relative">
                  <div className="absolute -top-12 left-6">
                    <Avatar className="w-24 h-24 border-4 border-white">
                      <AvatarImage src={getFullImageUrl(data.profile_pic)} alt={data?.name1 || ""} />
                      <AvatarFallback className="text-2xl bg-primary text-white">
                        {getInitials(data?.name1)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="pt-16">
                    <h2 className="text-2xl font-bold mb-1">{(data?.name1 || t("driver")).toUpperCase()}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center text-neutral-600 gap-1 sm:gap-4 mb-4 flex-wrap">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{t("driver")} {data?.experience ? `• ${data?.experience} ${t("years_experience")}` : " "}</span>
                      </div>
                      {data?.address && (
                        <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                            {/* Consider showing only city/state if address is too long */}
                            <span>{data?.address}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="details">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="details">{t("details")}</TabsTrigger>
                <TabsTrigger value="documents">{t("documents")}</TabsTrigger>
                <TabsTrigger value="preferences">{t("preferences")}</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 space-y-4">
                <Card className="w-full max-w-4xl">
                  <CardHeader>
                    <CardTitle>{t("contact_information")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">{t("phone_number")}</h4>
                        <p className="text-neutral-600 break-words">{data?.phone_number || t("not_added")}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">{t("email_address")}</h4>
                        <p className="text-neutral-600 break-words">{data?.email || t("not_added")}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">{t("address")}</h4>
                        <p className="text-neutral-600 break-words">{data?.address || t("not_added")}</p>
                      </div>
                    </div>

                     <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">{t("emergency_contact")}</h4>
                        <p className="text-neutral-600 break-words">{data?.emergency_contact_number || t("not_added")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full max-w-4xl mt-6">
                  <CardHeader>
                    <CardTitle>{t("work_details")}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">{t("experience")}</h4>
                      <p className="text-neutral-600">{data?.experience ? `${data.experience}` : t("not_added")}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">{t("preferred_vehicle_types")}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {parseVehicleTypes(data?.catagory).map((type) => (
                          <Badge key={type} variant="secondary" className="capitalize">
                            {vehicleOptions.find(opt => opt.value === type)?.label || type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                     <div>
                      <h4 className="font-medium">{t("date_of_birth")}</h4>
                      <p className="text-neutral-600">{data?.dob || t("not_added")}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{t("driving_license")}</CardTitle>
                     {/* Consider adding button to edit documents directly */}
                     <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit className="h-4 w-4"/>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                       <h4 className="font-medium text-sm text-neutral-500 mb-1">{t("license_number")}</h4>
                       <p className="text-neutral-800">{data?.dl_number || t("not_added")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center min-h-[150px] flex flex-col justify-center items-center">
                           {data?.dl_front_pic ? (
                               <img 
                               src={`${getFullImageUrl(data.dl_front_pic)}?ts=${Date.now()}`}
                               alt="DL Front"
                               className="max-h-24 object-contain mb-2"
                             />
                           ) : (
                                <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                           )}
                           <p className="text-neutral-600 text-sm">{t("front_side")}</p>
                        </div>
                         <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center min-h-[150px] flex flex-col justify-center items-center">
                           {data?.dl_back_pic ? (
                               <img src={`${getFullImageUrl(data.dl_back_pic)}?ts=${Date.now()}`} alt="DL Back" className="max-h-24 object-contain mb-2"/>
                           ) : (
                                <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                           )}
                           <p className="text-neutral-600 text-sm">{t("back_side")}</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{t("identity_proof")}</CardTitle>
                    {/* Consider adding button to edit documents directly */}
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit className="h-4 w-4"/>
                    </Button>
                  </CardHeader>
                  <CardContent>
                     <div className="mb-4">
                       <h4 className="font-medium text-sm text-neutral-500 mb-1">{t("aadhar_number")}</h4>
                       <p className="text-neutral-800">
                         {data?.aadhar_number || t("not_added")}
                         {!data?.aadhar_number && (
                           <span className="text-xs text-red-500 block mt-1">
                             {/* TODO: Add a translation key for this hint */}
                             (Aadhar number is required for full verification)
                           </span>
                         )}
                       </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center min-h-[150px] flex flex-col justify-center items-center">
                           {data?.aadhar_front_pic ? (
                               <img src={`${getFullImageUrl(data.aadhar_front_pic)}?ts=${Date.now()}`} alt="Aadhar Front" className="max-h-24 object-contain mb-2"/>
                           ) : (
                                <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                           )}
                           <p className="text-neutral-600 text-sm">{t("front_side")}</p>
                        </div>
                         <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center min-h-[150px] flex flex-col justify-center items-center">
                           {data?.aadhar_back_pic ? (
                               <img src={`${getFullImageUrl(data.aadhar_back_pic)}?ts=${Date.now()}`} alt="Aadhar Back" className="max-h-24 object-contain mb-2"/>
                           ) : (
                                <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                           )}
                           <p className="text-neutral-600 text-sm">{t("back_side")}</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TODO: Add content for Preferences tab */}
              <TabsContent value="preferences" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Preferences content here */}
                    <p>Preferences content goes here.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Profile Completion */}
            <Card className="w-full max-w-4xl mt-6">
              <CardHeader>
                <CardTitle>{t("profile_completion")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-20 text-right font-semibold">
                    {getProfileCompletionData(data).completionPercentage}%
                  </div>
                  <div className="flex-1">
                    <Progress value={getProfileCompletionData(data).completionPercentage} />
                  </div>
                </div>
                {!getProfileCompletionData(data).isProfileComplete && (
                  <div className="mt-4 text-sm text-neutral-600">
                    <p>{t("complete_profile_hint")}</p>
                    <ul className="list-disc list-inside mt-2">
                      {getProfileCompletionData(data).missingItems.map((item, index) => (
                        // TODO: Add translation keys for missing items if needed
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 <Button 
                    variant="default" 
                    className="w-full mt-4"
                    onClick={() => navigate('/driver/registration')}
                    disabled={getProfileCompletionData(data).isProfileComplete}
                >
                   {t("profile_complete")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("profile_completion")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-neutral-600">Profile Status</span>
                <Badge variant={profileStatus.completionPercentage >= 90 ? "default" : "secondary"}>
                  {profileStatus.completionPercentage}% Complete
                </Badge>
              </div>

              <Progress value={profileStatus.completionPercentage} className="h-2 mb-4" />

              {profileStatus.missingItems.length > 0 && profileStatus.completionPercentage < 100 && (
                <div className="bg-amber-50 border border-amber-100 rounded-md p-3 mb-4">
                  <h4 className="text-amber-700 font-medium text-sm flex items-center mb-2">
                    <Info className="h-4 w-4 mr-2" /> {t("profile_complete")}
                  </h4>
                  <ul className="text-amber-600 text-sm space-y-1">
                    {profileStatus.missingItems.slice(0, 3).map((item, index) => (
                      <li key={index} className="flex items-center">
                        <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                        Add your {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => setIsEditingProfile(true)}
                disabled={profileStatus.completionPercentage === 100}
              >
                {profileStatus.completionPercentage === 100 ? "Profile Complete" : "Complete Profile"}
              </Button>
            </CardContent>
          </Card> */}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("account")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid divide-y divide-neutral-100">
                  {/* <button
                    onClick={() => setAccountSettingsOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <Settings className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>Account Settings</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button> */}

                  <button
                    onClick={() => setHelpSupportOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <HelpCircle className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>{t("help_and_support")}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setNotificationSettingsOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <Bell className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>{t("notification_settings")}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setLanguageSettingsOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <Languages className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>{t("language_settings")}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center py-3 px-6 hover:bg-red-50 transition-colors duration-200 text-left w-full text-red-600"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("account_information")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid divide-y divide-neutral-100 text-sm">
                  <div className="p-4">
                    <div className="text-neutral-500 mb-1">{t("account_type")}</div>
                    <div className="capitalize">{user?.userType === 'driver' ? t('driver') : user?.userType || t("not_added")}</div>
                  </div>
                  {/* <div className="p-4">
                    <div className="text-neutral-500 mb-1">Member Since</div>
                    <div>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</div>
                  </div> */}
                  {/* <div className="p-4">
                    <div className="text-neutral-500 mb-1">Last Login</div>
                    <div>Today, 5:42 PM</div> Placeholder
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

{/* Edit Profile Dialog */}
<Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{t("edit_profile")}</DialogTitle>
      <DialogDescription>
        {t("update_profile_info")}
      </DialogDescription>
    </DialogHeader>

    <div className="grid gap-4 py-4">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("personal_information")}</h3>
        <div className="flex flex-col items-center space-y-4">
          <Label>{t("profile_picture")}</Label>
          <Avatar className="w-24 h-24">
            <AvatarFallback>{(editedProfile.name1 || data?.name1)?.slice(0, 2).toUpperCase() || <UserIcon />}</AvatarFallback>
          </Avatar>
          <Input
            id="profile_picFile"
            type="file"
            accept="image/*"
            onChange={(e) => setprofile_pic(e.target.files?.[0] || null)}
            className="text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
          />
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{t("personal_information")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name1">{t("full_name")} *</Label>
              <Input
                id="name1"
                value={editedProfile.name1 ?? (data?.name1 || "")} 
                onChange={(e) => setEditedProfile({...editedProfile, name1: e.target.value})}
                placeholder={t("enter_full_name")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email_label")}</Label>
              <Input
                id="email"
                type="email"
                value={editedProfile.email ?? (data?.email || "")}
                onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">{t("phone_number")} *</Label>
              <Input
                id="phone_number"
                value={data?.phone_number || ""}
                readOnly
                className="bg-neutral-100"
              />
              <p className="text-xs text-neutral-500">{t("contact_support_hint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_number">{t("emergency_contact")}</Label>
              <Input
                id="emergency_contact_number"
                value={editedProfile.emergency_contact_number ?? (data?.emergency_contact_number || "")}
                onChange={(e) => setEditedProfile({...editedProfile, emergency_contact_number: e.target.value})}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">{t("address")}</Label>
              <Textarea
                id="address"
                value={editedProfile.address ?? (data?.address || "")}
                onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">{t("date_of_birth")}</Label>
              <Input
                id="dob"
                type="date"
                value={editedProfile.dob ?? (data?.dob || "")}
                onChange={(e) => setEditedProfile({...editedProfile, dob: e.target.value})}
              />
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{t("professional_information")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">{t("experience")} ({t("years_label")})</Label>
              <Select
                value={editedProfile.experience ?? (data?.experience || "")}
                onValueChange={(value) => setEditedProfile({...editedProfile, experience: value})}
              >
                <SelectTrigger id="experience">
                  <SelectValue placeholder={t("select_experience_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(21)].map((_, i) => (
                    <SelectItem key={i} value={`${i}`}>
                      {i} {i === 1 ? t("year") : t("years_label")} {i === 20 && "+"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catagory">{t("preferred_vehicle_types")}</Label>
              <Select
                value={editedProfile.catagory ?? (data?.catagory || "")}
                onValueChange={(value) => {
                  const currentTypes = parseVehicleTypes(editedProfile.catagory ?? data?.catagory);
                  const newTypes = currentTypes.includes(value)
                    ? currentTypes.filter(type => type !== value)
                    : [...currentTypes, value];
                  setEditedProfile({...editedProfile, catagory: newTypes.join(',')});
                }}
              >
                <SelectTrigger id="catagory" className="min-h-[2.5rem]">
                  <SelectValue placeholder={t("select_vehicle_types_placeholder")}>
                    {parseVehicleTypes(editedProfile.catagory ?? data?.catagory).length > 0
                      ? parseVehicleTypes(editedProfile.catagory ?? data?.catagory)
                          .map(type => vehicleOptions.find(opt => opt.value === type)?.label)
                          .join(', ')
                      : t("select_vehicle_types_placeholder")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className={parseVehicleTypes(editedProfile.catagory ?? data?.catagory).includes(option.value) ? "bg-primary/10" : ""}
                    >
                      <div className="flex items-center">
                        {parseVehicleTypes(editedProfile.catagory ?? data?.catagory).includes(option.value) && (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">
                {t("selected_vehicle_types").replace("{count}", parseVehicleTypes(editedProfile.catagory ?? data?.catagory).length.toString())}
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{t("documents")}</h3>
          <div className="space-y-4 p-4 border rounded-md">
            <h4 className="font-medium">{t("driving_license")}</h4>
            <div className="space-y-2">
              <Label htmlFor="dl_number">{t("license_number")} *</Label>
              <Input
                id="dl_number"
                value={editedProfile.dl_number ?? (data?.dl_number || "")}
                onChange={(e) => setEditedProfile({...editedProfile, dl_number: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dlFrontFile">{t("front_side")} {data?.dl_front_pic && !dlFront ? `(${t("uploaded")})` : "*"}</Label>
                <Input
                  id="dlFrontFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDlFront(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {data?.dl_front_pic && !dlFront && (
                  <a href={getFullImageUrl(data?.dl_front_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    {t("view_current")}
                  </a>
                )}
                {dlFront && <p className="text-xs text-green-600">{t("new_file_selected")}: {dlFront.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dlBackFile">{t("back_side")} {data?.dl_back_pic && !dlBack ? `(${t("uploaded")})` : ""}</Label>
                <Input
                  id="dlBackFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDlBack(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {data?.dl_back_pic && !dlBack && (
                  <a href={getFullImageUrl(data?.dl_back_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    {t("view_current")}
                  </a>
                )}
                {dlBack && <p className="text-xs text-green-600">{t("new_file_selected")}: {dlBack.name}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-4 p-4 border rounded-md">
            <h4 className="font-medium">{t("aadhar_card")}</h4>
            <div className="space-y-2">
              <Label htmlFor="aadhar_number">{t("aadhar_number")} *</Label>
              <Input
                id="aadhar_number"
                ref={aadharInputRef}
                defaultValue={data?.aadhar_number || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log("Updating aadhar_number to:", value);
                  setEditedProfile(prev => ({...prev, aadhar_number: value}));
                }}
                required
              />
              <p className="text-xs text-neutral-500">
                {t("current_value")}: {editedProfile.aadhar_number !== undefined ? 
                  `"${editedProfile.aadhar_number}"` : 
                  `${t("using_data_value")}: "${data?.aadhar_number || ""}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaar_frontFile">{t("front_side")} {data?.aadhar_front_pic && !aadhaar_front ? `(${t("uploaded")})` : "*"}</Label>
                <Input
                  id="aadhaar_frontFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setaadhaar_front(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {data?.aadhar_front_pic && !aadhaar_front && (
                  <a href={getFullImageUrl(data?.aadhar_front_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    {t("view_current")}
                  </a>
                )}
                {aadhaar_front && <p className="text-xs text-green-600">{t("new_file_selected")}: {aadhaar_front.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar_backFile">{t("back_side")} {data?.aadhar_back_pic && !aadhaar_back ? `(${t("uploaded")})` : ""}</Label>
                <Input
                  id="aadhaar_backFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setaadhaar_back(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {data?.aadhar_back_pic && !aadhaar_back && (
                  <a href={getFullImageUrl(data?.aadhar_back_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    {t("view_current")}
                  </a>
                )}
                {aadhaar_back && <p className="text-xs text-green-600">{t("new_file_selected")}: {aadhaar_back.name}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => {
        setIsEditingProfile(false);
        setEditedProfile({});
      }} disabled={isUpdatingProfile}>
        {t("cancel_button")}
      </Button>
      <Button
        onClick={() => handleProfileUpdate(editedProfile)}
        disabled={
          isUpdatingProfile ||
          !Object.keys(editedProfile).some(key => editedProfile[key as keyof UserProfile] !== profile[key as keyof UserProfile])
        }
      >
        {isUpdatingProfile ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("saving")}
          </>
        ) : (
          t("save_changes_button")
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>



      {/* Help & Support Dialog (Structure Only) */}
      <Dialog open={helpSupportOpen} onOpenChange={setHelpSupportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("help_and_support")}</DialogTitle>
            <DialogDescription>
              {t("get_assistance_and_support")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <a 
               href="https://wa.me/17864607364" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-start w-full px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
             >
               <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
               </svg>
               {t("contact_support")}
             </a>
             <Separator />
             <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
              <h4 className="font-medium mb-2">{t("customer_support_heading")}</h4>
              <p className="text-sm text-neutral-600 mb-2">
                {t("immediate_assistance_text")}
              </p>
              <p className="text-sm font-medium">
                {t("helpline_label")} +91 8700235212
              </p>
              <p className="text-sm text-neutral-600">
                {t("email_label")} info@signo.in
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHelpSupportOpen(false)}>
              {t("close_button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={notificationSettingsOpen} onOpenChange={setNotificationSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("notification_settings")}</DialogTitle>
            <DialogDescription>
              {t("manage_notifications_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="space-y-1">
                <Label htmlFor="email-notifications" className="text-base">{t("email_notifications_label")}</Label>
                <p className="text-sm text-neutral-500">{t("receive_updates_email_text")}</p>
              </div>
              <Switch 
                id="email-notifications"
                checked={notificationPreferences.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="space-y-1">
                <Label htmlFor="sms-notifications" className="text-base">{t("sms_notifications_label")}</Label>
                <p className="text-sm text-neutral-500">{t("receive_updates_sms_text")}</p>
              </div>
              <Switch 
                id="sms-notifications"
                checked={notificationPreferences.sms}
                onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationSettingsOpen(false)}>
              {t("cancel_button")}
            </Button>
            <Button onClick={() => {
              // Here you would typically save the preferences to your backend
              toast({
                title: "Success",
                description: "Notification preferences updated successfully"
              });
              setNotificationSettingsOpen(false);
            }}>
              {t("save_changes_button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Settings Dialog (Structure Only) */}
      <Dialog open={languageSettingsOpen} onOpenChange={setLanguageSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("language_settings")}</DialogTitle>
            <DialogDescription>
              {t("choose_language_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             {/* Placeholder content */}
             <div className="flex items-center space-x-2 p-2 border rounded">
                <input type="radio" id="lang-en-ph" name="language-ph" defaultChecked disabled/>
                <Label htmlFor="lang-en-ph">{t("english_language_option")}</Label>
             </div>
             <div className="flex items-center space-x-2 p-2 border rounded">
                <input type="radio" id="lang-hi-ph" name="language-ph" disabled/>
                <Label htmlFor="lang-hi-ph">{t("hindi_language_option")}</Label>
             </div>
             <p className="text-center text-neutral-500 text-sm">{t("more_languages_coming_soon")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLanguageSettingsOpen(false)}>
              {t("cancel_button")}
            </Button>
            <Button onClick={() => setLanguageSettingsOpen(false)} disabled>
              {t("save_changes_button")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation userType="driver" />
      <Chatbot />
    </div>
  );
};

export default DriverProfilePage;