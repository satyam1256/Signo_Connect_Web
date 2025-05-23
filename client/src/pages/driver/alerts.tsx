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

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="alert-name">Alert Name</Label>
                      <Input 
                        id="alert-name" 
                        placeholder="e.g., Delhi Local Delivery Jobs" 
                        value={newAlertName}
                        onChange={(e) => setNewAlertName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Locations (Select at least one)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableLocations.map(location => (
                          <div key={location} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id={`loc-${location}`} 
                              checked={selectedLocations.includes(location)}
                              onChange={() => toggleLocationSelection(location)}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`loc-${location}`} className="text-sm cursor-pointer">
                              {location}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
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
              <Card>
                <CardContent className="text-center py-12">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <BellOff className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No job alerts</h3>
                  <p className="text-neutral-500 max-w-md mx-auto mb-4">
                    Create job alerts to get notified when new jobs matching your criteria are posted.
                  </p>
                  <Button onClick={() => setIsAddingAlert(true)}>Create Your First Alert</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Card key={alert.id} className={!alert.active ? "opacity-75" : undefined}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium flex items-center">
                            {alert.name}
                            {alert.matchCount > 0 && (
                              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                                {alert.matchCount} matches
                              </Badge>
                            )}
                          </h4>
                          <p className="text-neutral-500 text-sm">Last updated: {alert.lastUpdated}</p>
                        </div>

                        <div className="flex items-center">
                          <div className="mr-4 flex items-center">
                            <Label htmlFor={`alert-${alert.id}`} className="mr-2 text-sm">
                              {alert.active ? "Active" : "Inactive"}
                            </Label>
                            <Switch 
                              id={`alert-${alert.id}`} 
                              checked={alert.active}
                              onCheckedChange={() => toggleAlertActive(alert.id)}
                            />
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Matching Jobs
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Filter className="h-4 w-4 mr-2" />
                                Edit Criteria
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteAlert(alert.id)} className="text-red-600">
                                <XCircle className="h-4 w-4 mr-2" />
                                Delete Alert
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" /> Locations
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {alert.criteria.locations.map((location, index) => (
                              <Badge key={index} variant="outline">
                                {location}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center">
                            <Clock className="h-4 w-4 mr-1" /> Job Types
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {alert.criteria.jobTypes.map((type, index) => (
                              <Badge key={index} variant="outline">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" /> Vehicle Types
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {alert.criteria.vehicleTypes.map((type, index) => (
                              <Badge key={index} variant="outline">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2 flex items-center">
                            <ArrowUpDown className="h-4 w-4 mr-1" /> Other Criteria
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {alert.criteria.salaryMin && (
                              <Badge variant="outline">
                                Min ₹{alert.criteria.salaryMin}/month
                              </Badge>
                            )}
                            {alert.criteria.distance && (
                              <Badge variant="outline">
                                {alert.criteria.distance}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {alert.matchCount > 0 && (
                        <div className="mt-4 text-right">
                          <Button variant="link" className="h-auto p-0 text-primary">
                            View {alert.matchCount} matching jobs
                          </Button>
                        </div>
                      )}
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