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
  Users
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
  namingSeries: z.string().optional(),
  vehicleId: z.coerce.number().optional(),
  vehicleTypeId: z.coerce.number().optional(),
  driverId: z.coerce.number(),
  driverName: z.string().optional(),
  driverPhoneNumber: z.string().optional(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  
  // Financial information
  tripCost: z.coerce.number().nonnegative("Trip cost must be positive or zero").optional(),
  pendingAmount: z.coerce.number().nonnegative("Pending amount must be positive or zero").optional(),
  paidAmount: z.coerce.number().nonnegative("Paid amount must be positive or zero").optional(),
  
  // Status and dates
  status: z.enum(["upcoming", "waiting", "completed", "in-progress", "cancelled"]),
  startedOn: z.string().optional(),
  endedOn: z.string().optional(),
  eta: z.string().optional(),
  etaStr: z.string().optional(),
  
  // Transporter details
  transporterId: z.coerce.number().optional(),
  transporterName: z.string().optional(),
  
  // Odometer and images
  odoStart: z.string().optional(),
  odoStartPic: z.string().optional(),
  odoEnd: z.string().optional(),
  odoEndPic: z.string().optional(),
  tripPic: z.string().optional(),
  
  // Additional info
  shareText: z.string().optional(),
  startedBy: z.enum(["Driver", "Transporter"]).optional(),
  isActive: z.boolean().optional(),
  
  // Legacy fields (for backward compatibility)
  startDate: z.string().optional(),
  endDate: z.string().optional(), 
  distance: z.coerce.number().positive("Distance must be positive").optional(),
  duration: z.coerce.number().positive("Duration must be positive").optional(),
  vehicleType: z.string().optional(),
  earnings: z.coerce.number().nonnegative("Earnings must be positive or zero").optional(),
  rating: z.coerce.number().min(0).max(5).nullable().optional(),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

const DriverTripsPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);
  const [expandedTrips, setExpandedTrips] = useState<number[]>([]);

  // Form for creating/editing trips
  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      // Basic trip details
      namingSeries: "",
      origin: "",
      destination: "",
      
      // Financial information
      tripCost: 0,
      pendingAmount: 0,
      paidAmount: 0,
      
      // Status and dates
      status: "upcoming",
      
      // Additional info
      isActive: true,
      
      // Legacy fields
      distance: 0,
      duration: 0,
      vehicleType: "",
      earnings: 0,
      rating: null,
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
        driverId: user.id,
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
    mutationFn: async (id: number) => {
      return fetch(`/api/trips/${id}`, {
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
        namingSeries: editingTrip.namingSeries || "",
        origin: editingTrip.origin,
        destination: editingTrip.destination,
        
        // Financial information
        tripCost: editingTrip.tripCost ?? editingTrip.earnings ?? 0,
        pendingAmount: editingTrip.pendingAmount ?? 0,
        paidAmount: editingTrip.paidAmount ?? 0,
        
        // Status and dates
        status: editingTrip.status as "upcoming" | "waiting" | "completed" | "in-progress" | "cancelled",
        startedOn: editingTrip.startedOn ? new Date(editingTrip.startedOn).toISOString().substring(0, 16) : 
                 editingTrip.startDate ? new Date(editingTrip.startDate).toISOString().substring(0, 16) : "",
        endedOn: editingTrip.endedOn ? new Date(editingTrip.endedOn).toISOString().substring(0, 16) : 
               editingTrip.endDate ? new Date(editingTrip.endDate).toISOString().substring(0, 16) : "",
        eta: editingTrip.eta ? new Date(editingTrip.eta).toISOString().substring(0, 16) : "",
        etaStr: editingTrip.etaStr || "",
        
        // Driver & Transporter details
        driverName: editingTrip.driverName || user?.fullName || "",
        driverPhoneNumber: editingTrip.driverPhoneNumber || user?.phoneNumber || "",
        transporterId: editingTrip.transporterId,
        transporterName: editingTrip.transporterName || "",
        
        // Odometer and metrics
        odoStart: editingTrip.odoStart || "",
        odoEnd: editingTrip.odoEnd || "",
        
        // Additional info
        isActive: editingTrip.isActive ?? true,
        shareText: editingTrip.shareText || "",
        startedBy: editingTrip.startedBy === "Driver" || editingTrip.startedBy === "Transporter" ? editingTrip.startedBy : "Driver",
        
        // Legacy fields
        startDate: editingTrip.startDate ? new Date(editingTrip.startDate).toISOString().substring(0, 16) : "",
        endDate: editingTrip.endDate ? new Date(editingTrip.endDate).toISOString().substring(0, 16) : "",
        distance: editingTrip.distance ?? 0,
        duration: editingTrip.duration ?? 0,
        vehicleType: editingTrip.vehicleType || "",
        earnings: editingTrip.earnings ?? 0,
        rating: editingTrip.rating,
      });
      setIsAddTripOpen(true);
    }
  }, [editingTrip, form, user]);

  const handleAddTrip = () => {
    setEditingTrip(null);
    form.reset({
      // Basic trip details
      namingSeries: `TR-${Math.floor(10000 + Math.random() * 90000)}`,
      origin: "",
      destination: "",
      
      // Financial information
      tripCost: 0,
      pendingAmount: 0,
      paidAmount: 0,
      
      // Status and dates
      status: "upcoming",
      startedOn: new Date().toISOString().substring(0, 16),
      endedOn: "",
      eta: "",
      
      // Driver details - pre-populate with current user if available
      driverName: user?.fullName || "",
      driverPhoneNumber: user?.phoneNumber || "",
      
      // Additional info
      isActive: true,
      shareText: "",
      startedBy: "Driver",
      
      // Legacy fields
      startDate: new Date().toISOString().substring(0, 16),
      endDate: new Date().toISOString().substring(0, 16),
      distance: 0,
      duration: 0,
      vehicleType: "",
      earnings: 0,
      rating: null,
    });
    setIsAddTripOpen(true);
  };

  const onSubmit = (data: TripFormValues) => {
    if (editingTrip) {
      updateTripMutation.mutate({ id: editingTrip.id, trip: data });
    } else {
      createTripMutation.mutate(data);
    }
  };

  const handleDeleteTrip = (id: number) => {
    setTripToDelete(id);
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteTripMutation.mutate(tripToDelete);
    }
  };

  const toggleTripExpand = (id: number) => {
    if (expandedTrips.includes(id)) {
      setExpandedTrips(expandedTrips.filter(tripId => tripId !== id));
    } else {
      setExpandedTrips([...expandedTrips, id]);
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
              <Card key={trip.id} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-neutral-50 border-b cursor-pointer" onClick={() => toggleTripExpand(trip.id)}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {trip.namingSeries ? (
                        <div className="font-mono text-xs bg-neutral-200 py-1 px-2 rounded mr-2">{trip.namingSeries}</div>
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
                      {expandedTrips.includes(trip.id) ? (
                        <ChevronUp className="h-4 w-4 text-neutral-400 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-neutral-400 ml-2" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedTrips.includes(trip.id) && (
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
                          <p className="text-sm font-medium">{formatDate(trip.startedOn || trip.startDate)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-neutral-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Ended:</span>
                          </div>
                          <p className="text-sm font-medium">{formatDate(trip.endedOn || trip.endDate)}</p>
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
                        
                        {trip.etaStr && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>ETA String:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.etaStr}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Vehicle & Driver Information */}
                    <div className="mb-4 pb-4 border-b">
                      <h4 className="text-sm font-semibold mb-3">Vehicle & Driver</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {trip.vehicleType && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <Truck className="h-4 w-4 mr-2" />
                              <span>Vehicle Type:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.vehicleType}</p>
                          </div>
                        )}
                        
                        {trip.driverName && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <User className="h-4 w-4 mr-2" />
                              <span>Driver:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.driverName}</p>
                          </div>
                        )}
                        
                        {trip.transporterName && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <Users className="h-4 w-4 mr-2" />
                              <span>Transporter:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.transporterName}</p>
                          </div>
                        )}
                        
                        {trip.startedBy && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <User className="h-4 w-4 mr-2" />
                              <span>Started By:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.startedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Trip Metrics */}
                    <div className="mb-4 pb-4 border-b">
                      <h4 className="text-sm font-semibold mb-3">Trip Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {trip.distance !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>Distance:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.distance} km</p>
                          </div>
                        )}
                        
                        {trip.duration !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Duration:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.duration} hrs</p>
                          </div>
                        )}
                        
                        {trip.odoStart && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <Truck className="h-4 w-4 mr-2" />
                              <span>Odometer Start:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.odoStart}</p>
                          </div>
                        )}
                        
                        {trip.odoEnd && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <Truck className="h-4 w-4 mr-2" />
                              <span>Odometer End:</span>
                            </div>
                            <p className="text-sm font-medium">{trip.odoEnd}</p>
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
                          <p className="text-sm font-medium">₹{(trip.tripCost || trip.earnings || 0).toLocaleString('en-IN')}</p>
                        </div>
                        
                        {trip.paidAmount !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <IndianRupee className="h-4 w-4 mr-2" />
                              <span>Paid:</span>
                            </div>
                            <p className="text-sm font-medium">₹{trip.paidAmount.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        
                        {trip.pendingAmount !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-neutral-500">
                              <IndianRupee className="h-4 w-4 mr-2" />
                              <span>Pending:</span>
                            </div>
                            <p className="text-sm font-medium">₹{trip.pendingAmount.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Details */}
                    <div className="mb-4">
                      {trip.shareText && (
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center text-sm text-neutral-500">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Notes:</span>
                          </div>
                          <p className="text-sm bg-neutral-50 p-2 rounded">{trip.shareText}</p>
                        </div>
                      )}
                      
                      {trip.rating !== null && (
                        <div className="flex items-center mb-4">
                          <div className="flex items-center text-sm text-neutral-500 mr-2">
                            <Star className="h-4 w-4 mr-1" />
                            <span>Rating:</span>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (trip.rating || 0)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-neutral-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteTrip(trip.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
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
                    name="namingSeries"
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
                    name="vehicleType"
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
                    name="startedOn"
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
                    name="endedOn"
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
                    name="etaStr"
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
                    name="driverName"
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
                    name="driverPhoneNumber"
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
                    name="transporterName"
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
                    name="startedBy"
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
                    name="tripCost"
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
                    name="paidAmount"
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
                    name="pendingAmount"
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
              
              {/* Trip Metrics */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold mb-3">Trip Metrics</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (km)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (hours)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="odoStart"
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
                    name="odoEnd"
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
                    name="shareText"
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
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "null" ? null : value ? parseFloat(value) : null)} 
                            defaultValue={field.value?.toString() || "null"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Trip rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">No rating</SelectItem>
                              <SelectItem value="1">1 - Poor</SelectItem>
                              <SelectItem value="2">2 - Fair</SelectItem>
                              <SelectItem value="3">3 - Good</SelectItem>
                              <SelectItem value="4">4 - Very Good</SelectItem>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end space-x-2 space-y-0 mt-8">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Trip is active</FormLabel>
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