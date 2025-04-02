import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  MapPin, 
  Filter,
  Search,
  Calendar,
  Clock,
  Truck,
  Tag,
  ChevronRight,
  Building,
  X
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";

// Sample job type (would normally be from shared schema)
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
  jobType: string;
  distance: string;
  description: string;
  requirements: string[];
  tags: string[];
}

const mockJobs: Job[] = [
  {
    id: 1,
    title: "Long-haul Truck Driver",
    company: "ABC Logistics",
    location: "Delhi to Mumbai",
    salary: "₹35,000/month",
    postedDate: "2 days ago",
    jobType: "Full-time",
    distance: "1,400 km",
    description: "We are looking for experienced truck drivers for our Delhi-Mumbai route. Regular trips with competitive pay and benefits.",
    requirements: ["5+ years experience", "Valid heavy vehicle license", "Clean driving record"],
    tags: ["Long Distance", "Heavy Vehicle", "Regular Routes"]
  },
  {
    id: 2,
    title: "City Delivery Driver",
    company: "FastExpress",
    location: "Delhi NCR",
    salary: "₹22,000/month",
    postedDate: "1 day ago",
    jobType: "Full-time",
    distance: "Local",
    description: "Delivering packages within Delhi NCR. Daily routes with company-provided vehicle.",
    requirements: ["2+ years experience", "Valid driving license", "Knowledge of Delhi roads"],
    tags: ["Local", "Light Vehicle", "Daily Routes"]
  },
  {
    id: 3,
    title: "Part-time Delivery Driver",
    company: "QuickServe",
    location: "Gurgaon",
    salary: "₹15,000/month",
    postedDate: "Just now",
    jobType: "Part-time",
    distance: "< 50 km",
    description: "Weekend and evening shifts available for food and grocery delivery in Gurgaon area.",
    requirements: ["Any experience level", "Two-wheeler or car", "Smartphone"],
    tags: ["Part-time", "Flexible Hours", "Two-wheeler"]
  },
  {
    id: 4,
    title: "Regional Truck Driver",
    company: "RegionalMove",
    location: "North India",
    salary: "₹30,000/month",
    postedDate: "3 days ago",
    jobType: "Contract",
    distance: "< 500 km",
    description: "Regional routes within North India. 3-5 day trips with competitive pay and allowances.",
    requirements: ["3+ years experience", "Valid medium/heavy vehicle license", "Willing to travel"],
    tags: ["Regional", "Medium Vehicle", "Contract"]
  },
  {
    id: 5,
    title: "Construction Vehicle Operator",
    company: "BuildTech Construction",
    location: "Noida",
    salary: "₹25,000/month",
    postedDate: "1 week ago",
    jobType: "Full-time",
    distance: "Project Site",
    description: "Operate construction vehicles at our project sites in Noida. Experience with dump trucks and cement mixers preferred.",
    requirements: ["3+ years in construction", "Heavy vehicle license", "Construction site experience"],
    tags: ["Construction", "Heavy Vehicle", "Site-based"]
  }
];

const DriverJobsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const jobTypes = ["Full-time", "Part-time", "Contract", "Temporary"];
  const vehicleTypes = ["Heavy Vehicle", "Medium Vehicle", "Light Vehicle", "Two-wheeler"];
  const distances = ["Local (< 50 km)", "Regional (< 500 km)", "Long Distance (500+ km)"];
  const experiences = ["Entry Level", "1-3 years", "3-5 years", "5+ years"];

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  // Local query client filter for mockJobs
  const filteredJobs = mockJobs.filter(job => {
    // Search query filter
    const matchesSearch = 
      searchQuery === "" || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    // Active filters
    const matchesFilters = activeFilters.length === 0 || 
      job.tags.some(tag => activeFilters.includes(tag)) ||
      activeFilters.includes(job.jobType);

    return matchesSearch && matchesFilters;
  });

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const displayJobs = searchQuery || activeFilters.length > 0 ? filteredJobs : mockJobs;

  const FilterSidebar = (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Job Type</h3>
        <div className="space-y-3">
          {jobTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`job-type-${type}`} 
                checked={activeFilters.includes(type)}
                onCheckedChange={() => toggleFilter(type)}
              />
              <Label htmlFor={`job-type-${type}`}>{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Vehicle Type</h3>
        <div className="space-y-3">
          {vehicleTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`vehicle-type-${type}`} 
                checked={activeFilters.includes(type)}
                onCheckedChange={() => toggleFilter(type)}
              />
              <Label htmlFor={`vehicle-type-${type}`}>{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Route Distance</h3>
        <div className="space-y-3">
          {distances.map(distance => (
            <div key={distance} className="flex items-center space-x-2">
              <Checkbox 
                id={`distance-${distance}`} 
                checked={activeFilters.includes(distance)}
                onCheckedChange={() => toggleFilter(distance)}
              />
              <Label htmlFor={`distance-${distance}`}>{distance}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Experience</h3>
        <div className="space-y-3">
          {experiences.map(exp => (
            <div key={exp} className="flex items-center space-x-2">
              <Checkbox 
                id={`exp-${exp}`} 
                checked={activeFilters.includes(exp)}
                onCheckedChange={() => toggleFilter(exp)}
              />
              <Label htmlFor={`exp-${exp}`}>{exp}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Other Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-jobs">Show new jobs only</Label>
            <Switch id="new-jobs" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="applied-jobs">Hide jobs I've applied to</Label>
            <Switch id="applied-jobs" />
          </div>
        </div>
      </div>

      {(activeFilters.length > 0) && (
        <>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-500">Active Filters:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-sm text-primary"
                onClick={() => setActiveFilters([])}
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(filter => (
                <Badge 
                  key={filter} 
                  variant="outline"
                  className="flex items-center gap-1 py-1"
                >
                  {filter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleFilter(filter)} />
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("find_jobs")}
        </h1>
      </Header>

      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              placeholder="Search jobs, companies, locations..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
                <SheetHeader className="mb-2">
                  <SheetTitle>Filter Jobs</SheetTitle>
                </SheetHeader>
                {FilterSidebar}
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar filters - visible on desktop */}
          {!isMobile && (
            <div className="hidden md:block w-64 bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden sticky top-4 self-start">
              {FilterSidebar}
            </div>
          )}

          {/* Main content */}
          <div className="flex-grow">
            <Tabs defaultValue="all">
              <div className="bg-white rounded-t-lg border border-neutral-200 p-1 mb-4">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="all">All Jobs</TabsTrigger>
                  <TabsTrigger value="saved">Saved</TabsTrigger>
                  <TabsTrigger value="applied">Applied</TabsTrigger>
                  <TabsTrigger value="matching">Best Match</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="space-y-4 mt-0">
                {displayJobs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                      <Search className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      We couldn't find any jobs matching your search criteria. Try adjusting your filters or search term.
                    </p>
                  </div>
                ) : (
                  displayJobs.map(job => (
                    <Card key={job.id} className="overflow-hidden hover:border-primary transition-colors duration-200">
                      <CardContent className="p-0">
                        <div className="p-4 sm:p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-neutral-900">{job.title}</h3>
                            <Badge variant={job.postedDate.includes("Just now") ? "default" : "outline"} className={job.postedDate.includes("Just now") ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                              {job.postedDate}
                            </Badge>
                          </div>

                          <div className="flex items-center mb-3">
                            <Building className="h-4 w-4 text-neutral-500 mr-2" />
                            <span className="text-neutral-700 font-medium">{job.company}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{job.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{job.salary}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{job.jobType}</span>
                            </div>
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{job.distance}</span>
                            </div>
                          </div>

                          <p className="text-neutral-600 mb-4">{job.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-800">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end mt-2">
                            <Button variant="outline" className="sm:w-auto w-full">Save Job</Button>
                            <Button className="sm:w-auto w-full">Apply Now</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {displayJobs.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" className="min-w-[150px]">
                      Load More <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved">
                <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <Truck className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No saved jobs yet</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    Jobs you save will appear here for easy access. Start browsing jobs and save the ones you're interested in.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="applied">
                <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <Calendar className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    Your job applications will be shown here. Start applying to jobs to track your application status.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="matching">
                <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <Truck className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Complete your profile first</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    To get personalized job matches, please complete your profile with your skills, experience, and preferences.
                  </p>
                  <Button className="mt-4">Complete Profile</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <BottomNavigation userType="driver" />
      <Chatbot />
    </div>
  );
};

export default DriverJobsPage;