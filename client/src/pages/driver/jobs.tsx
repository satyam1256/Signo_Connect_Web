import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  X,
  Loader2,
  AlertTriangle,
  Users,
  UserCheck,
  BookmarkIcon,
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
import { toast } from "sonner";

const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY

interface Job {
  id: string;
  name: string;
  feed: string;
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
  numberOfOpenings?: string;
}

interface ApiJob {
  status: string;
  description: string;
  transporter: string;
  title: string;
  salary: string;
  type_of_job: string;
  no_of_openings: string;
  name: string;
  city: string;
  transporter_name: string;
  feed: string;
  creation?: string;
}

interface ApiResponse {
  status: boolean;
  data: ApiJob[];
}

interface AppliedJob {
  jobId: string;
  status: string;
  appliedOn: string;
}

interface ApplicationResponse {
  status: boolean;
  doc: {
    name: string;
    job: string;
    feed: string;
    driver: string;
    driver_name: string;
    driver_mobile: string;
    driver_status: string;
    transporter_status: string;
    applied_on: string;
  };
}
interface AppliedJobResponse {
  status: boolean;
  data: {
    name: string;
    job: string;
    feed: string;
    driver_status: string;
    applied_on: string;
  }[];
}

export const postJobApplication = async (jobId: string, feedId: string, driverId: string) => {
  const response = await fetch('https://internal.signodrive.com/api/method/signo_connect.api.proxy/Job Applications', {
    method: 'POST',
    headers: {
      'Authorization': `token ${frappe_token}`,
      'x-key': x_key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      job: jobId,
      feed: feedId,
      driver: driverId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit application');
  }

  return response.json();
};


// Function to transform API job data to our Job interface
const transformApiJobToJob = (apiJob: ApiJob): Job => {
  // Basic date formatting (can be improved with a library like date-fns if creation is a full timestamp)
  const { t } = useLanguageStore.getState(); // Access translation function here

  let postedDate = t("recently");
  if (apiJob.creation) {
    try {
      const date = new Date(apiJob.creation);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) postedDate = t("just_now");
      else if (diffDays === 1) postedDate = t("one_day_ago");
      else postedDate = t("days_ago", { count: diffDays });
    } catch (e) {
      // Keep translated "Recently" if date parsing fails
    }
  }

  // Translate job type
  const translatedJobType = apiJob.type_of_job === 'Full-time' ? t('full_time') : t('part_time');

  return {
    id: apiJob.feed || apiJob.name, // Use 'feed' as primary ID, fallback to 'name'
    title: apiJob.title,
    company: apiJob.transporter_name,
    location: apiJob.city,
    salary: `₹${parseInt(apiJob.salary, 10).toLocaleString('en-IN')}/month`, // Format salary
    postedDate: postedDate,
    jobType: translatedJobType, // Use translated job type
    distance: t("job_distance_placeholder"), // Use translated placeholder
    description: apiJob.description,
    requirements: [], // Default to empty as API doesn't provide it
    tags: [translatedJobType, apiJob.city].filter(Boolean) as string[], // Add translated job type and city as tags
    numberOfOpenings: apiJob.no_of_openings,
    name: apiJob.name, // Add this
    feed: apiJob.feed, // Add this
  };
};

const fetchJobs = async (): Promise<Job[]> => {
  try {
    const response = await fetch(`https://internal.signodrive.com/api/method/signo_connect.api.proxy/Job?fields=["*"]&limit_page_length=100`, {
      method: "GET",
      headers: {
        'Authorization': `token ${frappe_token}`,
        'x-key': x_key,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    
    const result: ApiResponse = await response.json();
    if (!result.status || !Array.isArray(result.data)) {
      throw new Error("Failed to fetch jobs or data is not in expected format");
    }
    
    return result.data.map(transformApiJobToJob);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

const fetchAppliedJobs = async (driverId: string): Promise<AppliedJob[]> => {
  const response = await fetch(
    `https://internal.signodrive.com/api/method/signo_connect.apis.driver.get_applied_jobs?driver_id=${driverId}`,{
      method : 'GET' ,
      headers: {
        'Authorization': `token ${frappe_token}`,
        'x-key': x_key,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch applied jobs');
  }

  const result: AppliedJobResponse = await response.json();
  
  return result.data.map(item => ({
    jobId: item.job,
    status: item.driver_status,
    appliedOn: item.applied_on
  }));
};

const DriverJobsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);


  const {
    data: fetchedJobs = [],
    isLoading,
    isError,
    error,
  } = useQuery<Job[], Error>({
    queryKey: ['driverJobs'],
    queryFn: fetchJobs,
    enabled: !!user,
  });

  const jobTypes = ["Full-time", "Part-time"];
  const salaryRanges = [
    { value: "0-15000", label: "₹0 - ₹15,000" },
    { value: "15000-30000", label: "₹15,000 - ₹30,000" },
    { value: "30000-50000", label: "₹30,000 - ₹50,000" },
    { value: "50000-100000", label: "₹50,000+" }
  ];
  const locations = Array.from(new Set(fetchedJobs?.map(job => job.location) || [])).sort();

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const filteredJobs = (fetchedJobs || []).filter(job => {
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
  
    const locationFilters = activeFilters.filter(filter => locations.includes(filter));
    const jobTypeFilters = activeFilters.filter(filter => jobTypes.includes(filter));
    const salaryFilters = activeFilters.filter(filter => salaryRanges.some(range => range.value === filter));
    const otherFilters = activeFilters.filter(filter => 
      !locations.includes(filter) && 
      !jobTypes.includes(filter) && 
      !salaryRanges.some(range => range.value === filter)
    );
  
    const matchesLocation = locationFilters.length === 0 || 
      locationFilters.some(filter => job.location === filter);
  
    const matchesJobType = jobTypeFilters.length === 0 || 
      jobTypeFilters.some(filter => job.jobType === filter);
  
    const matchesSalary = salaryFilters.length === 0 || 
      salaryFilters.some(filter => {
        const [min, max] = filter.split("-").map(Number);
        const jobSalary = parseInt(job.salary.replace(/[^0-9]/g, ""));
        if (max) {
          return jobSalary >= min && jobSalary <= max;
        }
        return jobSalary >= min;
      });
  
    const matchesOtherFilters = otherFilters.length === 0 ||
      otherFilters.every(filter => job.tags.includes(filter));
  
    return matchesSearch && matchesLocation && matchesJobType && matchesSalary && matchesOtherFilters;
  });
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }


  const queryClient = useQueryClient();

  const {
    data: appliedJobs = [],
    isLoading: isLoadingAppliedJobs,
  } = useQuery<AppliedJob[], Error>({
    queryKey: ['appliedJobs', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return fetchAppliedJobs(user.id);
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 30000,
  });


  const applyMutation = useMutation({
    mutationFn: async ({ jobId, feedId }: { jobId: string; feedId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      return postJobApplication(jobId, feedId, user.id);
    },
    onSuccess: (data: ApplicationResponse, variables) => {
      if (data.status) {
        // Show success message
        toast.success("Successfully applied to job!");
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['appliedJobs', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['driverJobs'] });
      } else {
        throw new Error("Failed to apply for job");
      }
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("Could not find Job")) {
          toast.error("Invalid job reference. Please try again later.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to apply for job");
      }
    }
  });

  const handleApplyJob = (job: Job) => {
    if (!user) {
      toast.error("Please login to apply for jobs");
      return;
    }

    if (appliedJobs.some(aj => aj.jobId === job.id)) {
      toast.info("You have already applied to this job");
      return;
    }

    applyMutation.mutate({
      jobId: job.name, // Use the actual job ID/name from the API
      feedId: job.feed, // Use the feed ID from the API
    });
  };

  const handleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      // Remove job from saved list if already saved
      setSavedJobs(prev => prev.filter(id => id !== jobId));
      toast.success("Job removed from saved list");
    } else {
      // Add job to saved list
      setSavedJobs(prev => [...prev, jobId]);
      toast.success("Job saved successfully");
    }
  };


  // Display all fetched jobs if no search/filter, otherwise display filtered
  const displayJobs = searchQuery || activeFilters.length > 0 ? filteredJobs : fetchedJobs;

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
      <h3 className="text-lg font-medium mb-4">Salary Range</h3>
      <div className="space-y-3">
        {salaryRanges.map(range => (
          <div key={range.value} className="flex items-center space-x-2">
            <Checkbox
              id={`salary-${range.value}`}
              checked={activeFilters.includes(range.value)}
              onCheckedChange={() => toggleFilter(range.value)}
            />
            <Label htmlFor={`salary-${range.value}`}>{range.label}</Label>
          </div>
        ))}
      </div>
    </div>

    <Separator />

    <div>
      <h3 className="text-lg font-medium mb-4">Location</h3>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {locations.map(location => (
          <div key={location} className="flex items-center space-x-2">
            <Checkbox
              id={`location-${location}`}
              checked={activeFilters.includes(location)}
              onCheckedChange={() => toggleFilter(location)}
            />
            <Label htmlFor={`location-${location}`}>{location}</Label>
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
              placeholder={t("search_placeholder")}
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
                  <SheetTitle>{t("filter_jobs")}</SheetTitle>
                </SheetHeader>
                {FilterSidebar}
              </SheetContent>
            </Sheet>
          ) : (
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="outline" size="icon" className="flex-shrink-0">
                   <Filter className="h-4 w-4" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                 <SheetHeader className="mb-2">
                   <SheetTitle>{t("filter_jobs")}</SheetTitle>
                 </SheetHeader>
                 {FilterSidebar}
               </SheetContent>
             </Sheet>
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
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3">
                  <TabsTrigger value="all">{t("all_jobs")}</TabsTrigger>
                  <TabsTrigger value="saved">{t("saved")}</TabsTrigger>
                  <TabsTrigger value="applied">{t("applied")}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="space-y-4 mt-0">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-neutral-200">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-neutral-700">{t("loading_jobs")}</h3>
                    <p className="text-neutral-500">{t("loading_jobs_message")}</p>
                  </div>
                )}

                {isError && !isLoading && (
                  <div className="text-center py-12 bg-white rounded-lg border border-red-200">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-red-700">{t("error_fetching_jobs")}</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      {t("error_fetching_jobs_message")}
                    </p>
                    {error && <p className="text-xs text-red-400 mt-2">Details: {error.message}</p>}
                  </div>
                )}

                {!isLoading && !isError && displayJobs.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                      <Search className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("no_jobs_found")}</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      {t("no_jobs_found_message")}
                    </p>
                  </div>
                )}

                {!isLoading && !isError && displayJobs.length > 0 && (
                  displayJobs.map(job => (
                    <Card key={job.id} className="overflow-hidden hover:border-primary transition-colors duration-200 bg-white">
                      <CardContent className="p-0">
                        <div className="p-4 sm:p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-neutral-900">{job.title}</h3>
                            <Badge variant={job.postedDate.includes(t("just_now")) || job.postedDate.includes(t("one_day_ago")) ? "default" : "outline"} className={job.postedDate.includes(t("just_now")) ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
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
                              <span className="text-neutral-600 text-sm">{t("job_location_label")}: {job.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{t("job_salary_label")}: {job.salary}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{t("job_type_label")}: {job.jobType}</span>
                            </div>
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 text-neutral-400 mr-2" />
                              <span className="text-neutral-600 text-sm">{t("job_distance_label")}: {job.distance}</span>
                            </div>
                             {job.numberOfOpenings && (
                                <div className="flex items-center">
                                    <Users className="h-4 w-4 text-neutral-400 mr-2" />
                                    <span className="text-neutral-600 text-sm">{t("job_openings_label")}: {job.numberOfOpenings} {t("openings")}</span>
                                </div>
                            )}
                          </div>

                          <p className="text-neutral-600 mb-4 text-sm">{t("description")}: {job.description}</p>

                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.tags.map((tag, index) => (
                                <Badge key={`${tag}-${index}`} variant="secondary" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-800">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end mt-2">
                            <Button 
                              variant="outline" 
                              className="sm:w-auto w-full"
                              onClick={() => handleSaveJob(job.id)}
                            >
                              {savedJobs.includes(job.id) ? (
                                <>
                                  <BookmarkIcon className="h-4 w-4 mr-2 fill-current" />
                                  {t("saved")}
                                </>
                              ) : (
                                <>
                                  <BookmarkIcon className="h-4 w-4 mr-2" />
                                  {t("save_job")}
                                </>
                              )}
                            </Button>
                            <Button 
                              className="sm:w-auto w-full"
                              onClick={() => handleApplyJob(job)}
                              disabled={applyMutation.isPending || appliedJobs.some(aj => aj.jobId === job.name)}
                              variant={appliedJobs.some(aj => aj.jobId === job.name) ? "secondary" : "default"}
                            >
                              {appliedJobs.some(aj => aj.jobId === job.name) ? (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  {t("applied")}
                                </>
                              ) : applyMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t("applying")}
                                </>
                              ) : (
                                t("apply_now")
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {!isLoading && !isError && displayJobs.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" className="min-w-[150px]" disabled>
                      {t("load_more")} <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="space-y-4 mt-0">
                {savedJobs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                      <BookmarkIcon className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("no_saved_jobs")}</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      {t("no_saved_jobs_message")}
                    </p>
                  </div>
                ) : (
                  <>
                    {fetchedJobs
                      .filter(job => savedJobs.includes(job.id))
                      .map(job => (
                        <Card key={job.id} className="overflow-hidden hover:border-primary transition-colors duration-200 bg-white">
                          <CardContent className="p-0">
                            <div className="p-4 sm:p-6">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-semibold text-neutral-900">{job.title}</h3>
                                <Badge variant="outline">
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
                                  <span className="text-neutral-600 text-sm">{t("job_location_label")}: {job.location}</span>
                                </div>
                                <div className="flex items-center">
                                  <Tag className="h-4 w-4 text-neutral-400 mr-2" />
                                  <span className="text-neutral-600 text-sm">{t("job_salary_label")}: {job.salary}</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end mt-2">
                                <Button 
                                  variant="outline" 
                                  className="sm:w-auto w-full"
                                  onClick={() => handleSaveJob(job.id)}
                                >
                                  <BookmarkIcon className="h-4 w-4 mr-2 fill-current" />
                                  {t("remove")}
                                </Button>
                                <Button 
                                  className="sm:w-auto w-full"
                                  onClick={() => handleApplyJob(job)}
                                  disabled={applyMutation.isPending || appliedJobs.some(aj => aj.jobId === job.name)}
                                  variant={appliedJobs.some(aj => aj.jobId === job.name) ? "secondary" : "default"}
                                >
                                  {appliedJobs.some(aj => aj.jobId === job.name) ? (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      {t("applied")}
                                    </>
                                  ) : applyMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      {t("applying")}
                                    </>
                                  ) : (
                                    t("apply_now")
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="applied" className="space-y-4 mt-0">
                {isLoadingAppliedJobs ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-neutral-200">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-neutral-700">{t("loading_applications")}</h3>
                  </div>
                ) : appliedJobs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                      <Calendar className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t("no_applications")}</h3>
                    <p className="text-neutral-500 max-w-md mx-auto">
                      {t("no_applications_message")}
                    </p>
                  </div>
                ) : (
                  <>
                    {appliedJobs.map(application => {
                      const job = fetchedJobs.find(j => j.name === application.jobId);
                      if (!job) return null;

                      return (
                        <Card key={application.jobId} className="overflow-hidden bg-white">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-xl font-semibold text-neutral-900">{job.title}</h3>
                              <Badge variant="outline">
                                {t("applied_on")} {new Date(application.appliedOn).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="flex items-center mb-3">
                              <Building className="h-4 w-4 text-neutral-500 mr-2" />
                              <span className="text-neutral-700 font-medium">{job.company}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                                <span className="text-neutral-600 text-sm">{t("job_location_label")}: {job.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Tag className="h-4 w-4 text-neutral-400 mr-2" />
                                <span className="text-neutral-600 text-sm">{t("job_salary_label")}: {job.salary}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={application.status === "Applied" ? "secondary" : "default"}
                              className="mt-2"
                            >
                              {t("status")}: {application.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}
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