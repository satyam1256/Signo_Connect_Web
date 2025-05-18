import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Mail, Phone, Building, LogOut } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { LanguageSelector } from "@/components/ui/language-selector";
import { FileUpload } from "@/components/ui/file-upload";

const FleetOwnerProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleOpenDialog = (dialogName: string) => {
    setActiveDialog(dialogName);
  };

  const handleCloseDialog = () => {
    setActiveDialog(null);
  };

  const saveProfileChanges = (data: any) => {
    // In a real app, we would send this to the server
    updateUser({
      ...data,
      profileCompleted: true
    });
    handleCloseDialog();
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header showBack>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("profile")}
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
        {/* Profile Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-[#FFF3E0] rounded-full flex items-center justify-center mr-4">
                <Building className="text-[#FF6D00] h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-neutral-800">{user.fullName}</h2>
                <p className="text-neutral-500">{user.phoneNumber}</p>
                {user.email && <p className="text-neutral-500">{user.email}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 cursor-pointer" onClick={() => handleOpenDialog("profile")}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                    <User className="text-blue-500 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">Company Profile</h3>
                    <p className="text-sm text-neutral-500">Update your company information</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 cursor-pointer" onClick={() => handleOpenDialog("notification")}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mr-3">
                    <Mail className="text-orange-500 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">Notification Settings</h3>
                    <p className="text-sm text-neutral-500">Manage notifications and alerts</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 cursor-pointer" onClick={() => handleOpenDialog("language")}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mr-3">
                    <svg className="text-green-500 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">Language Settings</h3>
                    <p className="text-sm text-neutral-500">Change language preferences</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 cursor-pointer" onClick={() => handleOpenDialog("support")}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mr-3">
                    <Phone className="text-purple-500 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">Help & Support</h3>
                    <p className="text-sm text-neutral-500">Contact customer support</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-100 cursor-pointer" onClick={() => logout()}>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mr-3">
                    <LogOut className="text-red-500 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">Sign Out</h3>
                    <p className="text-sm text-neutral-500">Log out of your account</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Settings Dialog */}
      <Dialog open={activeDialog === "profile"} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Company Profile</DialogTitle>
            <DialogDescription>Update your company information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <FormLabel>Company Name</FormLabel>
              <Input defaultValue={user.fullName} placeholder="Enter company name" />
            </div>
            <div className="space-y-2">
              <FormLabel>Email Address</FormLabel>
              <Input defaultValue={user.email} placeholder="Enter email address" type="email" />
            </div>
            <div className="space-y-2">
              <FormLabel>Phone Number</FormLabel>
              <Input defaultValue={user.phoneNumber} placeholder="Enter phone number" type="tel" disabled />
              <p className="text-xs text-neutral-500">Primary phone number cannot be changed</p>
            </div>
            <div className="space-y-2">
              <FormLabel>Fleet Size</FormLabel>
              <Input placeholder="Number of vehicles" type="number" min="1" />
            </div>
            <div className="space-y-2">
              <FormLabel>Business Registration</FormLabel>
              <FileUpload 
                title="Upload Business Registration" 
                buttonText="Upload Document"
                onChange={() => {}}
                helpText="GST Certificate, Business Registration, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={() => saveProfileChanges({})}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={activeDialog === "notification"} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>Manage your notification preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">New Driver Applications</h4>
                <p className="text-sm text-neutral-500">Get notified when drivers apply to your jobs</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Job Alerts</h4>
                <p className="text-sm text-neutral-500">Alerts related to your job postings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Marketing Communications</h4>
                <p className="text-sm text-neutral-500">Receive updates about promotions and new features</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">SMS Notifications</h4>
                <p className="text-sm text-neutral-500">Receive notifications via SMS</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-neutral-500">Receive notifications via email</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleCloseDialog}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Settings Dialog */}
      <Dialog open={activeDialog === "language"} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Language Settings</DialogTitle>
            <DialogDescription>Choose your preferred language.</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <LanguageSelector />
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={activeDialog === "support"} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
            <DialogDescription>How can we help you?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <FormLabel>Subject</FormLabel>
              <Input placeholder="What is your inquiry about?" />
            </div>
            <div className="space-y-2">
              <FormLabel>Message</FormLabel>
              <Textarea placeholder="Describe your issue in detail" rows={4} />
            </div>
            <p className="text-sm text-neutral-500">
              Our support team will respond within 24 hours to the email address associated with your account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleCloseDialog}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation userType="fleet_owner" />
      <Chatbot />
    </div>
  );
};

export default FleetOwnerProfile;