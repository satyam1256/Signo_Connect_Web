import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Bell,
  BellOff,
  Eye,
  MapPin,
  Building,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Tag,
  Filter,
  MoreVertical,
  Briefcase
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";

// Alert Types
interface JobAlert {
  id: number;
  name: string;
  criteria: {
    locations: string[];
    jobTypes: string[];
    vehicleTypes: string[];
    salaryMin?: number;
    distance?: string;
  };
  active: boolean;
  lastUpdated: string;
  matchCount: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'job_match' | 'application_update' | 'system' | 'payment';
  actionUrl?: string;
  metadata?: {
    jobTitle?: string;
    company?: string;
    location?: string;
    status?: string;
  };
}

// Mock data for initial development
const mockJobAlerts: JobAlert[] = [
  {
    id: 1,
    name: "Delhi Local Delivery Jobs",
    criteria: {
      locations: ["Delhi NCR"],
      jobTypes: ["Full-time", "Part-time"],
      vehicleTypes: ["Light Vehicle"],
      distance: "Local (< 50 km)"
    },
    active: true,
    lastUpdated: "2 days ago",
    matchCount: 3
  },
  {
    id: 2,
    name: "Long Distance Truck Jobs",
    criteria: {
      locations: ["Delhi", "Mumbai", "North India"],
      jobTypes: ["Full-time"],
      vehicleTypes: ["Heavy Vehicle"],
      salaryMin: 30000,
      distance: "Long Distance (500+ km)"
    },
    active: true,
    lastUpdated: "1 week ago",
    matchCount: 5
  },
  {
    id: 3,
    name: "Weekend Delivery Jobs",
    criteria: {
      locations: ["Delhi", "Gurgaon", "Noida"],
      jobTypes: ["Part-time", "Contract"],
      vehicleTypes: ["Two-wheeler", "Light Vehicle"],
      distance: "Local (< 50 km)"
    },
    active: false,
    lastUpdated: "1 month ago",
    matchCount: 0
  }
];

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "New job match found",
    message: "We found a new job that matches your 'Delhi Local Delivery Jobs' alert.",
    time: "10 min ago",
    read: false,
    type: "job_match",
    actionUrl: "/driver/jobs",
    metadata: {
      jobTitle: "City Delivery Driver",
      company: "FastExpress",
      location: "Delhi NCR"
    }
  },
  {
    id: 2,
    title: "Application status update",
    message: "Your application for 'Long-haul Truck Driver' has been viewed by the employer.",
    time: "2 hours ago",
    read: false,
    type: "application_update",
    actionUrl: "/driver/applications/1",
    metadata: {
      jobTitle: "Long-haul Truck Driver",
      company: "ABC Logistics",
      status: "Reviewed"
    }
  },
  {
    id: 3,
    title: "Verify your email address",
    message: "Please verify your email address to receive important notifications.",
    time: "1 day ago",
    read: true,
    type: "system",
    actionUrl: "/driver/profile"
  },
  {
    id: 4,
    title: "Application status update",
    message: "Congratulations! You've been shortlisted for 'Regional Truck Driver' position.",
    time: "2 days ago",
    read: true,
    type: "application_update",
    actionUrl: "/driver/applications/2",
    metadata: {
      jobTitle: "Regional Truck Driver",
      company: "RegionalMove",
      status: "Shortlisted"
    }
  },
  {
    id: 5,
    title: "Weekly job digest",
    message: "Check out this week's new job opportunities matching your profile.",
    time: "1 week ago",
    read: true,
    type: "job_match",
    actionUrl: "/driver/jobs"
  }
];

const DriverAlertsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  
  const [alerts, setAlerts] = useState<JobAlert[]>(mockJobAlerts);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [newAlertName, setNewAlertName] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  const availableLocations = ["Delhi", "Mumbai", "Bangalore", "Gurgaon", "Noida", "Pune", "Chennai", "Hyderabad", "Kolkata", "Delhi NCR", "North India", "South India"];
  
  const toggleAlertActive = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };
  
  const deleteAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const handleAddAlert = () => {
    if (newAlertName.trim() === "") return;
    
    const newAlert: JobAlert = {
      id: alerts.length + 1,
      name: newAlertName,
      criteria: {
        locations: selectedLocations,
        jobTypes: ["Full-time", "Part-time"],
        vehicleTypes: ["Light Vehicle", "Heavy Vehicle"],
      },
      active: true,
      lastUpdated: "Just now",
      matchCount: 0
    };
    
    setAlerts([newAlert, ...alerts]);
    setNewAlertName("");
    setSelectedLocations([]);
    setIsAddingAlert(false);
  };
  
  const toggleLocationSelection = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(loc => loc !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
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
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("alerts")}
        </h1>
      </Header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadCount > 0 && (
                <Badge className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="job-alerts">Job Alerts</TabsTrigger>
          </TabsList>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
                <h3 className="font-medium">Recent Notifications</h3>
                {notifications.some(n => !n.read) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-sm"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <Bell className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    You don't have any notifications yet. They will appear here when you receive them.
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification, index) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 ${index < notifications.length - 1 ? 'border-b border-neutral-200' : ''} ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-neutral-50 transition-colors duration-200`}
                    >
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                          notification.type === 'job_match' ? 'bg-blue-100 text-blue-600' :
                          notification.type === 'application_update' ? 'bg-green-100 text-green-600' :
                          notification.type === 'system' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {notification.type === 'job_match' ? <Tag size={18} /> :
                           notification.type === 'application_update' ? <CheckCircle2 size={18} /> :
                           notification.type === 'system' ? <Bell size={18} /> :
                           <Calendar size={18} />}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-neutral-900">{notification.title}</h4>
                            <div className="flex items-center">
                              <span className="text-xs text-neutral-500 mr-2">{notification.time}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!notification.read && (
                                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Mark as read
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          <p className="text-neutral-600 text-sm my-1">{notification.message}</p>
                          
                          {notification.metadata && (
                            <div className="bg-neutral-50 rounded p-2 my-2 text-sm">
                              {notification.metadata.jobTitle && (
                                <div className="flex items-center text-neutral-700">
                                  <Tag className="h-3 w-3 mr-2" />
                                  {notification.metadata.jobTitle}
                                </div>
                              )}
                              {notification.metadata.company && (
                                <div className="flex items-center text-neutral-500 mt-1">
                                  <Building className="h-3 w-3 mr-2" />
                                  {notification.metadata.company}
                                </div>
                              )}
                              {notification.metadata.location && (
                                <div className="flex items-center text-neutral-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-2" />
                                  {notification.metadata.location}
                                </div>
                              )}
                              {notification.metadata.status && (
                                <div className="flex items-center mt-1">
                                  <Badge variant="outline" className={
                                    notification.metadata.status === "Shortlisted" ? "border-green-200 text-green-700 bg-green-50" :
                                    notification.metadata.status === "Reviewed" ? "border-blue-200 text-blue-700 bg-blue-50" :
                                    "border-neutral-200 text-neutral-700 bg-neutral-50"
                                  }>
                                    {notification.metadata.status}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {notification.actionUrl && (
                            <div className="mt-2">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-primary"
                                onClick={() => navigate(notification.actionUrl || "/")}
                              >
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Job Alerts Tab */}
          <TabsContent value="job-alerts" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Your Job Alerts</h3>
              <Dialog open={isAddingAlert} onOpenChange={setIsAddingAlert}>
                <DialogTrigger asChild>
                  <Button>Create Alert</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Job Alert</DialogTitle>
                    <DialogDescription>
                      Set up criteria for jobs you want to be notified about.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="alert-name">Alert Name</Label>
                      <Input 
                        id="alert-name" 
                        value={newAlertName}
                        onChange={(e) => setNewAlertName(e.target.value)}
                        placeholder="e.g., Delhi Driving Jobs"
                      />
                    </div>
                    
                    <div>
                      <Label>Locations</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableLocations.map(location => (
                          <div 
                            key={location}
                            className={`p-2 border rounded cursor-pointer text-sm
                              ${selectedLocations.includes(location) 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                              }`}
                            onClick={() => toggleLocationSelection(location)}
                          >
                            {location}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setIsAddingAlert(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddAlert} disabled={newAlertName.trim() === "" || selectedLocations.length === 0}>
                      Create Alert
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {alerts.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                  <BellOff className="h-6 w-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No job alerts yet</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  Create job alerts to get notified when new jobs matching your criteria are posted.
                </p>
                <Button onClick={() => setIsAddingAlert(true)}>
                  Create Your First Alert
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Card key={alert.id}>
                    <CardContent className="p-0">
                      <div className="p-4 flex justify-between items-start border-b border-neutral-100">
                        <div>
                          <h4 className="font-medium text-lg">{alert.name}</h4>
                          <p className="text-sm text-neutral-500">Last updated: {alert.lastUpdated}</p>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-sm mr-3 ${alert.active ? 'text-green-600' : 'text-neutral-400'}`}>
                            {alert.active ? 'Active' : 'Inactive'}
                          </span>
                          <Switch 
                            checked={alert.active}
                            onCheckedChange={() => toggleAlertActive(alert.id)}
                          />
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {alert.criteria.locations.map(location => (
                            <Badge key={location} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              <MapPin className="h-3 w-3 mr-1" /> {location}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-neutral-500">Job Types</p>
                            <p>{alert.criteria.jobTypes.join(", ")}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Vehicle Types</p>
                            <p>{alert.criteria.vehicleTypes.join(", ")}</p>
                          </div>
                          {alert.criteria.distance && (
                            <div>
                              <p className="text-neutral-500">Distance</p>
                              <p>{alert.criteria.distance}</p>
                            </div>
                          )}
                          {alert.criteria.salaryMin && (
                            <div>
                              <p className="text-neutral-500">Min. Salary</p>
                              <p>₹{alert.criteria.salaryMin.toLocaleString()}/month</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Badge className={`${alert.matchCount > 0 ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'}`}>
                            {alert.matchCount} matching jobs
                          </Badge>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteAlert(alert.id)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation userType="driver" />
      <Chatbot />
    </div>
  );
};

export default DriverAlertsPage;