import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  MapPin, 
  Calendar,
  Clock,
  Truck,
  IndianRupee,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Trip } from "@/pages/types/trip";
import Cookies from "js-cookie";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

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

const formatDate = (dateString?: string) => {
  if (!dateString) return "Not set";
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  } catch (error) {
    return dateString;
  }
};

const TransporterTripsPage = () => {
  const [expandedTrips, setExpandedTrips] = useState<string[]>([]);
  const transporterId = Cookies.get("userId");
  const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
  const x_key = import.meta.env.VITE_FRAPPE_X_KEY;

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips", transporterId],
    queryFn: async () => {
      if (!transporterId) return [];
      const response = await fetch(`https://internal.signodrive.com/api/method/signo_connect.apis.trip.get_trips?transporter_id=${transporterId}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `token ${frappe_token}`,
          "x-key": x_key
        }
      });
      if (!response.ok) throw new Error("Failed to fetch trips");
      const json = await response.json();
      return json.data || json.message || json.trips || [];
    },
    enabled: !!transporterId,
  });

  const toggleTripExpand = (naming_series: string) => {
    if (expandedTrips.includes(naming_series)) {
      setExpandedTrips(expandedTrips.filter(series => series !== naming_series));
    } else {
      setExpandedTrips([...expandedTrips, naming_series]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header showBack backTo="/transporter/dashboard">
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          Trips
        </h1>
      </Header>
      <div className="flex-grow container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">All Trips</h2>
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
            <h2 className="text-lg mb-2">No trips recorded yet</h2>
            <p className="max-w-xs mx-auto mb-6">
              Start adding trips to track your fleet's journey history and performance.
            </p>
          </Card>
        )}
      </div>
      <BottomNavigation userType="transporter" />
    </div>
  );
};

export default TransporterTripsPage; 