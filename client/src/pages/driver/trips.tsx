import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  MapPin, 
  Calendar,
  Clock,
  Truck,
  IndianRupee,
  Star,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  User,
  Users,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { Trip } from "@/pages/types/trip";
import "./trips.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format as formatDateFns } from "date-fns";
import Cookies from "js-cookie";
const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;


// Form schema for trip validation
const tripFormSchema = z.object({
  // Basic trip details
  naming_series: z.string().optional(),
  vehicle: z.string().min(1, "Vehicle is required"),
  vehicle_type: z.string().optional(),
  driver: z.string().min(1, "Driver is required"),
  driver_name: z.string().optional(),
  driver_phone_number: z.string().optional(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  
  // Financial information
  trip_cost: z.coerce.number().nonnegative("Trip cost must be positive or zero").optional(),
  pending_amount: z.coerce.number().nonnegative("Pending amount must be positive or zero").optional(),
  paid_amount: z.coerce.number().nonnegative("Paid amount must be positive or zero").optional(),
  
  // Status and dates
  status: z.enum(["Upcoming", "Waiting", "Running", "Completed"]),
  created_on: z.string().optional(),
  started_on: z.string().optional(),
  ended_on: z.string().optional(),
  eta: z.string().optional(),
  eta_str: z.string().optional(),
  
  // Transporter details
  transporter: z.string().optional(),
  transporter_name: z.string().optional(),
  transporter_phone: z.string().optional(),
  
  // Odometer and images
  odo_start: z.string().optional(),
  odo_start_pic: z.string().optional(),
  odo_end: z.string().optional(),
  odo_end_pic: z.string().optional(),
  trip_pic: z.string().optional(),
  
  // Additional info
  documents: z.string().optional(),
  share_text: z.string().optional(),
  started_by: z.enum(["Driver", "Transporter"]).optional(),
  is_active: z.boolean().optional(),
  handover_checklist: z.string().optional(),
  company_name: z.string().optional(),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

const DriverTripsPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [expandedTrips, setExpandedTrips] = useState<string[]>([]);
  const [transporterId, setTransporterId] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [transporters, setTransporters] = useState<any[]>([]);
  const [selectedTransporter, setSelectedTransporter] = useState<any | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  // Form for creating/editing trips
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      // Basic trip details
      naming_series: "",
      vehicle: "",
      vehicle_type: "",
      driver: "",
      driver_name: "",
      driver_phone_number: "",
      origin: "",
      destination: "",
      
      // Financial information
      trip_cost: 0,
      pending_amount: 0,
      paid_amount: 0,
      
      // Status and dates
      status: "Upcoming",
      created_on: new Date().toISOString(),
      started_on: "",
      ended_on: "",
      eta: "",
      eta_str: "",
      
      // Transporter details
      transporter: "",
      transporter_name: "",
      transporter_phone: "",
      
      // Odometer and images
      odo_start: "",
      odo_start_pic: "",
      odo_end: "",
      odo_end_pic: "",
      trip_pic: "",
      
      // Additional info
      documents: "",
      share_text: "",
      started_by: "Driver",
      is_active: true,
      handover_checklist: "",
      company_name: "",
    },
  });

  // Get trips for the current driver
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips', Cookies.get('userId')],
    queryFn: async () => {
      const userId = Cookies.get('userId');
      if (!userId) return [];
      const response = await fetch(`https://internal.signodrive.com/api/method/signo_connect.apis.trip.get_trips?driver_id=${userId}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `token ${frappe_token}`,
          "x-key": x_key
        }
      });
      if (!response.ok) throw new Error('Failed to fetch trips');
      const json = await response.json();
      return json.data || json.message || json.trips || [];
    },
    enabled: !!Cookies.get('userId'),
  });

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      const userId = Cookies.get('userId');
      if (!userId) throw new Error('User not authenticated');
      try {
        const response = await fetch('https://internal.signodrive.com/api/method/signo_connect.api.proxy/Trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `token ${frappe_token}`,
            'x-key': x_key
          },
          body: JSON.stringify({ ...data, driver: userId }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to create trip');
        }
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', Cookies.get('userId')] });
      toast({
        title: "Trip added successfully",
        description: "Your trip has been recorded",
      });
      setIsAddTripOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Trip creation error", error);
      toast({
        title: "Error adding trip",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async (data: { trip_id: string; trip: TripFormValues }) => {
      return fetch(`https://internal.signodrive.com/api/method/signo_connect.api.proxy/Trips/${data.trip_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `token ${frappe_token}`,
          'x-key': x_key
        },
        body: JSON.stringify(data.trip),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update trip');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', Cookies.get('userId')] });
      toast({
        title: "Trip updated successfully",
        description: "Your trip has been updated",
      });
      setEditingTrip(null);
      setIsAddTripOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating trip",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (naming_series: string) => {
      return fetch(`/api/trips/${naming_series}`, {
        method: 'DELETE',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to delete trip');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', Cookies.get('userId')] });
      toast({
        title: "Trip deleted successfully",
        description: "Your trip has been removed",
      });
      setTripToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting trip",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch all transporters on mount
  useEffect(() => {
    fetch("https://internal.signodrive.com/api/method/signo_connect.api.proxy/Transporters", {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `token ${frappe_token}`,
        "x-key": x_key
      }
    })
      .then(async res => {
        if (!res.ok) {
          console.error('Failed to fetch transporters', res.status, res.statusText);
          return { data: [] };
        }
        const text = await res.text();
        if (!text) return { data: [] };
        try {
          return JSON.parse(text);
        } catch {
          return { data: [] };
        }
      })
      .then(data => setTransporters(data.data || []))
      .catch(err => {
        console.error('Transporter fetch error:', err);
        setTransporters([]);
      });
  }, []);

  // Fetch all vehicles on mount
  useEffect(() => {
    fetch("https://internal.signodrive.com/api/method/signo_connect.api.proxy/Vehicles", {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `token ${frappe_token}`,
        "x-key": x_key
      }
    })
      .then(async res => {
        if (!res.ok) {
          console.error('Failed to fetch vehicles', res.status, res.statusText);
          return { data: [] };
        }
        const text = await res.text();
        if (!text) return { data: [] };
        try {
          return JSON.parse(text);
        } catch {
          return { data: [] };
        }
      })
      .then(data => setVehicles(data.data || []))
      .catch(err => {
        console.error('Vehicle fetch error:', err);
        setVehicles([]);
      });
  }, []);

  // Update handleCompanySelect to set both transporter and company_name
  const handleCompanySelect = (transporterId: string) => {
    const transporter = transporters.find(t => t.name === transporterId);
    setSelectedTransporter(transporter);
    if (transporter) {
      form.setValue("transporter", transporter.name); // backend expects this
      form.setValue("company_name", transporter.company_name); // for display
      form.setValue("transporter_name", transporter.name1);
      form.setValue("transporter_phone", transporter.phone_number);
    } else {
      form.setValue("transporter", "");
      form.setValue("company_name", "");
      form.setValue("transporter_name", "");
      form.setValue("transporter_phone", "");
    }
  };

  // When vehicle is selected, set selectedVehicle and update form fields
  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.name === vehicleId);
    setSelectedVehicle(vehicle);
    if (vehicle) {
      form.setValue("vehicle", vehicle.name);
      form.setValue("vehicle_type", vehicle.vehicle_type || "");
    } else {
      form.setValue("vehicle", "");
      form.setValue("vehicle_type", "");
    }
  };

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Set form values when editing a trip
  useEffect(() => {
    if (editingTrip) {
      form.reset({
        // Basic trip details
        naming_series: editingTrip.naming_series || "",
        vehicle: editingTrip.vehicle || "",
        vehicle_type: editingTrip.vehicle_type || "",
        driver: editingTrip.driver || "",
        driver_name: editingTrip.driver_name || user?.fullName || "",
        driver_phone_number: editingTrip.driver_phone_number || user?.phoneNumber || "",
        origin: editingTrip.origin,
        destination: editingTrip.destination,
        
        // Financial information
        trip_cost: editingTrip.trip_cost || 0,
        pending_amount: editingTrip.pending_amount || 0,
        paid_amount: editingTrip.paid_amount || 0,
        
        // Status and dates
        status: editingTrip.status as "Upcoming" | "Waiting" | "Running" | "Completed",
        created_on: editingTrip.created_on || new Date().toISOString(),
        started_on: editingTrip.started_on ? new Date(editingTrip.started_on).toISOString().substring(0, 16) : "",
        ended_on: editingTrip.ended_on ? new Date(editingTrip.ended_on).toISOString().substring(0, 16) : "",
        eta: editingTrip.eta ? new Date(editingTrip.eta).toISOString().substring(0, 16) : "",
        eta_str: editingTrip.eta_str || "",
        
        // Transporter details
        transporter: editingTrip.transporter || "",
        transporter_name: editingTrip.transporter_name || "",
        transporter_phone: editingTrip.transporter_phone || "",
        
        // Odometer and images
        odo_start: editingTrip.odo_start || "",
        odo_start_pic: editingTrip.odo_start_pic || "",
        odo_end: editingTrip.odo_end || "",
        odo_end_pic: editingTrip.odo_end_pic || "",
        trip_pic: editingTrip.trip_pic || "",
        
        // Additional info
        documents: editingTrip.documents || "",
        share_text: editingTrip.share_text || "",
        started_by: editingTrip.started_by || "Driver",
        is_active: editingTrip.is_active ?? true,
        handover_checklist: editingTrip.handover_checklist || "",
        company_name: editingTrip.company_name || "",
      });
      setIsAddTripOpen(true);
    }
  }, [editingTrip, form, user]);

  const handleAddTrip = () => {
    setEditingTrip(null);
    form.reset({
      // Basic trip details
      naming_series: `TR-${Math.floor(10000 + Math.random() * 90000)}`,
      vehicle: "",
      vehicle_type: "",
      driver: user?.id.toString() || "",
      driver_name: user?.fullName || "",
      driver_phone_number: user?.phoneNumber || "",
      origin: "",
      destination: "",
      
      // Financial information
      trip_cost: 0,
      pending_amount: 0,
      paid_amount: 0,
      
      // Status and dates
      status: "Upcoming",
      created_on: new Date().toISOString(),
      started_on: new Date().toISOString().substring(0, 16),
      ended_on: "",
      eta: "",
      eta_str: "",
      
      // Transporter details
      transporter: "",
      transporter_name: "",
      transporter_phone: "",
      
      // Odometer and images
      odo_start: "",
      odo_start_pic: "",
      odo_end: "",
      odo_end_pic: "",
      trip_pic: "",
      
      // Additional info
      documents: "",
      share_text: "",
      started_by: "Driver",
      is_active: true,
      handover_checklist: "",
      company_name: "",
    });
    setIsAddTripOpen(true);
  };

  const onSubmit = (data: TripFormValues) => {
    console.log("Form Data Submitted:", data);
    const formattedEta = data.eta ? new Date(data.eta).toISOString().replace('T', ' ').substring(0, 19) : "";
    const payload = { ...data, eta: formattedEta };
    if (editingTrip) {
      updateTripMutation.mutate({ trip_id: editingTrip.name || editingTrip.naming_series, trip: payload });
    } else {
      createTripMutation.mutate(payload);
    }
  };

  const handleDeleteTrip = (naming_series: string) => {
    setTripToDelete(naming_series);
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteTripMutation.mutate(tripToDelete);
    }
  };

  const toggleTripExpand = (naming_series: string) => {
    if (expandedTrips.includes(naming_series)) {
      setExpandedTrips(expandedTrips.filter(series => series !== naming_series));
    } else {
      setExpandedTrips([...expandedTrips, naming_series]);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-700 hover:bg-green-100";
      case "Running":
        return "bg-blue-50 text-blue-700 hover:bg-blue-100";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header showBack backTo="/driver/dashboard">
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          Trip Management
        </h1>
      </Header>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Your Trips</h2>
          <Button onClick={handleAddTrip} className="bg-[#FF6D00] hover:bg-[#E65100]">
            <Plus className="h-4 w-4 mr-2" />
            Add Trip
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6D00]" />
          </div>
        ) : trips && trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card key={trip.name || trip.naming_series} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="font-mono text-xs bg-neutral-200 py-1 px-2 rounded mr-2">{trip.naming_series}</div>
                          <Badge className={getStatusColor(trip.status)}>
                            {trip.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-neutral-500 text-sm mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-[#FF6D00]" />
                            <span className="font-medium text-neutral-800">{trip.origin}</span>
                            <span className="mx-2 text-neutral-400">→</span>
                            <span className="font-medium text-neutral-800">{trip.destination}</span>
                          </div>
                          {trip.vehicle_type && (
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 mr-2" />
                              <span>{trip.vehicle_type}</span>
                            </div>
                          )}
                          {trip.driver_name && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              <span>{trip.driver_name}</span>
                            </div>
                          )}
                          {trip.transporter_name && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>{trip.transporter_name}</span>
                            </div>
                          )}
                          {trip.trip_cost !== undefined && (
                            <div className="flex items-center">
                              <IndianRupee className="h-4 w-4 mr-2" />
                              <span>₹{(trip.trip_cost || 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {trip.started_on && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>{formatDate(trip.started_on)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingTrip(trip)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleTripExpand(trip.naming_series)}
                        >
                          {expandedTrips.includes(trip.naming_series) ? (
                            <ChevronUp className="h-4 w-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedTrips.includes(trip.naming_series) && (
                      <div className="pt-4 border-t mt-2">
                        {/* Timeline Information */}
                        <div className="mb-4 pb-4 border-b">
                          <h4 className="text-sm font-semibold mb-3">Trip Timeline</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-neutral-500">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Started:</span>
                              </div>
                              <p className="text-sm font-medium">{formatDate(trip.started_on)}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-neutral-500">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Ended:</span>
                              </div>
                              <p className="text-sm font-medium">{formatDate(trip.ended_on)}</p>
                            </div>
                            {trip.eta && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span>ETA:</span>
                                </div>
                                <p className="text-sm font-medium">{formatDate(trip.eta)}</p>
                              </div>
                            )}
                            {trip.eta_str && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Clock className="h-4 w-4 mr-2" />
                                  <span>ETA String:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.eta_str}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Vehicle & Driver Information */}
                        <div className="mb-4 pb-4 border-b">
                          <h4 className="text-sm font-semibold mb-3">Vehicle & Driver</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {trip.vehicle_type && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Truck className="h-4 w-4 mr-2" />
                                  <span>Vehicle Type:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.vehicle_type}</p>
                              </div>
                            )}
                            {trip.driver_name && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <User className="h-4 w-4 mr-2" />
                                  <span>Driver:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.driver_name}</p>
                              </div>
                            )}
                            {trip.transporter_name && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Users className="h-4 w-4 mr-2" />
                                  <span>Transporter:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.transporter_name}</p>
                              </div>
                            )}
                            {trip.started_by && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <User className="h-4 w-4 mr-2" />
                                  <span>Started By:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.started_by}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Trip Metrics */}
                        <div className="mb-4 pb-4 border-b">
                          <h4 className="text-sm font-semibold mb-3">Trip Metrics</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {trip.odo_start && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Truck className="h-4 w-4 mr-2" />
                                  <span>Odometer Start:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.odo_start}</p>
                              </div>
                            )}
                            {trip.odo_end && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <Truck className="h-4 w-4 mr-2" />
                                  <span>Odometer End:</span>
                                </div>
                                <p className="text-sm font-medium">{trip.odo_end}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Financial Details */}
                        <div className="mb-4 pb-4 border-b">
                          <h4 className="text-sm font-semibold mb-3">Financial Details</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-neutral-500">
                                <IndianRupee className="h-4 w-4 mr-2" />
                                <span>Trip Cost:</span>
                              </div>
                              <p className="text-sm font-medium">₹{(trip.trip_cost || 0).toLocaleString('en-IN')}</p>
                            </div>
                            {trip.paid_amount !== undefined && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <IndianRupee className="h-4 w-4 mr-2" />
                                  <span>Paid:</span>
                                </div>
                                <p className="text-sm font-medium">₹{trip.paid_amount.toLocaleString('en-IN')}</p>
                              </div>
                            )}
                            {trip.pending_amount !== undefined && (
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <IndianRupee className="h-4 w-4 mr-2" />
                                  <span>Pending:</span>
                                </div>
                                <p className="text-sm font-medium">₹{trip.pending_amount.toLocaleString('en-IN')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Additional Details */}
                        <div className="mb-4">
                          {trip.share_text && (
                            <div className="space-y-1 mb-4">
                              <div className="flex items-center text-sm text-neutral-500">
                                <FileText className="h-4 w-4 mr-2" />
                                <span>Notes:</span>
                              </div>
                              <p className="text-sm bg-neutral-50 p-2 rounded">{trip.share_text}</p>
                            </div>
                          )}
                          <div className="flex items-center mb-4">
                            <div className="flex items-center text-sm text-neutral-500 mr-2">
                              <Activity className="h-4 w-4 mr-1" />
                              <span>Status:</span>
                            </div>
                            <div className="flex">
                              <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                                trip.is_active 
                                  ? "bg-green-100 text-green-800"
                                  : "bg-neutral-100 text-neutral-800"
                              }`}>
                                {trip.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="mb-4">
              <MapPin className="mx-auto h-12 w-12 text-neutral-300" />
            </div>
            <CardTitle className="text-lg mb-2">No trips recorded yet</CardTitle>
            <CardDescription className="max-w-xs mx-auto mb-6">
              Start adding your trips to track your journey history, earnings, and performance.
            </CardDescription>
            <Button onClick={handleAddTrip} className="bg-[#FF6D00] hover:bg-[#E65100]">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Trip
            </Button>
          </Card>
        )}
      </div>

      {/* Add/Edit Trip Dialog */}
      <Dialog open={isAddTripOpen} onOpenChange={setIsAddTripOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrip ? "Edit Trip" : "Add New Trip"}</DialogTitle>
            <DialogDescription>
              {editingTrip 
                ? "Update your trip details below" 
                : "Enter your trip details to record your journey"
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              {/* Basic Trip Details */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Basic Details</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="naming_series"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip ID</FormLabel>
                        <FormControl>
                          <Input placeholder="TR-#####" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={value => {
                              field.onChange(value);
                              handleVehicleSelect(value);
                            }}
                            value={field.value || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles.map(v => (
                                <SelectItem key={v.name} value={v.name}>
                                  {v.registration_number || v.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Trip status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Upcoming">Upcoming</SelectItem>
                              <SelectItem value="Waiting">Waiting</SelectItem>
                              <SelectItem value="Running">Running</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <FormControl>
                          <Input value={selectedVehicle?.vehicle_type || field.value || ""} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="Starting location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="Ending location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Trip Dates */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Trip Timeline</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="started_on"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Started On</FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={field.value ? new Date(field.value) : null}
                            onChange={(date: Date | null) => field.onChange(date ? formatDateFns(date, "yyyy-MM-dd HH:mm:ss") : "")}
                            showTimeSelect
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            placeholderText="Select start date/time"
                            className="w-full border rounded px-2 py-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ended_on"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ended On</FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={field.value ? new Date(field.value) : null}
                            onChange={(date: Date | null) => field.onChange(date ? formatDateFns(date, "yyyy-MM-dd HH:mm:ss") : "")}
                            showTimeSelect
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            placeholderText="Select end date/time"
                            className="w-full border rounded px-2 py-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ETA</FormLabel>
                        <FormControl>
                          <DatePicker
                            selected={field.value ? new Date(field.value) : null}
                            onChange={(date: Date | null) => field.onChange(date ? formatDateFns(date, "yyyy-MM-dd HH:mm:ss") : "")}
                            showTimeSelect
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            placeholderText="Select ETA"
                            className="w-full border rounded px-2 py-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eta_str"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ETA String</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2 hours" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Driver/Transporter Information */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Driver & Transporter</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="driver_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driver_phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="transporter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transporter Company</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={value => {
                              field.onChange(value);
                              handleCompanySelect(value);
                            }}
                            value={field.value || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {transporters.map(t => (
                                <SelectItem key={t.name} value={t.name}>
                                  {t.company_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="transporter_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transporter Name</FormLabel>
                        <FormControl>
                          <Input value={selectedTransporter?.name1 || ""} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transporter_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transporter Phone</FormLabel>
                        <FormControl>
                          <Input value={selectedTransporter?.phone_number || ""} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Financial Information */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Financial Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="trip_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Cost (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" className="no-spinner" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paid_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" className="no-spinner" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pending_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pending Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" className="no-spinner" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Additional Trip Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="odo_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Odometer Start</FormLabel>
                        <FormControl>
                          <Input placeholder="Starting reading" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="odo_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Odometer End</FormLabel>
                        <FormControl>
                          <Input placeholder="Ending reading" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="pb-4">
                <h4 className="text-sm font-semibold mb-3">Additional Information</h4>
                
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="share_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Share Text</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notes about this trip" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="started_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Started By</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "Driver"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Who started this trip" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Driver">Driver</SelectItem>
                              <SelectItem value="Transporter">Transporter</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddTripOpen(false);
                    setEditingTrip(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#FF6D00] hover:bg-[#E65100]"
                  disabled={createTripMutation.isPending || updateTripMutation.isPending}
                >
                  {(createTripMutation.isPending || updateTripMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingTrip ? "Update Trip" : "Add Trip"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={tripToDelete !== null} onOpenChange={() => setTripToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteTripMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation userType="driver" />
    </div>
  );
};

export default DriverTripsPage;