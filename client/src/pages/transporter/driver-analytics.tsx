import React, { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Star, 
  Route, 
  AlertTriangle,
  IndianRupee,
  FileText,
  User,
  Phone,
  Calendar
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatsCard } from '@/components/analytics/stats-card';
import { AnalyticsChart } from '@/components/analytics/analytics-chart';
import { TripHistory } from '@/components/analytics/trip-history';
import { useAuth } from '@/contexts/auth-context';
import { useLanguageStore } from '@/lib/i18n';
import type { Trip } from '@/pages/types/trip';

// Mock data for analytics
const mockAnalytics = {
  driverId: 1,
  fullName: "John Doe",
  phoneNumber: "+91 98765 43210",
  profileImage: "",
  totalTrips: 156,
  completedTrips: 142,
  cancelledTrips: 14,
  totalDistance: 12500,
  averageTripDuration: 4.5,
  totalEarnings: 250000,
  averageRating: 4.7,
  experienceYears: 3,
  preferredVehicleTypes: ["Truck", "Mini Truck"],
  preferredLocations: ["Mumbai", "Delhi", "Bangalore"],
  recentTrips: [
    {
      name: "TRIP-001",
      naming_series: "TRIP-001",
      vehicle: "VEH-001",
      vehicle_type: "Truck",
      driver: "DRV-001",
      driver_name: "John Doe",
      driver_phone_number: "+91 98765 43210",
      origin: "Mumbai",
      destination: "Delhi",
      trip_cost: 15000,
      pending_amount: 0,
      paid_amount: 15000,
      handover_checklist: "",
      status: "completed",
      created_on: "2024-03-15T09:00:00.000Z",
      started_on: "2024-03-15T10:00:00.000Z",
      ended_on: "2024-03-16T15:00:00.000Z",
      eta: "",
      eta_str: "",
      transporter: "TRN-001",
      transporter_name: "Transporter Co.",
      transporter_phone: "+91 12345 67890",
      company_name: "",
      odo_start: "1000",
      odo_start_pic: "",
      odo_end: "1500",
      odo_end_pic: "",
      trip_pic: "",
      documents: "",
      share_text: "Completed trip successfully.",
      started_by: "Driver",
      is_active: false,
    },
    {
      name: "TRIP-002",
      naming_series: "TRIP-002",
      vehicle: "VEH-002",
      vehicle_type: "Mini Truck",
      driver: "DRV-001",
      driver_name: "John Doe",
      driver_phone_number: "+91 98765 43210",
      origin: "Delhi",
      destination: "Bangalore",
      trip_cost: 20000,
      pending_amount: 5000,
      paid_amount: 15000,
      handover_checklist: "",
      status: "in-progress",
      created_on: "2024-03-17T07:00:00.000Z",
      started_on: "2024-03-17T08:00:00.000Z",
      ended_on: null,
      eta: "2024-03-18T12:00:00.000Z",
      eta_str: "ETA: March 18, 12:00 PM",
      transporter: "TRN-001",
      transporter_name: "Transporter Co.",
      transporter_phone: "+91 12345 67890",
      company_name: "",
      odo_start: "1500",
      odo_start_pic: "",
      odo_end: null,
      odo_end_pic: "",
      trip_pic: "",
      documents: "",
      share_text: "Trip currently in progress.",
      started_by: "Driver",
      is_active: true,
    }
  ] as Trip[],
  monthlyTrips: [
    { month: "Oct", count: 25 },
    { month: "Nov", count: 28 },
    { month: "Dec", count: 22 },
    { month: "Jan", count: 30 },
    { month: "Feb", count: 27 },
    { month: "Mar", count: 24 }
  ],
  monthlyDistance: [
    { month: "Oct", distance: 2000 },
    { month: "Nov", distance: 2200 },
    { month: "Dec", distance: 1800 },
    { month: "Jan", distance: 2400 },
    { month: "Feb", distance: 2100 },
    { month: "Mar", distance: 2000 }
  ],
  monthlyEarnings: [
    { month: "Oct", earnings: 40000 },
    { month: "Nov", earnings: 44000 },
    { month: "Dec", earnings: 36000 },
    { month: "Jan", earnings: 48000 },
    { month: "Feb", earnings: 42000 },
    { month: "Mar", earnings: 40000 }
  ]
};

