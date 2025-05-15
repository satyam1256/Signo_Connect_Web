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
import type { Trip } from "@/types/trip";

// Form schema for trip validation
const tripFormSchema = z.object({
  // Basic trip details
  naming_series: z.string().optional(),
  vehicle: z.string().optional(),
  vehicle_type: z.string().optional(),
  driver: z.string().optional(),
  driver_name: z.string().optional(),
  driver_phone_number: z.string().optional(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  
  // Financial information
  trip_cost: z.coerce.number().nonnegative("Trip cost must be positive or zero").optional(),
  pending_amount: z.coerce.number().nonnegative("Pending amount must be positive or zero").optional(),
  paid_amount: z.coerce.number().nonnegative("Paid amount must be positive or zero").optional(),
  
  // Status and dates
  status: z.enum(["upcoming", "waiting", "completed", "in-progress", "cancelled"]),
  created_on: z.string().optional(),
  started_on: z.string().optional(),
  ended_on: z.string().optional(),
  eta: z.string().optional(),
  eta_str: z.string().optional(),
  
  // Transporter details
  transporter: z.string().optional(),
  transporter_name: z.string().optional(),
  
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
  const [expandedTrips, setExpandedTrips] = useState<number[]>([]);

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
      status: "upcoming",
      created_on: new Date().toISOString(),
      started_on: "",
      ended_on: "",
      eta: "",
      eta_str: "",
      
      // Transporter details
      transporter: "",
      transporter_name: "",
      
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
    },
  });

  // Get trips for the current driver
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/trips?driver_id=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch trips');
      return response.json();
    },
    enabled: !!user,
  });

  // Create trip mutation
  const createTripMutation = useMutation({
    mutationFn: async (data: TripFormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      const tripData = {
        ...data,
        driver: user.id.toString(),
      };
      
      return fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create trip');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', user?.id] });
      toast({
        title: "Trip added successfully",
        description: "Your trip has been recorded",
      });
      setIsAddTripOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding trip",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async (data: { id: number; trip: TripFormValues }) => {
      return fetch(`/api/trips/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.trip),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update trip');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips', user?.id] });
      toast({
        title: "Trip updated successfully",
        description: "Your trip has been updated",
      });
      setEditingTrip(null);
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
      queryClient.invalidateQueries({ queryKey: ['/api/trips', user?.id] });
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
        status: editingTrip.status as "upcoming" | "waiting" | "completed" | "in-progress" | "cancelled",
        created_on: editingTrip.created_on || new Date().toISOString(),
        started_on: editingTrip.started_on ? new Date(editingTrip.started_on).toISOString().substring(0, 16) : "",
        ended_on: editingTrip.ended_on ? new Date(editingTrip.ended_on).toISOString().substring(0, 16) : "",
        eta: editingTrip.eta ? new Date(editingTrip.eta).toISOString().substring(0, 16) : "",
        eta_str: editingTrip.eta_str || "",
        
        // Transporter details
        transporter: editingTrip.transporter || "",
        transporter_name: editingTrip.transporter_name || "",
        
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
      status: "upcoming",
      created_on: new Date().toISOString(),
      started_on: new Date().toISOString().substring(0, 16),
      ended_on: "",
      eta: "",
      eta_str: "",
      
      // Transporter details
      transporter: "",
      transporter_name: "",
      
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
    });
    setIsAddTripOpen(true);
  };

  const onSubmit = (data: TripFormValues) => {
    if (editingTrip) {
      updateTripMutation.mutate({ id: parseInt(editingTrip.naming_series, 10), trip: data });
    } else {
      createTripMutation.mutate(data);
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
    if (expandedTrips.includes(Number(naming_series))) {
      setExpandedTrips(expandedTrips.filter(series => series !== Number(naming_series)));
    } else {
      setExpandedTrips([...expandedTrips, Number(naming_series)]);
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
      case "completed":
        return "bg-green-50 text-green-700 hover:bg-green-100";
      case "in-progress":
        return "bg-blue-50 text-blue-700 hover:bg-blue-100";
      case "cancelled":
        return "bg-red-50 text-red-700 hover:bg-red-100";
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

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md">
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
                <Card key={trip.naming_series} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-neutral-50 border-b cursor-pointer" onClick={() => toggleTripExpand(trip.naming_series)}>
                  <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {trip.naming_series ? (
                    <div className="font-mono text-xs bg-neutral-200 py-1 px-2 rounded mr-2">{trip.naming_series}</div>
                    ) : null}
                    <MapPin className="h-4 w-4 text-[#FF6D00]" />
                    <div>
                    <span className="font-medium">{trip.origin}</span>
                    <span className="mx-2 text-neutral-400">→</span>
                    <span className="font-medium">{trip.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge className={getStatusColor(trip.status)}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Badge>
                    {expandedTrips.includes(Number(trip.naming_series)) ? (
                    <ChevronUp className="h-4 w-4 text-neutral-400 ml-2" />
                    ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-400 ml-2" />
                    )}
                  </div>
                  </div>
                </CardHeader>

                {expandedTrips.includes(Number(trip.naming_series)) && (
                  <CardContent className="p-4">
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
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingTrip(trip)}
                    >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                    </Button>
                    {/* Removed Delete Button */}
                  </div>
                  </CardContent>
                )}
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
        <DialogContent className="sm:max-w-md">
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
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="waiting">Waiting</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10-wheeler">10-wheeler</SelectItem>
                              <SelectItem value="16-wheeler">16-wheeler</SelectItem>
                              <SelectItem value="Mini Truck">Mini Truck</SelectItem>
                              <SelectItem value="Container">Container</SelectItem>
                              <SelectItem value="Tanker">Tanker</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
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
                          <Input type="datetime-local" {...field} />
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transporter_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transporter Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="started_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Started By</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Who started the trip" />
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
                          <Input type="number" min="0" step="1" {...field} />
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
                          <Input type="number" min="0" step="1" {...field} />
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
                          <Input type="number" min="0" step="1" {...field} />
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
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "true")}
                            defaultValue={field.value ? "true" : "false"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Active</SelectItem>
                              <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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