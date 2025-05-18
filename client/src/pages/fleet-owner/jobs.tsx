import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Building,
  Users,
  Briefcase,
  BadgeIndianRupee,
  Clock,
  Truck,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BellRing,
  User,
  Phone,
  Mail
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";

interface Job {
  id: number;
  title: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  applicantsCount: number;
  postedDate: string;
  status: 'active' | 'paused' | 'filled' | 'expired';
  jobType: string;
  vehicleType: string;
  experience: string;
  viewsCount: number;
}

interface Applicant {
  id: number;
  name: string;
  location: string;
  experience: string;
  appliedDate: string;
  status: 'pending' | 'viewed' | 'shortlisted' | 'rejected';
  phone: string;
  email?: string;
  photo?: string;
}

const mockJobs: Job[] = [
  {
    id: 1,
    title: "Long-haul Truck Driver",
    location: "Delhi to Mumbai",
    salary: "₹35,000-45,000/month",
    description: "We're looking for experienced truck drivers for our Delhi-Mumbai route. Regular trips with competitive pay and benefits.",
    requirements: ["5+ years experience", "Valid heavy vehicle license", "Clean driving record"],
    applicantsCount: 12,
    postedDate: "2 days ago",
    status: 'active',
    jobType: "Full-time",
    vehicleType: "Heavy Vehicle",
    experience: "5+ years",
    viewsCount: 145
  },
  {
    id: 2,
    title: "City Delivery Driver",
    location: "Delhi NCR",
    salary: "₹22,000-28,000/month",
    description: "Delivering packages within Delhi NCR. Daily routes with company-provided vehicle.",
    requirements: ["2+ years experience", "Valid driving license", "Knowledge of Delhi roads"],
    applicantsCount: 8,
    postedDate: "1 week ago",
    status: 'active',
    jobType: "Full-time",
    vehicleType: "Light Vehicle",
    experience: "2+ years",
    viewsCount: 98
  },
  {
    id: 3,
    title: "Part-time Delivery Driver",
    location: "Gurgaon",
    salary: "₹15,000-18,000/month",
    description: "Weekend and evening shifts available for food and grocery delivery in Gurgaon area.",
    requirements: ["Any experience level", "Two-wheeler or car", "Smartphone"],
    applicantsCount: 5,
    postedDate: "3 days ago",
    status: 'paused',
    jobType: "Part-time",
    vehicleType: "Two-wheeler",
    experience: "Entry Level",
    viewsCount: 57
  },
  {
    id: 4,
    title: "Regional Truck Driver",
    location: "North India",
    salary: "₹30,000-40,000/month",
    description: "Regional routes within North India. 3-5 day trips with competitive pay and allowances.",
    requirements: ["3+ years experience", "Valid medium/heavy vehicle license", "Willing to travel"],
    applicantsCount: 0,
    postedDate: "Just now",
    status: 'active',
    jobType: "Contract",
    vehicleType: "Medium Vehicle",
    experience: "3+ years",
    viewsCount: 12
  }
];

const mockApplicants: Applicant[] = [
  {
    id: 1,
    name: "Rahul Kumar",
    location: "Delhi",
    experience: "7 years",
    appliedDate: "2 days ago",
    status: 'shortlisted',
    phone: "+91 9876543210",
    email: "rahul.k@example.com"
  },
  {
    id: 2,
    name: "Amit Singh",
    location: "Gurgaon",
    experience: "5 years",
    appliedDate: "3 days ago",
    status: 'viewed',
    phone: "+91 9876543211"
  },
  {
    id: 3,
    name: "Vikram Sharma",
    location: "Noida",
    experience: "8 years",
    appliedDate: "1 day ago",
    status: 'pending',
    phone: "+91 9876543212",
    email: "vikram.s@example.com"
  },
  {
    id: 4,
    name: "Manish Patel",
    location: "Delhi",
    experience: "4 years",
    appliedDate: "4 days ago",
    status: 'rejected',
    phone: "+91 9876543213"
  },
  {
    id: 5,
    name: "Sanjay Gupta",
    location: "Faridabad",
    experience: "6 years",
    appliedDate: "2 days ago",
    status: 'pending',
    phone: "+91 9876543214"
  }
];

const FleetOwnerJobsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);

  // New job form
  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    salary: "",
    description: "",
    requirements: [""],
    jobType: "Full-time",
    vehicleType: "Heavy Vehicle",
    experience: "3+ years"
  });

  // Filter jobs based on search and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      searchQuery === "" || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter applicants for selected job
  const jobApplicants = applicants.filter(applicant => true); // In a real app, filter by job ID

  const handleStatusChange = (jobId: number, newStatus: 'active' | 'paused' | 'filled' | 'expired') => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  };

  const handleDeleteJob = (jobId: number) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const handleApplicantStatusChange = (applicantId: number, newStatus: 'pending' | 'viewed' | 'shortlisted' | 'rejected') => {
    setApplicants(applicants.map(applicant => 
      applicant.id === applicantId ? { ...applicant, status: newStatus } : applicant
    ));
  };

  const addRequirementField = () => {
    setNewJob({
      ...newJob,
      requirements: [...newJob.requirements, ""]
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const updatedRequirements = [...newJob.requirements];
    updatedRequirements[index] = value;
    setNewJob({
      ...newJob,
      requirements: updatedRequirements
    });
  };

  const removeRequirement = (index: number) => {
    if (newJob.requirements.length <= 1) return;

    const updatedRequirements = [...newJob.requirements];
    updatedRequirements.splice(index, 1);
    setNewJob({
      ...newJob,
      requirements: updatedRequirements
    });
  };

  const handleCreateJob = () => {
    // Validate form fields
    if (!newJob.title || !newJob.location || !newJob.salary || !newJob.description) {
      alert("Please fill in all required fields");
      return;
    }

    const filteredRequirements = newJob.requirements.filter(req => req.trim() !== "");

    if (filteredRequirements.length === 0) {
      alert("Please add at least one job requirement");
      return;
    }

    // Create new job
    const createdJob: Job = {
      id: Math.max(0, ...jobs.map(j => j.id)) + 1,
      title: newJob.title,
      location: newJob.location,
      salary: newJob.salary,
      description: newJob.description,
      requirements: filteredRequirements,
      applicantsCount: 0,
      postedDate: "Just now",
      status: 'active',
      jobType: newJob.jobType,
      vehicleType: newJob.vehicleType,
      experience: newJob.experience,
      viewsCount: 0
    };

    setJobs([createdJob, ...jobs]);

    // Reset form
    setNewJob({
      title: "",
      location: "",
      salary: "",
      description: "",
      requirements: [""],
      jobType: "Full-time",
      vehicleType: "Heavy Vehicle",
      experience: "3+ years"
    });

    setIsCreatingJob(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("jobs")}
        </h1>
      </Header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-grow w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                placeholder="Search jobs by title, location..."
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="whitespace-nowrap">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Post Job
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Post a New Job</SheetTitle>
                    <SheetDescription>
                      Fill in the details to create a new job posting
                    </SheetDescription>
                  </SheetHeader>
                  {/* New Job Form */}
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Long-haul Truck Driver"
                        value={newJob.title}
                        onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          placeholder="e.g., Delhi to Mumbai"
                          value={newJob.location}
                          onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Salary</Label>
                        <Input 
                          id="salary" 
                          placeholder="e.g., ₹30,000-40,000/month"
                          value={newJob.salary}
                          onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobType">Job Type</Label>
                        <Select 
                          value={newJob.jobType}
                          onValueChange={(value) => setNewJob({...newJob, jobType: value})}
                        >
                          <SelectTrigger id="jobType">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Select 
                          value={newJob.vehicleType}
                          onValueChange={(value) => setNewJob({...newJob, vehicleType: value})}
                        >
                          <SelectTrigger id="vehicleType">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Heavy Vehicle">Heavy Vehicle</SelectItem>
                            <SelectItem value="Medium Vehicle">Medium Vehicle</SelectItem>
                            <SelectItem value="Light Vehicle">Light Vehicle</SelectItem>
                            <SelectItem value="Two-wheeler">Two-wheeler</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience Required</Label>
                        <Select 
                          value={newJob.experience}
                          onValueChange={(value) => setNewJob({...newJob, experience: value})}
                        >
                          <SelectTrigger id="experience">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entry Level">Entry Level</SelectItem>
                            <SelectItem value="1+ year">1+ year</SelectItem>
                            <SelectItem value="2+ years">2+ years</SelectItem>
                            <SelectItem value="3+ years">3+ years</SelectItem>
                            <SelectItem value="5+ years">5+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Enter detailed job description, responsibilities, etc."
                        rows={4}
                        value={newJob.description}
                        onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Requirements</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addRequirementField}
                        >
                          Add Requirement
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {newJob.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input 
                              placeholder={`Requirement ${index + 1}`}
                              value={req}
                              onChange={(e) => updateRequirement(index, e.target.value)}
                            />
                            {newJob.requirements.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeRequirement(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <SheetFooter>
                    <Button variant="outline" onClick={() => setIsCreatingJob(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob}>Post Job</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ) : (
              <Dialog open={isCreatingJob} onOpenChange={setIsCreatingJob}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Post Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Post a New Job</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new job posting
                    </DialogDescription>
                  </DialogHeader>

                  {/* New Job Form */}
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Long-haul Truck Driver"
                        value={newJob.title}
                        onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          placeholder="e.g., Delhi to Mumbai"
                          value={newJob.location}
                          onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Salary</Label>
                        <Input 
                          id="salary" 
                          placeholder="e.g., ₹30,000-40,000/month"
                          value={newJob.salary}
                          onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobType">Job Type</Label>
                        <Select 
                          value={newJob.jobType}
                          onValueChange={(value) => setNewJob({...newJob, jobType: value})}
                        >
                          <SelectTrigger id="jobType">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Select 
                          value={newJob.vehicleType}
                          onValueChange={(value) => setNewJob({...newJob, vehicleType: value})}
                        >
                          <SelectTrigger id="vehicleType">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Heavy Vehicle">Heavy Vehicle</SelectItem>
                            <SelectItem value="Medium Vehicle">Medium Vehicle</SelectItem>
                            <SelectItem value="Light Vehicle">Light Vehicle</SelectItem>
                            <SelectItem value="Two-wheeler">Two-wheeler</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience Required</Label>
                        <Select 
                          value={newJob.experience}
                          onValueChange={(value) => setNewJob({...newJob, experience: value})}
                        >
                          <SelectTrigger id="experience">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entry Level">Entry Level</SelectItem>
                            <SelectItem value="1+ year">1+ year</SelectItem>
                            <SelectItem value="2+ years">2+ years</SelectItem>
                            <SelectItem value="3+ years">3+ years</SelectItem>
                            <SelectItem value="5+ years">5+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Enter detailed job description, responsibilities, etc."
                        rows={4}
                        value={newJob.description}
                        onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Requirements</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addRequirementField}
                        >
                          Add Requirement
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {newJob.requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input 
                              placeholder={`Requirement ${index + 1}`}
                              value={req}
                              onChange={(e) => updateRequirement(index, e.target.value)}
                            />
                            {newJob.requirements.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeRequirement(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatingJob(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob}>Post Job</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({jobs.filter(j => j.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="applicants">Applicants ({applicants.length})</TabsTrigger>
            <TabsTrigger value="saved">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <Briefcase className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                  <p className="text-neutral-500 max-w-md mx-auto mb-4">
                    {searchQuery || statusFilter !== "all" 
                      ? "No jobs match your current filters. Try adjusting your search criteria."
                      : "You haven't posted any jobs yet. Post your first job to start finding drivers."}
                  </p>
                  <Button onClick={() => setIsCreatingJob(true)}>Post Your First Job</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <Card key={job.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-semibold text-neutral-900">{job.title}</h3>
                              <Badge variant={
                                job.status === 'active' ? 'default' : 
                                job.status === 'paused' ? 'outline' : 
                                job.status === 'filled' ? 'secondary' : 
                                'destructive'
                              }>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-neutral-500 text-sm mb-3">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-2" />
                                <span>{user?.fullName || "Your Company"}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center">
                                <BadgeIndianRupee className="h-4 w-4 mr-2" />
                                <span>{job.salary}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Posted {job.postedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center sm:items-start gap-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size={isMobile ? "sm" : "default"}>
                                  <Eye className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">View Details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Job Details</DialogTitle>
                                </DialogHeader>

                                <div className="py-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-2xl font-semibold text-neutral-900">{job.title}</h2>
                                    <Badge variant={
                                      job.status === 'active' ? 'default' : 
                                      job.status === 'paused' ? 'outline' : 
                                      job.status === 'filled' ? 'secondary' : 
                                      'destructive'
                                    }>
                                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                                    <div className="flex items-center">
                                      <Building className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Company</h4>
                                        <p className="text-neutral-600">{user?.fullName || "Your Company"}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <MapPin className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Location</h4>
                                        <p className="text-neutral-600">{job.location}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <BadgeIndianRupee className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Salary</h4>
                                        <p className="text-neutral-600">{job.salary}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <Calendar className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Posted Date</h4>
                                        <p className="text-neutral-600">{job.postedDate}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <Clock className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Job Type</h4>
                                        <p className="text-neutral-600">{job.jobType}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <Truck className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Vehicle Type</h4>
                                        <p className="text-neutral-600">{job.vehicleType}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <Briefcase className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Experience</h4>
                                        <p className="text-neutral-600">{job.experience}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <Eye className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Views</h4>
                                        <p className="text-neutral-600">{job.viewsCount} views</p>
                                      </div>
                                    </div>
                                  </div>

                                  <Separator className="mb-4" />

                                  <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-3">Job Description</h3>
                                    <p className="text-neutral-700 whitespace-pre-line">{job.description}</p>
                                  </div>

                                  <div>
                                    <h3 className="text-lg font-medium mb-3">Requirements</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                                      {job.requirements.map((req, index) => (
                                        <li key={index}>{req}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Edit Job
                                  </Button>
                                  <Button onClick={() => {}}>
                                    View Applicants ({job.applicantsCount})
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="default"
                              size={isMobile ? "sm" : "default"}
                              onClick={() => {
                                setSelectedJob(job);
                                setShowApplicants(true);
                              }}
                            >
                              <Users className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Applicants</span>
                              <Badge className="ml-1">{job.applicantsCount}</Badge>
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {}}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Job
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {}}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {job.status === 'active' ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'paused')}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Pause Job
                                  </DropdownMenuItem>
                                ) : job.status === 'paused' ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'active')}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Activate Job
                                  </DropdownMenuItem>
                                ) : null}

                                <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'filled')}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark as Filled
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Job
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <p className="text-neutral-700 line-clamp-2 mb-3">{job.description}</p>

                        <Separator className="mb-3" />

                        <div className="flex flex-wrap gap-2 mb-1">
                          {job.requirements.map((req, index) => (
                            <Badge key={index} variant="outline">
                              {req}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end mt-4">
                          <div className="flex items-center justify-between w-full sm:w-auto">
                            <div className="flex items-center text-neutral-500 text-sm sm:hidden">
                              <Eye className="h-4 w-4 mr-1" />
                              <span>{job.viewsCount} views</span>
                            </div>

                            <div className="flex sm:hidden items-center gap-2">
                              <Label htmlFor={`status-${job.id}`} className="text-sm">Status:</Label>
                              <Select 
                                value={job.status}
                                onValueChange={(value) => handleStatusChange(job.id, value as any)}
                              >
                                <SelectTrigger id={`status-${job.id}`} className="h-8 w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                  <SelectItem value="filled">Filled</SelectItem>
                                  <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-2 text-neutral-500 text-sm">
                            <Eye className="h-4 w-4" />
                            <span>{job.viewsCount} views</span>
                          </div>

                          <div className="hidden sm:flex items-center gap-3">
                            <Label htmlFor={`desktop-status-${job.id}`} className="text-sm">Status:</Label>
                            <Select 
                              value={job.status}
                              onValueChange={(value) => handleStatusChange(job.id, value as any)}
                            >
                              <SelectTrigger id={`desktop-status-${job.id}`} className="h-9 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="filled">Filled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-0 space-y-4">
            {jobs.filter(job => job.status === 'active').length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                    <Briefcase className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No active jobs</h3>
                  <p className="text-neutral-500 max-w-md mx-auto mb-4">
                    You don't have any active job postings at the moment. Create a new job or activate paused jobs.
                  </p>
                  <Button onClick={() => setIsCreatingJob(true)}>Post New Job</Button>
                </CardContent>
              </Card>
            ) : (
              jobs.filter(job => job.status === 'active').map(job => (
                <Card key={job.id} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-semibold text-neutral-900">{job.title}</h3>
                          <Badge>Active</Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-neutral-500 text-sm mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center">
                            <BadgeIndianRupee className="h-4 w-4 mr-2" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Posted {job.postedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center sm:items-start gap-3">
                        <Button
                          variant="outline"
                          size={isMobile ? "sm" : "default"}
                          onClick={() => {}}
                        >
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View Details</span>
                        </Button>

                        <Button
                          variant="default"
                          size={isMobile ? "sm" : "default"}
                          onClick={() => {
                            setSelectedJob(job);
                            setShowApplicants(true);
                          }}
                        >
                          <Users className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Applicants</span>
                          <Badge className="ml-1">{job.applicantsCount}</Badge>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'paused')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Pause Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'filled')}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Filled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="text-neutral-700 line-clamp-2 mb-3">{job.description}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mt-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{job.jobType}</Badge>
                        <Badge variant="outline">{job.vehicleType}</Badge>
                        <Badge variant="outline">{job.experience}</Badge>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-500 text-sm">
                        <Eye className="h-4 w-4" />
                        <span>{job.viewsCount} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="applicants" className="mt-0">
            <Sheet open={showApplicants} onOpenChange={setShowApplicants}>
              <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Applicants {selectedJob ? `for ${selectedJob.title}` : ""}</SheetTitle>
                  <SheetDescription>
                    Review and manage job applications
                  </SheetDescription>
                </SheetHeader>

                <div className="py-4 space-y-4">
                  {jobApplicants.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                        <Users className="h-6 w-6 text-neutral-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No applicants yet</h3>
                      <p className="text-neutral-500 max-w-md mx-auto">
                        This job doesn't have any applicants yet. Check back later or promote your job post.
                      </p>
                    </div>
                  ) : (
                    jobApplicants.map((applicant) => (
                      <Card key={applicant.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-neutral-500" />
                              </div>

                              <div>
                                <h4 className="font-medium">{applicant.name}</h4>
                                <div className="flex flex-col text-sm text-neutral-500 mt-1">
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>{applicant.location}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    <span>{applicant.experience} experience</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Badge variant={
                              applicant.status === 'shortlisted' ? 'default' :
                              applicant.status === 'viewed' ? 'outline' :
                              applicant.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-neutral-500">Applied {applicant.appliedDate}</span>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Change Status
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleApplicantStatusChange(applicant.id, 'viewed')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Mark as Viewed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApplicantStatusChange(applicant.id, 'shortlisted')}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Shortlist
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApplicantStatusChange(applicant.id, 'rejected')}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <Button variant="secondary" size="sm" className="w-full">
                              View Profile
                            </Button>
                            <Button size="sm" className="w-full">
                              Contact
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Card>
              <CardHeader>
                <CardTitle>Job Applicants</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {applicants.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                      <Users className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No applicants yet</h3>
                    <p className="text-neutral-500 max-w-md mx-auto mb-4">
                      Your job postings don't have any applicants yet. Promote your job posts to attract more candidates.
                    </p>
                    <Button onClick={() => setIsCreatingJob(true)}>Post New Job</Button>
                  </div>
                ) : (
                  <div className="grid divide-y divide-neutral-100">
                    {applicants.map((applicant) => (
                      <div key={applicant.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-neutral-500" />
                          </div>

                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-lg">{applicant.name}</h4>
                              <Badge variant={
                                applicant.status === 'shortlisted' ? 'default' :
                                applicant.status === 'viewed' ? 'outline' :
                                applicant.status === 'rejected' ? 'destructive' :
                                'secondary'
                              }>
                                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500 mt-1">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{applicant.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                <span>{applicant.experience} experience</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>Applied {applicant.appliedDate}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1 text-neutral-400" />
                                <span>{applicant.phone}</span>
                              </div>
                              {applicant.email && (
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1 text-neutral-400" />
                                  <span>{applicant.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          <Select
                            value={applicant.status}
                            onValueChange={(value) => handleApplicantStatusChange(applicant.id, value as any)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="viewed">Viewed</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button variant="outline" size="sm" className="sm:mt-2 whitespace-nowrap">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Job Templates</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100">
                  <FileText className="h-6 w-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No job templates saved</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-4">
                  Save your frequently posted jobs as templates to quickly create new job postings.
                </p>
                <Button variant="outline">Create Template</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation userType="fleet_owner" />
      <Chatbot />
    </div>
  );
};

export default FleetOwnerJobsPage;