const DriverAnalyticsPage = () => {
  const { phoneNumber } = useParams<{ phoneNumber: string }>();
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header showBack backTo="/transporter/drivers">
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          Driver Analytics
        </h1>
      </Header>

      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/transporter/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/transporter/drivers">Drivers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{mockAnalytics.fullName}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Driver Profile Card */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            {/* Cover Photo - Orange Gradient */}
            <div className="h-24 bg-gradient-to-r from-[#FF6D00] to-[#FF9E45] relative">
              <Button 
                size="sm" 
                variant="secondary" 
                className="absolute bottom-4 right-4 text-xs"
                onClick={() => window.open(`tel:${mockAnalytics.phoneNumber}`)}
              >
                <Phone className="h-3 w-3 mr-1" />
                Contact Driver
              </Button>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6 relative">
              <div className="absolute -top-10 left-6">
                <Avatar className="h-20 w-20 border-4 border-white">
                  <AvatarImage src={mockAnalytics.profileImage} alt={mockAnalytics.fullName} />
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {mockAnalytics.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="pt-12">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{mockAnalytics.fullName}</h2>
                    <div className="flex items-center text-neutral-600 gap-2 mt-1">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-neutral-500" />
                        <span className="text-sm">{mockAnalytics.phoneNumber}</span>
                      </div>
                      
                      <span className="text-neutral-300">•</span>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-neutral-500" />
                        <span className="text-sm">{mockAnalytics.experienceYears} years exp.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-lg font-bold">{mockAnalytics.averageRating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {mockAnalytics.preferredVehicleTypes.map((type: string, index: number) => (
                    <Badge key={`vehicle-${index}`} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {type}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {mockAnalytics.preferredLocations.map((location: string, index: number) => (
                    <Badge key={`location-${index}`} variant="secondary" className="bg-neutral-100">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Trips"
            value={mockAnalytics.totalTrips}
            icon={<Route className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true, label: "vs last month" }}
          />
          
          <StatsCard
            title="Distance Covered"
            value={formatNumber(mockAnalytics.totalDistance)}
            valueSuffix=" km"
            icon={<Truck className="h-6 w-6" />}
            trend={{ value: 8, isPositive: true, label: "vs last month" }}
          />
          
          <StatsCard
            title="Avg Trip Duration"
            value={mockAnalytics.averageTripDuration.toFixed(1)}
            valueSuffix=" hrs"
            icon={<Clock className="h-6 w-6" />}
          />
          
          <StatsCard
            title="Total Earnings"
            valuePrefix="₹"
            value={formatNumber(mockAnalytics.totalEarnings)}
            icon={<IndianRupee className="h-6 w-6" />}
            trend={{ value: 5, isPositive: true, label: "vs last month" }}
          />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trips">Trip Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Monthly Trips Chart */}
            <AnalyticsChart
              title="Monthly Trips"
              description="Number of trips completed in the last 6 months"
              data={mockAnalytics.monthlyTrips}
              type="bar"
              xAxisKey="month"
              yAxisKey="count"
            />

            {/* Monthly Distance Chart */}
            <AnalyticsChart
              title="Monthly Distance Covered"
              description="Total kilometers driven per month"
              data={mockAnalytics.monthlyDistance}
              type="line"
              xAxisKey="month"
              yAxisKey="distance"
            />
            
            {/* Monthly Earnings Chart */}
            <AnalyticsChart
              title="Monthly Earnings"
              description="Driver's earnings trend over 6 months"
              data={mockAnalytics.monthlyEarnings}
              type="area"
              xAxisKey="month"
              yAxisKey="earnings"
            />
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <TripHistory trips={mockAnalytics.recentTrips} title="Trip History" />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
                
                <div className="space-y-4">
                  {/* Completion Rate */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mr-4">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Completion Rate</p>
                        <p className="text-sm text-neutral-500">Successfully completed trips</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">
                        {Math.round((mockAnalytics.completedTrips / mockAnalytics.totalTrips) * 100)}%
                      </p>
                      <p className="text-sm text-neutral-500">
                        {mockAnalytics.completedTrips} of {mockAnalytics.totalTrips} trips
                      </p>
                    </div>
                  </div>
                  
                  {/* Cancellation Rate */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 mr-4">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Cancellation Rate</p>
                        <p className="text-sm text-neutral-500">Cancelled or rejected trips</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">
                        {Math.round((mockAnalytics.cancelledTrips / mockAnalytics.totalTrips) * 100)}%
                      </p>
                      <p className="text-sm text-neutral-500">
                        {mockAnalytics.cancelledTrips} of {mockAnalytics.totalTrips} trips
                      </p>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 mr-4">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Average Rating</p>
                        <p className="text-sm text-neutral-500">Customer satisfaction level</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end">
                        <p className="font-medium text-lg mr-2">{mockAnalytics.averageRating.toFixed(1)}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-4 w-4 ${star <= Math.round(mockAnalytics.averageRating) 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-neutral-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-500">Out of 5.0</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation userType="transporter" />
    </div>
  );
};

export default DriverAnalyticsPage;