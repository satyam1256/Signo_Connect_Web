import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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
  Building,
  Edit,
  Camera,
  Loader2,
  Briefcase,
  Truck
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import Cookies from "js-cookie";
const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;


interface TransporterProfile {
  name1: string;
  phone_number: string;
  email: string;
  company_name: string;
  fleet_size: string;
  emergency_contact_number: string;
  address: string;
  catagory: string;
  gst: string;
  pan: string;
  logo_pic: string | null;
  transporter_id: string | null;
}

const getProfileCompletionData = (data: TransporterProfile) => {
  const fieldWeights = [
    { field: "name1", label: "Full Name", weight: 15 },
    { field: "company_name", label: "Company Name", weight: 15 },
    { field: "phone_number", label: "Phone Number", weight: 15 },
    { field: "address", label: "Address", weight: 10 },
    { field: "gst", label: "GST Number", weight: 15 },
    { field: "pan", label: "PAN Number", weight: 10 },
    { field: "fleet_size", label: "Fleet Size", weight: 10 },
    { field: "logo_pic", label: "Company Logo", weight: 10 }
  ];

  let totalPoints = 0;
  let earnedPoints = 0;
  const missingItems: string[] = [];

  fieldWeights.forEach(({ field, label, weight }) => {
    totalPoints += weight;
    const value = data[field as keyof TransporterProfile];
    
    const isFilled = typeof value === "string" 
      ? value.trim() !== ""
      : value !== null;

    if (isFilled) {
      earnedPoints += weight;
    } else {
      missingItems.push(label);
    }
  });

  const completionPercentage = Math.round((earnedPoints / totalPoints) * 100);
  return { completionPercentage, missingItems };
};

const TransporterProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gstInputRef = useRef<HTMLInputElement>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profile, setProfile] = useState<TransporterProfile>({
    name1: "",
    phone_number: "",
    email: "",
    company_name: "",
    fleet_size: "",
    emergency_contact_number: "",
    address: "",
    catagory: "",
    gst: "",
    pan: "",
    logo_pic: null,
    transporter_id: null,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<TransporterProfile>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      const phoneNumber = Cookies.get("phoneNumber") || user.phoneNumber;
      
      const response = await fetch(
        `https://internal.signodrive.com/api/method/signo_connect.apis.transporter.get_transporter_profile?phone_number=${phoneNumber}`,{
        method: "GET",
        headers: { 
          "Authorization": `token ${frappe_token}`
        }
        },
      );

      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      console.log(data);
      
      const profileData = data.doc;
      console.log("TransporterProfile--->",profileData);
      setProfile(profileData);
      
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile" });
    } finally {
      setIsProfileLoading(false);
    }
  }, [user, toast]);

  const handleProfileUpdate = async () => {
    if (!user || !editedProfile) return;

    setIsUpdatingProfile(true);
    try {
      const transporterId = Cookies.get("userId") || user.id;

      const updatePayload = {
        transporter_id: transporterId,
        ...editedProfile,
        name1: editedProfile.name1 || profile.name1,
        company_name: editedProfile.company_name || profile.company_name,
        fleet_size: editedProfile.fleet_size || profile.fleet_size,
        gst: editedProfile.gst || profile.gst,
        pan: editedProfile.pan || profile.pan,
        email: editedProfile.email || profile.email,
        emergency_contact_number: editedProfile.emergency_contact_number || profile.emergency_contact_number,
        address: editedProfile.address || profile.address,
      };

      
      const response = await fetch(
        `https://internal.signodrive.com/api/method/signo_connect.api.proxy/Transporters/${transporterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${frappe_token}`,
            "x-key":x_key
          },
          body: JSON.stringify(updatePayload)
        }
      );

      if (!response.ok) throw new Error("Update failed");
      
      await loadProfile();
      toast({ title: "Success", description: "Profile updated successfully" });
      setIsEditingProfile(false);
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update profile" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (!user) navigate("/");
    else loadProfile();
  }, [user, navigate, loadProfile]);

  if (!user) return null;

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Header>
          <h1 className="text-xl font-bold text-neutral-800 ml-2">{t("profile")}</h1>
        </Header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-neutral-600">Loading profile...</p>
        </div>
        <BottomNavigation userType="transporter" />
      </div>
    );
  }

  const profileStatus = getProfileCompletionData(profile);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">{t("profile")}</h1>
      </Header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="h-48 bg-gradient-to-r from-primary/80 to-primary relative">
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
                <div className="px-6 pb-6 relative">
                  <div className="absolute -top-12 left-6">
                    <Avatar className="w-24 h-24 border-4 border-white">
                      <AvatarImage src={profile.logo_pic || undefined} />
                      <AvatarFallback className="bg-primary text-white">
                        {profile.company_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="pt-16">
                    <h2 className="text-2xl font-bold mb-1">{profile.name1}</h2>
                    <div className="flex items-center text-neutral-600 gap-4 mb-4 flex-wrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        <span>Company: {profile.company_name}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{profile.address || "Address not set"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Company Details</TabsTrigger>
                <TabsTrigger value="documents">Business Docs</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Building className="h-5 w-5 mr-3 mt-0.5" />
                      <div>
                        <Label>Company Name</Label>
                        <p>{profile.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 mt-0.5" />
                      <div>
                        <Label>Phone Number</Label>
                        <p>{profile.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 mt-0.5" />
                      <div>
                        <Label>Email Address</Label>
                        <p>{profile.email || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 mr-3 mt-0.5" />
                      <div>
                        <Label>Emergency Contact</Label>
                        <p>{profile.emergency_contact_number || "Not set"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>GST Number</Label>
                      <p>{profile.gst || "Not set"}</p>
                    </div>
                    <div>
                      <Label>PAN Number</Label>
                      <p>{profile.pan || "Not set"}</p>
                    </div>
                    <div>
                      <Label>Fleet Size</Label>
                      <p>{profile.fleet_size || "Not set"}</p>
                    </div>
                    <div>
                      <Label>Business Category</Label>
                      <p className="capitalize">{profile.catagory}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>GST Certificate</Label>
                          <p className="text-sm text-neutral-500">
                            {profile.gst ? "Uploaded" : "Not uploaded"}
                          </p>
                        </div>
                        <Button variant="outline">View</Button>
                      </div>
                    </div>
                    <div className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>PAN Card</Label>
                          <p className="text-sm text-neutral-500">
                            {profile.pan ? "Uploaded" : "Not uploaded"}
                          </p>
                        </div>
                        <Button variant="outline">View</Button>
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
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Status</span>
                  <Badge variant={profileStatus.completionPercentage >= 90 ? "default" : "secondary"}>
                    {profileStatus.completionPercentage}%
                  </Badge>
                </div>
                <Progress value={profileStatus.completionPercentage} className="h-2 mb-4" />
                {profileStatus.missingItems.length > 0 && (
                  <div className="bg-amber-50 p-4 rounded-md">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2" /> Required
                    </h4>
                    <ul className="text-sm space-y-1">
                      {profileStatus.missingItems.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <ChevronRight className="h-3 w-3 mr-1" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Briefcase className="h-6 w-6 mb-1" />
                  Post Load
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Truck className="h-6 w-6 mb-1" />
                  Manage Fleet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Label>Company Logo</Label>
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.logo_pic || undefined} />
                <AvatarFallback>{profile.company_name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transporter Name *</Label>
                <Input
                  value={editedProfile.name1 ?? profile.name1}
                  onChange={(e) => setEditedProfile({...editedProfile, name1: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={editedProfile.company_name ?? profile.company_name}
                  onChange={(e) => setEditedProfile({...editedProfile, company_name: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  value={editedProfile.email ?? profile.email}
                  onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={editedProfile.phone_number ?? profile.phone_number}
                  onChange={(e) => setEditedProfile({...editedProfile, phone_number: e.target.value})}
                  placeholder="Enter phone number"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={editedProfile.emergency_contact_number ?? profile.emergency_contact_number}
                  onChange={(e) => setEditedProfile({...editedProfile, emergency_contact_number: e.target.value})}
                  placeholder="Enter emergency contact"
                />
              </div>
              <div className="space-y-2">
                <Label>Fleet Size *</Label>
                <Select
                  value={editedProfile.fleet_size ?? profile.fleet_size}
                  onValueChange={(value) => setEditedProfile({...editedProfile, fleet_size: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fleet size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 vehicles</SelectItem>
                    <SelectItem value="6-20">6-20 vehicles</SelectItem>
                    <SelectItem value="21-50">21-50 vehicles</SelectItem>
                    <SelectItem value="50+">50+ vehicles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>GST Number *</Label>
                <Input
                  ref={gstInputRef}
                  value={editedProfile.gst ?? profile.gst}
                  onChange={(e) => setEditedProfile({...editedProfile, gst: e.target.value})}
                  placeholder="Enter GST number"
                />
              </div>
              <div className="space-y-2">
                <Label>PAN Number *</Label>
                <Input
                  value={editedProfile.pan ?? profile.pan}
                  onChange={(e) => setEditedProfile({...editedProfile, pan: e.target.value})}
                  placeholder="Enter PAN number"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address *</Label>
                <Textarea
                  value={editedProfile.address ?? profile.address}
                  onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
              Cancel
            </Button>
            <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation userType="transporter" />
      <Chatbot />
    </div>
  );
};

export default TransporterProfile;