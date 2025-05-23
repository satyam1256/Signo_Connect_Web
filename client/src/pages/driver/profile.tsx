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
  Loader2
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
                    Edit Profile
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
                    <h2 className="text-2xl font-bold mb-1">{(data?.name1 || "Driver Name").toUpperCase()}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center text-neutral-600 gap-1 sm:gap-4 mb-4 flex-wrap">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>Driver {data?.experience ? `• ${data?.experience} years exp` : " "}</span>
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
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Phone Number</h4>
                          <p className="text-neutral-600 break-words">{data?.phone_number || "Not added"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Mail className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Email Address</h4>
                          <p className="text-neutral-600 break-words">{data?.email || "Not added"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Address</h4>
                          <p className="text-neutral-600 break-words">{data?.address || "Not added"}</p>
                        </div>
                      </div>

                       <div className="flex items-start">
                        <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">Emergency Contact</h4>
                          <p className="text-neutral-600 break-words">{data?.emergency_contact_number || "Not added"}</p>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Work Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Experience</h4>
                        <p className="text-neutral-600">{data?.experience ? `${data.experience}` : "Not added"}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Preferred Vehicle Type</h4>
                        <p className="text-neutral-600 capitalize">{data?.catagory || "Not specified"}</p>
                      </div>
                       <div>
                        <h4 className="font-medium">Date of Birth</h4>
                        <p className="text-neutral-600">{data?.dob || "Not added"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Driving License</CardTitle>
                     {/* Consider adding button to edit documents directly */}
                     <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit className="h-4 w-4"/>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                       <h4 className="font-medium text-sm text-neutral-500 mb-1">License Number</h4>
                       <p className="text-neutral-800">{data?.dl_number || "Not added"}</p>
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
                           <p className="text-neutral-600 text-sm">Front Side</p>
                        </div>
                         <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center min-h-[150px] flex flex-col justify-center items-center">
                           {data?.dl_back_pic ? (
                               <img src={`${getFullImageUrl(data.dl_back_pic)}?ts=${Date.now()}`} alt="DL Back" className="max-h-24 object-contain mb-2"/>
                           ) : (
                                <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                           )}
                           <p className="text-neutral-600 text-sm">Back Side</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Aadhar Card</CardTitle>
                    {/* Consider adding button to edit documents directly */}
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                        <Edit className="h-4 w-4"/>
                    </Button>
                  </CardHeader>
                  <CardContent>
                     <div className="mb-4">
                       <h4 className="font-medium text-sm text-neutral-500 mb-1">Aadhar Number</h4>
                       <p className="text-neutral-800">
                         {data?.aadhar_number || "Not added"}
                         {!data?.aadhar_number && (
                           <span className="text-xs text-red-500 block mt-1">
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
                           <p className="text-neutral-600 text-sm">Front Side</p>
                        </div>
                         <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center min-h-[150px] flex flex-col justify-center items-center">
                           {data?.aadhar_back_pic ? (
                               <img src={`${getFullImageUrl(data.aadhar_back_pic)}?ts=${Date.now()}`} alt="Aadhar Back" className="max-h-24 object-contain mb-2"/>
                           ) : (
                                <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                           )}
                           <p className="text-neutral-600 text-sm">Back Side</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Placeholder - Preferences Tab Content Needs State Management */}
              <TabsContent value="preferences" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Settings</CardTitle>
                    {/* Add button to open Notification Settings Dialog */}
                     <Button variant="ghost" size="sm" onClick={() => setNotificationSettingsOpen(true)}>
                        <Settings className="h-4 w-4"/>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-500 text-sm">Manage your notification preferences (job alerts, app updates, etc.) in the settings.</p>
                    {/* Optionally show current status if fetched */}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy Settings</CardTitle>
                    {/* Add button to open relevant section in Account Settings? */}
                  </CardHeader>
                  <CardContent>
                     <p className="text-neutral-500 text-sm">Manage profile visibility and data sharing options in account settings.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Completion</CardTitle>
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
                    <Info className="h-4 w-4 mr-2" /> Complete your profile
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
          </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid divide-y divide-neutral-100">
                  <button
                    onClick={() => setAccountSettingsOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <Settings className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>Account Settings</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setHelpSupportOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <HelpCircle className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>Help & Support</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setNotificationSettingsOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <Bell className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>Notification Settings</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={() => setLanguageSettingsOpen(true)}
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full"
                  >
                    <Languages className="h-5 w-5 mr-3 text-neutral-500" />
                    <span>Language Settings</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center py-3 px-6 hover:bg-red-50 transition-colors duration-200 text-left w-full text-red-600"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Logout</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid divide-y divide-neutral-100 text-sm">
                  <div className="p-4">
                    <div className="text-neutral-500 mb-1">Account Type</div>
                    <div className="capitalize">{user?.userType || "N/A"}</div>
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
      <Dialog open={isEditingProfile} onOpenChange={(open) => {
        if (!open) {
          // When dialog is closed, reset the edited profile state
          setEditedProfile({});
          setIsEditingProfile(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Ensure all details are accurate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
               <Label>Profile Picture</Label>
              <Avatar className="w-24 h-24">
                <AvatarFallback>{(editedProfile.name1 || data?.name1)?.slice(0, 2).toUpperCase() || <UserIcon />}</AvatarFallback>
              </Avatar>
               <Input
                 id="profile_picFile"
                 type="file"
                 accept="image/*"
                 onChange={
                  (e) => setprofile_pic(e.target.files?.[0] || null)
                }
                 className="text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
               />
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name1">Full Name *</Label>
                  <Input
                    id="name1"
                    value={editedProfile.name1 ?? (data?.name1 || "")} 
                    onChange={(e) => setEditedProfile({...editedProfile, name1: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email ?? (data?.email || "")}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={data?.phone_number || ""}
                    readOnly
                    className="bg-neutral-100"
                  />
                   <p className="text-xs text-neutral-500">Contact support to update phone number.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_number">Emergency Contact</Label>
                  <Input
                    id="emergency_contact_number"
                    value={editedProfile.emergency_contact_number ?? (data?.emergency_contact_number || "")}
                    onChange={(e) => setEditedProfile({...editedProfile, emergency_contact_number: e.target.value})}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={editedProfile.address ?? (data?.address || "")}
                    onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
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
              <h3 className="font-medium text-lg">Professional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Select
                    value={editedProfile.experience ?? (data?.experience || "")}
                    onValueChange={(value) => setEditedProfile({...editedProfile, experience: value})}
                  >
                    <SelectTrigger id="experience">
                      <SelectValue placeholder="Select years of experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 years</SelectItem>
                      <SelectItem value="1">1 year</SelectItem>
                      <SelectItem value="2">2 years</SelectItem>
                      <SelectItem value="3">3 years</SelectItem>
                      <SelectItem value="4">4 years</SelectItem>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="6">6 years</SelectItem>
                      <SelectItem value="7">7 years</SelectItem>
                      <SelectItem value="8">8 years</SelectItem>
                      <SelectItem value="9">9 years</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                      <SelectItem value="11">11 years</SelectItem>
                      <SelectItem value="12">12 years</SelectItem>
                      <SelectItem value="13">13 years</SelectItem>
                      <SelectItem value="14">14 years</SelectItem>
                      <SelectItem value="15">15 years</SelectItem>
                      <SelectItem value="16">16 years</SelectItem>
                      <SelectItem value="17">17 years</SelectItem>
                      <SelectItem value="18">18 years</SelectItem>
                      <SelectItem value="19">19 years</SelectItem>
                      <SelectItem value="20">20+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catagory">Preferred Vehicle Type</Label>
                  <Select
                    value={editedProfile.catagory ?? (data?.catagory || "")}
                    onValueChange={(value) => setEditedProfile({...editedProfile, catagory: value})}
                  >
                    <SelectTrigger id="catagory">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heavy">Heavy Vehicle</SelectItem>
                      <SelectItem value="medium">Medium Vehicle</SelectItem>
                      <SelectItem value="light">Light Vehicle</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
             <Separator />
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Documents</h3>
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-medium">Driving License</h4>
                <div className="space-y-2">
                  <Label htmlFor="dl_number">License Number *</Label>
                  <Input
                    id="dl_number"
                    value={editedProfile.dl_number ?? (data?.dl_number || "")}
                    onChange={(e) => setEditedProfile({...editedProfile, dl_number: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dlFrontFile">Front Side {data?.dl_front_pic && !dlFront ? "(Uploaded)" : "*"}</Label>
                    <Input
                      id="dlFrontFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setDlFront(e.target.files?.[0] || null)}
                       className="text-sm"
                    />
                    {data?.dl_front_pic && !dlFront && (
                      <a href={getFullImageUrl(data?.dl_front_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View current</a>
                    )}
                     {dlFront && <p className="text-xs text-green-600">New file selected: {dlFront.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dlBackFile">Back Side {data?.dl_back_pic && !dlBack ? "(Uploaded)" : ""}</Label>
                    <Input
                      id="dlBackFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setDlBack(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                     {data?.dl_back_pic && !dlBack && (
                       <a href={getFullImageUrl(data?.dl_back_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View current</a>
                    )}
                     {dlBack && <p className="text-xs text-green-600">New file selected: {dlBack.name}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-4 border rounded-md">
                <h4 className="font-medium">Aadhar Card</h4>
                <div className="space-y-2">
                  <Label htmlFor="aadhar_number">Aadhar Number *</Label>
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
                  {/* Debug info */}
                  <p className="text-xs text-neutral-500">
                    Current value: {editedProfile.aadhar_number !== undefined ? 
                      `"${editedProfile.aadhar_number}"` : 
                      `Using data value: "${data?.aadhar_number || ""}"`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhaar_frontFile">Front Side {data?.aadhar_front_pic && !aadhaar_front ? "(Uploaded)" : "*"}</Label>
                    <Input
                      id="aadhaar_frontFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setaadhaar_front(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                     {data?.aadhar_front_pic && !aadhaar_front && (
                       <a href={getFullImageUrl(data?.aadhar_front_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View current</a>
                    )}
                     {aadhaar_front && <p className="text-xs text-green-600">New file selected: {aadhaar_front.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadhaar_backFile">Back Side {data?.aadhar_back_pic && !aadhaar_back ? "(Uploaded)" : ""}</Label>
                    <Input
                      id="aadhaar_backFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setaadhaar_back(e.target.files?.[0] || null)}
                       className="text-sm"
                    />
                    {data?.aadhar_back_pic && !aadhaar_back && (
                      <a href={getFullImageUrl(data?.aadhar_back_pic)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View current</a>
                    )}
                     {aadhaar_back && <p className="text-xs text-green-600">New file selected: {aadhaar_back.name}</p>}
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
              Cancel
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* Account Settings Dialog (Structure Only) */}
      <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences. (Functionality not implemented)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             {/* Placeholder content */}
             <p className="text-center text-neutral-500">Account settings options will appear here.</p>
             <Separator />
             <Button variant="outline" className="w-full justify-start">Change Password (Placeholder)</Button>
             <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50">Deactivate Account (Placeholder)</Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setAccountSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog (Structure Only) */}
      <Dialog open={helpSupportOpen} onOpenChange={setHelpSupportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get assistance and support.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             {/* Placeholder content */}
             <Button variant="outline" className="w-full justify-start">FAQ (Placeholder)</Button>
             <Button variant="outline" className="w-full justify-start">Contact Support (Placeholder)</Button>
             <Separator />
             <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
              <h4 className="font-medium mb-2">Customer Support</h4>
              <p className="text-sm text-neutral-600 mb-2">
                Need immediate assistance? Our team is available 24/7 to help you.
              </p>
              <p className="text-sm font-medium">
                Helpline: +91 1800-123-4567
              </p>
              <p className="text-sm text-neutral-600">
                Email: support@signo-connect.com
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHelpSupportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog (Structure Only) */}
      <Dialog open={notificationSettingsOpen} onOpenChange={setNotificationSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Manage how you receive notifications. (Functionality not implemented)
            </DialogDescription>
          </DialogHeader>
           <div className="py-4 space-y-4">
             {/* Placeholder content */}
             <div className="flex items-center justify-between p-2 border rounded">
                <Label htmlFor="placeholder-notif">Email Notifications</Label>
                <Switch id="placeholder-notif" disabled/>
             </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <Label htmlFor="placeholder-notif-2">SMS Notifications</Label>
                <Switch id="placeholder-notif-2" disabled/>
             </div>
              <p className="text-center text-neutral-500 text-sm">Full settings management coming soon.</p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setNotificationSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setNotificationSettingsOpen(false)} disabled>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Settings Dialog (Structure Only) */}
      <Dialog open={languageSettingsOpen} onOpenChange={setLanguageSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Language Settings</DialogTitle>
            <DialogDescription>
              Choose your preferred language. (Functionality not implemented)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             {/* Placeholder content */}
             <div className="flex items-center space-x-2 p-2 border rounded">
                <input type="radio" id="lang-en-ph" name="language-ph" defaultChecked disabled/>
                <Label htmlFor="lang-en-ph">English</Label>
             </div>
             <div className="flex items-center space-x-2 p-2 border rounded">
                <input type="radio" id="lang-hi-ph" name="language-ph" disabled/>
                <Label htmlFor="lang-hi-ph">हिंदी (Hindi)</Label>
             </div>
             <p className="text-center text-neutral-500 text-sm">More languages and settings coming soon.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLanguageSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setLanguageSettingsOpen(false)} disabled>
              Save Changes
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