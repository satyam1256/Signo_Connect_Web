import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  User,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User as UserType, Driver } from "@shared/schema";

// Extended profile interface that combines DB data with UI requirements
interface UserProfile {
  fullName: string;
  phoneNumber: string;
  email?: string;
  language: string;
  location: string;
  about: string;
  profileImage?: string;
  // Driver specific
  experience: string;
  preferredLocations: string[];
  vehicleTypes: string[];
  drivingLicense: string | null;
  identityProof: string | null;
  availability: 'full-time' | 'part-time' | 'weekends';
  skills: string[];
  joinedDate: string;
  completionPercentage: number;
}

// Interface for profile update data including files
interface ProfileUpdateData {
  // Partial of UserProfile except profileImage which will be handled separately 
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  language?: string;
  location?: string;
  about?: string;
  experience?: string;
  preferredLocations?: string[];
  vehicleTypes?: string[];
  drivingLicense?: string | null;
  identityProof?: string | null;
  availability?: 'full-time' | 'part-time' | 'weekends';
  skills?: string[];
  joinedDate?: string;
  completionPercentage?: number;
  
  // File uploads
  profileImage?: File | null;
  licenseFile?: File | null;
  identityFile?: File | null;
}

// API response type for user profile data
interface UserProfileResponse {
  user: UserType;
  profile: Driver | null;
}

const DriverProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Try to get saved profile data from localStorage first
  const savedProfile = localStorage.getItem("driverProfile");
  let initialProfile: UserProfile = {
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    email: user?.email || "",
    language: "English",
    location: "",
    about: "Professional driver looking for opportunities",
    experience: "1+ years",
    preferredLocations: [],
    vehicleTypes: ["Heavy Vehicle"],
    drivingLicense: null,
    identityProof: null,
    availability: "full-time",
    skills: ["Driving"],
    joinedDate: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    completionPercentage: 20
  };
  
  // If we have a saved profile, use it instead
  if (savedProfile) {
    try {
      const parsedProfile = JSON.parse(savedProfile);
      initialProfile = { ...initialProfile, ...parsedProfile };
      console.log("Loaded saved profile from localStorage", initialProfile);
    } catch (error) {
      console.error("Failed to parse saved profile:", error);
      localStorage.removeItem("driverProfile");
    }
  }
  
  // Initialize profile state with either saved or default data
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  // Fetch real user data from API
  const { data: userData, isLoading } = useQuery<UserProfileResponse>({
    queryKey: ['/api/user', user?.id],
    enabled: !!user?.id
  });
  
  // Effect to update profile when user data is loaded
  useEffect(() => {
    if (userData?.user) {
      // Initialize profile with data from API
      const driverProfile = userData.profile;
      
      setProfile(prevProfile => {
        // Create updated profile by merging previously saved data with API data
        const updatedProfile = {
          ...prevProfile,
          fullName: userData.user.fullName,
          phoneNumber: userData.user.phoneNumber,
          email: userData.user.email || prevProfile.email || "",
          location: prevProfile.location, // Location is stored locally, not in DB schema
          // If driver profile exists, update with real data
          preferredLocations: driverProfile?.preferredLocations || prevProfile.preferredLocations || [],
          vehicleTypes: driverProfile?.vehicleTypes || prevProfile.vehicleTypes,
          experience: driverProfile?.experience || prevProfile.experience,
          drivingLicense: driverProfile?.drivingLicense || prevProfile.drivingLicense,
          identityProof: driverProfile?.identityProof || prevProfile.identityProof,
          // Calculate profile completion percentage
          completionPercentage: calculateProfileCompletion(userData.user, driverProfile)
        };
        
        // Save the merged profile to localStorage for persistence
        localStorage.setItem("driverProfile", JSON.stringify(updatedProfile));
        
        console.log("Updated profile with API data:", updatedProfile);
        
        // Also update auth context if email changed
        if (updatedProfile.email && updatedProfile.email !== userData.user.email) {
          updateUser({ email: updatedProfile.email });
        }
        
        return updatedProfile;
      });
    }
  }, [userData, updateUser]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  
  // Calculate profile completion percentage
  const calculateProfileCompletion = (user: UserType, driverProfile: Driver | null): number => {
    let total = 0;
    let completed = 0;
    
    // User basic info
    total += 3;
    if (user.fullName) completed += 1;
    if (user.phoneNumber) completed += 1;
    if (user.email) completed += 1;
    
    // Driver specific info
    total += 4;
    if (driverProfile?.preferredLocations?.length) completed += 1;
    if (driverProfile?.drivingLicense) completed += 2;
    if (driverProfile?.identityProof) completed += 1;
    
    return Math.round((completed / total) * 100);
  };

  // Dialog states
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [languageSettingsOpen, setLanguageSettingsOpen] = useState(false);

  // Mutation for updating driver profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      if (!user?.id) throw new Error("User ID is required");
      
      console.log("Updating profile with data:", data);
      
      // Handle file uploads first
      let profileImageUrl = profile.profileImage;
      if (data.profileImage) {
        // In a real implementation, we would upload the file to a storage service
        // and get back a URL. For now, we'll create a data URL for demonstration.
        profileImageUrl = await fileToDataUrl(data.profileImage);
      }

      let drivingLicenseDoc = profile.drivingLicense;
      if (data.licenseFile) {
        // In a real app, we'd upload this file to storage and get a URL back
        // Here we just update the license number with file name for demo
        drivingLicenseDoc = data.drivingLicense || `License-${data.licenseFile.name}`;
      }

      let identityProofDoc = profile.identityProof;
      if (data.identityFile) {
        // In a real app, we'd upload this file to storage and get a URL back
        // Here we just update the identity proof with file name for demo
        identityProofDoc = data.identityProof || `ID-${data.identityFile.name}`;
      }
      
      // Create a driver profile update object with the data from form
      const driverProfileData = {
        userId: user.id,
        preferredLocations: data.preferredLocations || profile.preferredLocations,
        drivingLicense: drivingLicenseDoc,
        identityProof: identityProofDoc,
        profileImage: profileImageUrl,
        about: data.about || profile.about,
        email: data.email || profile.email,
        location: data.location || profile.location,
        experience: data.experience || profile.experience,
        vehicleTypes: data.vehicleTypes || profile.vehicleTypes
      };
      
      console.log("Sending profile data to server:", driverProfileData);
      
      const response = await apiRequest("POST", "/api/driver-profile", driverProfileData);
      const responseData = await response.json();
      console.log("Server response:", responseData);
      return responseData;
    },
    onSuccess: (responseData) => {
      console.log("Profile update successful:", responseData);
      
      // Update profile locally before query invalidation to prevent flicker
      const updatedProfile = {
        ...profile,
        ...responseData,
        // Ensure we handle specific fields that might be in the response
        drivingLicense: responseData.drivingLicense || profile.drivingLicense,
        identityProof: responseData.identityProof || profile.identityProof,
        email: responseData.email || profile.email,
        profileImage: responseData.profileImage || profile.profileImage,
        about: responseData.about || profile.about,
        preferredLocations: responseData.preferredLocations || profile.preferredLocations,
        location: responseData.location || profile.location,
        experience: responseData.experience || profile.experience,
        vehicleTypes: responseData.vehicleTypes || profile.vehicleTypes,
      };
      
      // Update completion percentage
      if (user) {
        // Create a user compatible with UserType from schema (DB type)
        const userForCalculation: UserType = {
          id: user.id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          userType: user.userType,
          email: updatedProfile.email || null,
          // Additional fields required by UserType schema but not by auth User
          language: null, // Set to null as it's optional in schema
          profileCompleted: user.profileCompleted || false,
          createdAt: null // Not needed for calculation
        };
        
        // Pass Driver compatible object
        const driverForCalculation = responseData ? {
          id: responseData.id || 0,
          userId: user.id,
          preferredLocations: updatedProfile.preferredLocations || [],
          drivingLicense: updatedProfile.drivingLicense || null,
          identityProof: updatedProfile.identityProof || null,
          experience: updatedProfile.experience || null,
          vehicleTypes: updatedProfile.vehicleTypes || []
        } : null;
        
        updatedProfile.completionPercentage = calculateProfileCompletion(
          userForCalculation,
          driverForCalculation
        );
      }
      
      // Update local state immediately
      setProfile(updatedProfile);
      
      // Update email in auth context if it has changed
      if (responseData.email && responseData.email !== user?.email) {
        updateUser({ email: responseData.email });
      }
      
      // Save profile to localStorage for persistence between page changes
      localStorage.setItem("driverProfile", JSON.stringify(updatedProfile));
      
      // Then invalidate query to refresh from server
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id] });
      
      // Reset file state
      setProfileImage(null);
      setLicenseFile(null);
      setIdentityFile(null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Helper function to convert File to data URL for profile images
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle profile update
  const handleProfileUpdate = () => {
    // Check for required fields
    const fieldValidation = {
      email: editedProfile.email || profile.email,
      drivingLicense: (editedProfile.drivingLicense || profile.drivingLicense) || licenseFile !== null,
      identityProof: (editedProfile.identityProof || profile.identityProof) || identityFile !== null,
      about: editedProfile.about || profile.about
    };

    const missingRequiredFields = Object.entries(fieldValidation)
      .filter(([_, value]) => !value)
      .map(([key]) => key === 'drivingLicense' ? 'Driving License' : 
                       key === 'identityProof' ? 'Identity Proof' : 
                       key === 'about' ? 'About Section' : 
                       key.charAt(0).toUpperCase() + key.slice(1));

    if (missingRequiredFields.length > 0) {
      toast({
        title: "Required fields missing",
        description: `Please complete these fields: ${missingRequiredFields.join(", ")}`,
        variant: "destructive"
      });
      return; // Don't save the profile if required fields are missing
    }

    // Prepare data for update
    const hasChanges = Object.keys(editedProfile).length > 0 || 
                       profileImage !== null || 
                       licenseFile !== null || 
                       identityFile !== null;

    if (hasChanges) {
      // Show loading toast
      const loadingToast = toast({
        title: "Updating profile",
        description: "Your profile is being updated...",
      });
      
      // Save to server - include files in the mutation
      updateProfileMutation.mutate({
        ...editedProfile,
        profileImage: profileImage,
        licenseFile: licenseFile,
        identityFile: identityFile
      });

      // Clear the edited profile
      setEditedProfile({});
    }

    setIsEditingProfile(false);
  };

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const missingItems: string[] = [];
  if (!profile.email) missingItems.push("Email");
  if (!profile.drivingLicense) missingItems.push("Driving License");
  if (!profile.identityProof) missingItems.push("Identity Proof");
  if (!profile.about) missingItems.push("About Section");

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-neutral-600">Loading profile...</p>
      </div>
    );
  }

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
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 relative">
                  <div className="absolute -top-12 left-6">
                    <Avatar className="w-24 h-24 border-4 border-white">
                      <AvatarImage src={profile.profileImage} alt={profile.fullName} />
                      <AvatarFallback className="text-2xl bg-primary text-white">
                        {profile.fullName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="pt-16">
                    <h2 className="text-2xl font-bold mb-1">{profile.fullName}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center text-neutral-600 gap-1 sm:gap-4 mb-4">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>Driver • {profile.experience}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{profile.location}</span>
                      </div>
                    </div>

                    <p className="text-neutral-600 mb-4">{profile.about}</p>

                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-neutral-100">
                          {skill}
                        </Badge>
                      ))}
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
                        <Phone className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Phone Number</h4>
                          <p className="text-neutral-600">{profile.phoneNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Mail className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Email Address</h4>
                          <p className="text-neutral-600">{profile.email || "Not added"}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Current Location</h4>
                          <p className="text-neutral-600">{profile.location}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Languages className="h-5 w-5 mr-3 text-neutral-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Preferred Language</h4>
                          <p className="text-neutral-600">{profile.language}</p>
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
                        <p className="text-neutral-600">{profile.experience}</p>
                      </div>

                      <div>
                        <h4 className="font-medium">Availability</h4>
                        <p className="text-neutral-600 capitalize">{profile.availability.replace('-', ' ')}</p>
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <h4 className="font-medium">Preferred Locations</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.preferredLocations.map((location, index) => (
                            <Badge key={index} variant="outline">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <h4 className="font-medium">Vehicle Types</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.vehicleTypes.map((type, index) => (
                            <Badge key={index} variant="outline">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Driving License</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-3 text-neutral-500" />
                        <div>
                          <h4 className="font-medium">License Number</h4>
                          <p className="text-neutral-600">{profile.drivingLicense || "Not added"}</p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Document
                      </Button>
                    </div>

                    <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                      <p className="text-neutral-600 mb-2">License document uploaded</p>
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Identity Proof</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-3 text-neutral-500" />
                        <div>
                          <h4 className="font-medium">ID Number</h4>
                          <p className="text-neutral-600">{profile.identityProof || "Not added"}</p>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Document
                      </Button>
                    </div>

                    <div className="border border-dashed border-neutral-300 bg-neutral-50 rounded-md p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                      <p className="text-neutral-600 mb-2">Identity document uploaded</p>
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="job-alerts" className="font-medium">Job Alerts</Label>
                          <p className="text-sm text-neutral-500">Receive alerts for new job matches</p>
                        </div>
                        <Switch id="job-alerts" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="app-updates" className="font-medium">Application Updates</Label>
                          <p className="text-sm text-neutral-500">Updates about your job applications</p>
                        </div>
                        <Switch id="app-updates" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifs" className="font-medium">Email Notifications</Label>
                          <p className="text-sm text-neutral-500">Receive notifications via email</p>
                        </div>
                        <Switch id="email-notifs" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifs" className="font-medium">SMS Notifications</Label>
                          <p className="text-sm text-neutral-500">Receive notifications via SMS</p>
                        </div>
                        <Switch id="sms-notifs" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="profile-visibility" className="font-medium">Profile Visibility</Label>
                          <p className="text-sm text-neutral-500">Make your profile visible to all companies</p>
                        </div>
                        <Switch id="profile-visibility" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="contact-info" className="font-medium">Contact Information</Label>
                          <p className="text-sm text-neutral-500">Show contact info to companies you apply to</p>
                        </div>
                        <Switch id="contact-info" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="location-sharing" className="font-medium">Location Sharing</Label>
                          <p className="text-sm text-neutral-500">Share your approximate location</p>
                        </div>
                        <Switch id="location-sharing" defaultChecked />
                      </div>
                    </div>
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
                  <Badge variant={profile.completionPercentage >= 90 ? "default" : "outline"}>
                    {profile.completionPercentage}% Complete
                  </Badge>
                </div>
                <Progress value={profile.completionPercentage} className="h-2 mb-4" />

                {missingItems.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-md p-3 mb-4">
                    <h4 className="text-amber-700 font-medium text-sm flex items-center mb-2">
                      <Info className="h-4 w-4 mr-2" /> Complete your profile
                    </h4>
                    <ul className="text-amber-600 text-sm space-y-1">
                      {missingItems.map((item, index) => (
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
                  onClick={() => {
                    if (missingItems.length > 0) {
                      toast({
                        title: "Required fields missing",
                        description: `Please complete these fields: ${missingItems.join(", ")}`,
                        variant: "destructive"
                      });
                    }
                    setIsEditingProfile(true);
                  }}
                >
                  Complete Profile
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
                    className="flex items-center py-3 px-6 hover:bg-neutral-50 transition-colors duration-200 text-left w-full text-red-600"
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
                    <div className="text-neutral-500 mb-1">Member Since</div>
                    <div>{profile.joinedDate}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-neutral-500 mb-1">Account Type</div>
                    <div>Driver</div>
                  </div>
                  <div className="p-4">
                    <div className="text-neutral-500 mb-1">Last Login</div>
                    <div>Today, 5:42 PM</div>
                  </div>
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
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Personal Information</h3>

              <div className="flex flex-col items-center mb-6">
                <Avatar className="w-24 h-24 border-4 border-white mb-2">
                  <AvatarImage src={profile.profileImage} alt={profile.fullName} />
                  <AvatarFallback className="text-2xl bg-primary text-white">
                    {profile.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <FileUpload 
                  title="Profile Picture"
                  buttonText="Upload Image"
                  accepted="image/*"
                  onChange={setProfileImage}
                  value={profileImage}
                  helpText="JPEG, PNG files up to 5MB"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    defaultValue={profile.fullName}
                    onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue={profile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    id="phoneNumber" 
                    defaultValue={profile.phoneNumber}
                    onChange={(e) => setEditedProfile({...editedProfile, phoneNumber: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Current Location</Label>
                  <Input 
                    id="location" 
                    defaultValue={profile.location}
                    onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About</Label>
                <Textarea 
                  id="about" 
                  rows={4}
                  defaultValue={profile.about}
                  onChange={(e) => setEditedProfile({...editedProfile, about: e.target.value})}
                  placeholder="Tell employers about your experience and skills"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Professional Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <select
                    id="experience"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    defaultValue={profile.experience}
                    onChange={(e) => setEditedProfile({...editedProfile, experience: e.target.value})}
                  >
                    {Array.from({ length: 20 }, (_, i) => (
                      <option key={i + 1} value={`${i + 1}+ years`}>{i + 1}+ years</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <select
                    id="availability"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    defaultValue={profile.availability}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      availability: e.target.value as 'full-time' | 'part-time' | 'weekends'
                    })}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                </div>



                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label htmlFor="vehicleTypes">Vehicle Types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {["Heavy Vehicle", "Light Vehicle", "Truck", "Bus", "Delivery Van", "Pickup Truck"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`vehicle-${type.toLowerCase().replace(/\s+/g, '-')}`}
                          checked={(editedProfile.vehicleTypes || profile.vehicleTypes || []).includes(type)}
                          onCheckedChange={(checked: boolean) => {
                            const currentTypes = editedProfile.vehicleTypes || profile.vehicleTypes || [];
                            // Check if type already exists to avoid duplicates
                            const newTypes = checked 
                              ? (currentTypes.includes(type) ? currentTypes : [...currentTypes, type])
                              : currentTypes.filter(t => t !== type);
                            setEditedProfile({...editedProfile, vehicleTypes: newTypes});
                          }}
                        />
                        <label 
                          htmlFor={`vehicle-${type.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Document Information</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="drivingLicense">Driving License Number</Label>
                  <Input 
                    id="drivingLicense" 
                    defaultValue={profile.drivingLicense || ""}
                    onChange={(e) => setEditedProfile({...editedProfile, drivingLicense: e.target.value})}
                  />
                </div>

                <FileUpload 
                  title="Driving License"
                  buttonText="Upload License"
                  accepted=".pdf,.jpg,.jpeg,.png"
                  onChange={setLicenseFile}
                  value={licenseFile}
                  helpText="Upload a clear photo or scan of your license"
                />

                <div className="space-y-2">
                  <Label htmlFor="identityProof">Identity Proof Number</Label>
                  <Input 
                    id="identityProof" 
                    defaultValue={profile.identityProof || ""}
                    onChange={(e) => setEditedProfile({...editedProfile, identityProof: e.target.value})}
                  />
                </div>

                <FileUpload 
                  title="Identity Proof"
                  buttonText="Upload Document"
                  accepted=".pdf,.jpg,.jpeg,.png"
                  onChange={setIdentityFile}
                  value={identityFile}
                  helpText="Upload Aadhaar, PAN, or Voter ID"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button onClick={handleProfileUpdate}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Settings Dialog */}
      <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <h3 className="font-medium">Security Settings</h3>

              <div className="grid gap-3">
                <Button variant="outline" className="justify-start">
                  <Truck className="h-4 w-4 mr-3" />
                  Change Password
                </Button>

                <Button variant="outline" className="justify-start">
                  <Shield className="h-4 w-4 mr-3" />
                  Two-Factor Authentication
                </Button>

                <Button variant="outline" className="justify-start">
                  <Phone className="h-4 w-4 mr-3" />
                  Update Phone Number
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Account Management</h3>

              <div className="grid gap-3">
                <Button variant="outline" className="justify-start">
                  <Mail className="h-4 w-4 mr-3" />
                  Update Email Address
                </Button>

                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-3" />
                  Export Personal Data
                </Button>

                <Button variant="outline" className="justify-start text-red-600 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-3" />
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setAccountSettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={helpSupportOpen} onOpenChange={setHelpSupportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>
              Get assistance and support
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <div className="grid gap-3">
                <Button variant="outline" className="justify-start">
                  <HelpCircle className="h-4 w-4 mr-3" />
                  Frequently Asked Questions
                </Button>

                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-3" />
                  User Guide
                </Button>

                <Button variant="outline" className="justify-start">
                  <Phone className="h-4 w-4 mr-3" />
                  Contact Support
                </Button>

                <Button variant="outline" className="justify-start">
                  <Info className="h-4 w-4 mr-3" />
                  Report a Problem
                </Button>
              </div>
            </div>

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

      {/* Notification Settings Dialog */}
      <Dialog open={notificationSettingsOpen} onOpenChange={setNotificationSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Manage how you receive notifications
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium">Job Notifications</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="job-matches" className="font-medium">Job Matches</Label>
                    <p className="text-sm text-neutral-500">New jobs matching your profile</p>
                  </div>
                  <Switch id="job-matches" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="job-changes" className="font-medium">Job Changes</Label>
                    <p className="text-sm text-neutral-500">Updates to jobs you've applied for</p>
                  </div>
                  <Switch id="job-changes" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="job-reminders" className="font-medium">Job Reminders</Label>
                    <p className="text-sm text-neutral-500">Reminders about application deadlines</p>
                  </div>
                  <Switch id="job-reminders" defaultChecked />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">System Notifications</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="account-updates" className="font-medium">Account Updates</Label>
                    <p className="text-sm text-neutral-500">Changes to your account details</p>
                  </div>
                  <Switch id="account-updates" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-updates" className="font-medium">System Updates</Label>
                    <p className="text-sm text-neutral-500">Updates about the platform</p>
                  </div>
                  <Switch id="system-updates" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-updates" className="font-medium">Marketing</Label>
                    <p className="text-sm text-neutral-500">Promotional offers and news</p>
                  </div>
                  <Switch id="marketing-updates" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Notification Channels</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-channel" className="font-medium">Email</Label>
                    <p className="text-sm text-neutral-500">Receive notifications via email</p>
                  </div>
                  <Switch id="email-channel" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-channel" className="font-medium">SMS</Label>
                    <p className="text-sm text-neutral-500">Receive notifications via SMS</p>
                  </div>
                  <Switch id="sms-channel" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-channel" className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-neutral-500">Receive notifications in app</p>
                  </div>
                  <Switch id="push-channel" defaultChecked />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setNotificationSettingsOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Settings Dialog */}
      <Dialog open={languageSettingsOpen} onOpenChange={setLanguageSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Language Settings</DialogTitle>
            <DialogDescription>
              Choose your preferred language
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-3">
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="lang-en"
                    name="language"
                    className="h-4 w-4 text-primary border-neutral-300 focus:ring-primary"
                    defaultChecked
                  />
                  <Label htmlFor="lang-en" className="text-base cursor-pointer">English</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="lang-hi"
                    name="language"
                    className="h-4 w-4 text-primary border-neutral-300 focus:ring-primary"
                  />
                  <Label htmlFor="lang-hi" className="text-base cursor-pointer">हिंदी (Hindi)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="lang-ta"
                    name="language"
                    className="h-4 w-4 text-primary border-neutral-300 focus:ring-primary"
                  />
                  <Label htmlFor="lang-ta" className="text-base cursor-pointer">தமிழ் (Tamil)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="lang-ml"
                    name="language"
                    className="h-4 w-4 text-primary border-neutral-300 focus:ring-primary"
                  />
                  <Label htmlFor="lang-ml" className="text-base cursor-pointer">മലയാളം (Malayalam)</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Regional Settings</h3>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    defaultValue="dd/mm/yyyy"
                  >
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy/mm/dd">YYYY/MM/DD</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <select
                    id="timeFormat"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    defaultValue="24h"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLanguageSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setLanguageSettingsOpen(false)}>
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