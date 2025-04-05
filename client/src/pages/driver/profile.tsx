import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

// Calculate profile completion percentage
const calculateProfileCompletion = (profile: any): number => {
  if (!profile) return 0;
  
  // Field weights add up to 100 points
  const fieldWeights = [
    { field: 'fullName', weight: 10 },
    { field: 'phoneNumber', weight: 10 },
    { field: 'email', weight: 10 },
    { field: 'location', weight: 10 },
    { field: 'about', weight: 10 },
    { field: 'experience', weight: 10 },
    { field: 'preferredLocations', weight: 10 },
    { field: 'vehicleTypes', weight: 10 },
    { field: 'drivingLicense', weight: 10 },
    { field: 'identityProof', weight: 10 }
  ];
  
  let totalPoints = 0;
  const totalPossiblePoints = fieldWeights.reduce((sum, item) => sum + item.weight, 0);
  
  fieldWeights.forEach(({ field, weight }) => {
    const value = profile[field];
    
    if (value) {
      if (Array.isArray(value)) {
        // For array fields like vehicleTypes, skills, preferredLocations
        if (value.length > 0) {
          totalPoints += weight;
        }
      } else if (typeof value === 'string') {
        // For string fields, ensure they're not empty strings
        if (value.trim() !== '') {
          totalPoints += weight;
        }
      } else {
        // For other types
        totalPoints += weight;
      }
    }
  });
  
  return Math.round((totalPoints / totalPossiblePoints) * 100);
};

interface UserProfile {
  fullName: string;
  phoneNumber: string;
  email: string;
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

const DriverProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

  // Initialize with empty profile, will be filled from API
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    phoneNumber: "",
    email: "",
    language: "English", // Default language
    location: "",
    about: "",
    experience: "",
    preferredLocations: [],
    vehicleTypes: [],
    drivingLicense: null,
    identityProof: null,
    availability: "full-time", // Default availability
    skills: [],
    joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }), // Current date formatted
    completionPercentage: 0
  });

  // Remove unused query - using direct fetch in useEffect instead
  
  // Handle profile data when it's fetched
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        const response = await fetch(`/api/resource/Drivers/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        
        const profileData: UserProfile = {
          fullName: data.fullName || user?.fullName || "",
          phoneNumber: data.phoneNumber || user?.phoneNumber || "",
          email: data.email || user?.email || "",
          language: data.language || "English",
          location: data.location || "",
          about: data.about || "",
          profileImage: data.profileImage || null,
          experience: data.experience || "",
          preferredLocations: data.preferredLocations || [],
          vehicleTypes: data.vehicleTypes || [],
          drivingLicense: data.drivingLicense || null,
          identityProof: data.identityProof || null,
          availability: data.availability || "full-time",
          skills: data.skills || [],
          joinedDate: data.joinedDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          completionPercentage: calculateProfileCompletion(data)
        };
        
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);

  // Dialog states
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [languageSettingsOpen, setLanguageSettingsOpen] = useState(false);

  // Toast notifications
  const { toast } = useToast();
  
  // State to track profile update request
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    if ((Object.keys(editedProfile).length > 0 || profileImage) && user) {
      setIsUpdatingProfile(true);
      try {
        // Handle profile image upload if a new image is selected
        let profileImageUrl = profile.profileImage;
        
        if (profileImage) {
          // Compress and convert image to base64 string
          const compressedImagePromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                // Create canvas for image compression
                const canvas = document.createElement('canvas');
                
                // Calculate new dimensions while maintaining aspect ratio
                const MAX_WIDTH = 500;
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }
                
                // Resize image using canvas
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Get compressed image as base64 string with reduced quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
              };
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(profileImage);
          });
          
          // Wait for compression to complete
          profileImageUrl = await compressedImagePromise;
        }
        
        // Combine all profile data that will be sent
        const updatedProfileData = {
          ...editedProfile,
          userId: user.id,
          fullName: editedProfile.fullName || profile.fullName,
          phoneNumber: editedProfile.phoneNumber || profile.phoneNumber,
          profileImage: profileImageUrl,
        };
        
        // Send data to the API
        const response = await fetch(`/api/resource/Drivers/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfileData),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
        
        // Get the response data
        const responseData = await response.json();
        
        // Re-fetch complete profile to get updated data
        const refreshResponse = await fetch(`/api/resource/Drivers/${user.id}`);
        if (!refreshResponse.ok) {
          throw new Error('Failed to refresh profile data');
        }
        
        const refreshedData = await refreshResponse.json();
        
        // Calculate the new completion percentage with the full updated data
        const newCompletionPercentage = calculateProfileCompletion(refreshedData);
        
        // Update local state with all the new data including completion percentage and profile image
        const completeUpdatedProfile = { 
          ...profile, 
          ...refreshedData,
          ...editedProfile,
          completionPercentage: newCompletionPercentage,
          profileImage: profileImage ? refreshedData.profileImage : profile.profileImage
        };
        
        // Update the profile state with the refreshed data and reset profile image state
        setProfile(completeUpdatedProfile);
        setProfileImage(null);

        // Update user context if name or profile completion status changed
        if (editedProfile.fullName || completeUpdatedProfile.completionPercentage !== profile.completionPercentage) {
          updateUser({ 
            fullName: editedProfile.fullName || profile.fullName,
            profileCompleted: completeUpdatedProfile.completionPercentage >= 80 // Mark as completed if >= 80%
          });
        }

        // Show success notification
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });

        // Clear the edited profile and close edit mode
        setEditedProfile({});
        setIsEditingProfile(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "We couldn't update your profile. Please try again.",
        });
      } finally {
        setIsUpdatingProfile(false);
      }
    } else {
      // No changes or no user
      setIsEditingProfile(false);
    }
  };

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Loading states
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // Update loading state when fetching profile data
  useEffect(() => {
    if (user) {
      setIsProfileLoading(false);
    }
  }, [profile, user]);
  
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

  const missingItems = [];
  if (!profile.email) missingItems.push("Email");
  if (!profile.drivingLicense) missingItems.push("Driving License");
  if (!profile.identityProof) missingItems.push("Identity Proof");
  if (!profile.about) missingItems.push("About Section");

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

                <Button className="w-full">Complete Profile</Button>
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
                    disabled={isUpdatingProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <select
                    id="experience"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={editedProfile.experience || profile.experience}
                    onChange={(e) => setEditedProfile({...editedProfile, experience: e.target.value})}
                    disabled={isUpdatingProfile}
                  >
                    <option value="">Select experience</option>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(year => (
                      <option key={year} value={`${year} year${year > 1 ? 's' : ''}`}>
                        {year} year{year > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
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
                  disabled={isUpdatingProfile}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Professional Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Textarea
                    id="skills"
                    rows={2}
                    placeholder="Enter your skills (e.g., Long-distance driving, GPS navigation, First aid)"
                    defaultValue={profile.skills.join(", ")}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile, 
                      skills: e.target.value.split(",").map(skill => skill.trim())
                    })}
                    disabled={isUpdatingProfile}
                  />
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
                  <div className="border border-input rounded-md p-2 bg-background">
                    {['Heavy Vehicle', 'Medium Vehicle', 'Light Vehicle', 'Truck', 'Bus', 'Van', 'Pickup'].map((type) => (
                      <div key={type} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`vehicle-${type}`}
                          className="mr-2 h-4 w-4"
                          checked={editedProfile.vehicleTypes?.includes(type) || profile.vehicleTypes.includes(type)}
                          onChange={(e) => {
                            const updatedTypes = e.target.checked
                              ? [...(editedProfile.vehicleTypes || profile.vehicleTypes), type]
                              : (editedProfile.vehicleTypes || profile.vehicleTypes).filter(t => t !== type);
                            
                            setEditedProfile({
                              ...editedProfile,
                              vehicleTypes: updatedTypes
                            });
                          }}
                          disabled={isUpdatingProfile}
                        />
                        <Label htmlFor={`vehicle-${type}`} className="text-sm cursor-pointer">
                          {type}
                        </Label>
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
                    disabled={isUpdatingProfile}
                  />
                </div>

                <FileUpload 
                  title="Driving License"
                  buttonText="Upload License"
                  accepted=".pdf,.jpg,.jpeg,.png"
                  onChange={setLicenseFile}
                  value={licenseFile}
                  helpText="Upload a clear photo or scan of your license"
                  className={isUpdatingProfile ? "opacity-60 pointer-events-none" : ""}
                />

                <div className="space-y-2">
                  <Label htmlFor="identityProof">Identity Proof Number</Label>
                  <Input 
                    id="identityProof" 
                    defaultValue={profile.identityProof || ""}
                    onChange={(e) => setEditedProfile({...editedProfile, identityProof: e.target.value})}
                    disabled={isUpdatingProfile}
                  />
                </div>

                <FileUpload 
                  title="Identity Proof"
                  buttonText="Upload Document"
                  accepted=".pdf,.jpg,.jpeg,.png"
                  onChange={setIdentityFile}
                  value={identityFile}
                  helpText="Upload Aadhaar, PAN, or Voter ID"
                  className={isUpdatingProfile ? "opacity-60 pointer-events-none" : ""}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProfileUpdate} 
              disabled={isUpdatingProfile}
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