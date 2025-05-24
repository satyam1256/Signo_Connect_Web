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
import Cookies from "js-cookie";
// Import frappe_token from environment variables
const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = "ffd9b415-ccd9-4af9-9808-0e96608ecaa3 ";

interface Job {
  id: number | string;
  feed_id:string;
  feed?: string;
  title: string;
  description: string;
  no_of_openings?: number;
  salary: string;
  city: string; // Instead of location
  type_of_job: string; // Instead of jobType
  transporter: string;
  transporter_name?: string;
  questions: { question: string }[];
  requirements?: string[]; // For UI display, mapped from questions
  status: 'pending' | 'approved' | 'active' | 'paused' | 'filled' | 'expired';
  // Fields below don't have backend implementations yet
  // vehicleType?: string; 
  // experience?: string; 
  // postedDate?: string; 
  // viewsCount?: number; 
}

const TransporterJobsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Log app startup for debugging
  useEffect(() => {
    console.log("TransporterJobsPage initialized");
  }, []);

  // New job form
  const [newJob, setNewJob] = useState({
    title: "",
    city: "", 
    salary: "",
    description: "",
    no_of_openings: 1,
    requirements: [""], // Will be mapped to questions
    type_of_job: "Full-time"
    // vehicleType: "Heavy Vehicle",
    // experience: "3+ years"
  });
  
  // Add state for the job being edited
  const [editingJobId, setEditingJobId] = useState<string | number | null>(null);
  const [editJob, setEditJob] = useState({
    title: "",
    city: "", 
    salary: "",
    description: "",
    no_of_openings: 1,
    requirements: [""],
    type_of_job: "Full-time",
  });

  // Add toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [viewDetailsJobId, setViewDetailsJobId] = useState<string | number | null>(null);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      searchQuery === "" || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      job.status === statusFilter;
      

    return matchesSearch && matchesStatus;
  });

  
  if (jobs.length > 0 && filteredJobs.length === 0) {
    console.log("All jobs filtered out - possible status mismatch");
    console.log("Job statuses:", jobs.map(job => job.status));
  }

  const handleStatusChange = async (jobId: number | string, newStatus: 'active' | 'paused' | 'filled' | 'expired') => {
    try {
      setIsLoading(true);
      
      setToast({ 
        message: `Updating job status to ${newStatus}...`, 
        type: "success" 
      });
      
      // Find the job to get its feed value
      const jobToUpdate = jobs.find(job => job.id === jobId);
      if (!jobToUpdate) {
        throw new Error('Job not found');
      }
      
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
      
      console.log("Updating status for job ID:", jobId, "with feed:", jobToUpdate.feed);
      
      // Prepare API payload - Match expected format from backend
      const statusUpdateData = {
        job: jobId,
        feed_id: jobToUpdate.feed,
        status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
      };
      
      console.log("Status update payload:", statusUpdateData);
      
      const response = await fetch('https://internal.signodrive.com/api/method/signo_connect.apis.transporter.update_job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${frappe_token}`,
          'x-key': x_key
        },
        body: JSON.stringify(statusUpdateData)
      });
      
      const result = await response.json();
      console.log("Update Status response------> ", result);
      
      if (!response.ok || (result && result.exception)) {
        const errorMessage = result.exception || result.message || 'Unknown error';
        throw new Error('Failed to update job status: ' + errorMessage);
      }
      

      setToast({ 
        message: `Job status updated to ${newStatus}!`, 
        type: "success" 
      });
      

      
    } catch (error) {
      console.error('Error updating job status:', error);
      

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToast({
        message: errorMessage,
        type: "error"
      });

      await fetchJobs();
    } finally {
      setIsLoading(false);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
  };

  const handleDeleteJob = async (jobId: number | string) => {
    try {
      setIsLoading(true);
      

      setToast({ 
        message: "Deleting job...", 
        type: "success" 
      });
      
    setJobs(jobs.filter(job => job.id !== jobId));
      
      console.log("Deleting job ID:", jobId);
      

      const deleteJobData = {
        job: jobId
      };
      
      console.log("Delete job payload:", deleteJobData);
      

      const response = await fetch('https://internal.signodrive.com/api/method/signo_connect.apis.transporter.delete_job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${frappe_token}`,
          'x-key': x_key
        },
        body: JSON.stringify(deleteJobData)
      });
      
      const result = await response.json();
      console.log("Delete job response:", result);
      
      if (!response.ok || (result && result.exception)) {
        const errorMessage = result.exception || result.message || 'Unknown error';
        throw new Error('Failed to delete job: ' + errorMessage);
      }
      

      setToast({ 
        message: "Job deleted successfully!", 
        type: "success" 
      });
      
    } catch (error) {
      console.error('Error deleting job:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToast({
        message: errorMessage,
        type: "error"
      });
      

      await fetchJobs();
    } finally {
      setIsLoading(false);
      

      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
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


  const addEditRequirementField = () => {
    setEditJob({
      ...editJob,
      requirements: [...editJob.requirements, ""]
    });
  };

  const updateEditRequirement = (index: number, value: string) => {
    const updatedRequirements = [...editJob.requirements];
    updatedRequirements[index] = value;
    setEditJob({
      ...editJob,
      requirements: updatedRequirements
    });
  };

  const removeEditRequirement = (index: number) => {
    if (editJob.requirements.length <= 1) return;

    const updatedRequirements = [...editJob.requirements];
    updatedRequirements.splice(index, 1);
    setEditJob({
      ...editJob,
      requirements: updatedRequirements
    });
  };


  useEffect(() => {
    fetchJobs();
  }, []);


  const fetchJobs = async () => {
    setIsLoading(true);
    
    try {

      const transporter_id = Cookies.get('userId') || "SIG00031";
      
      const response = await fetch(`https://internal.signodrive.com/api/method/signo_connect.apis.transporter.get_posted_jobs?transporter=${transporter_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${frappe_token}`,
          'x-key': x_key
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const result = await response.json();

      
      if (result.status && result.data && Array.isArray(result.data)) {
        
        
        const fetchedJobs = result.data.map((job: any) => {

          const jobDetails = job._job || {};
          
          
          let questions = [];
          try {
            if (job.questions_json && typeof job.questions_json === 'string') {
              const parsedQuestions = JSON.parse(job.questions_json);
              questions = parsedQuestions.map((q: any) => ({ question: q.question })); // Keep as objects
              
            }
          } catch (e) {
            console.error('Error parsing questions JSON for job', job.name, ":", e);
          }
          
          let status = (job.status || jobDetails.status || 'pending').toLowerCase();
          
          
          // For testing: convert 'pending' status to 'active' so jobs show up
          if (status === 'pending') {
            status = 'active';
          }

          
          return {
            feed_id: job.name,
            title: job.title || jobDetails.title || '',
            description: job.description || jobDetails.description || '',
            no_of_openings: jobDetails.no_of_openings !== null ? parseInt(jobDetails.no_of_openings) : 0,
            salary: job.salary || jobDetails.salary || "Not specified",
            city: job.city || jobDetails.city || "Not specified",
            type_of_job: jobDetails.type_of_job || "Full-time",
            transporter: job.transporter || jobDetails.transporter,
            transporter_name: jobDetails.transporter_name || "Your Company",
            questions: questions,
            status: status,
            postedDate: job.created_at ? new Date(job.created_at).toLocaleDateString() : "Recently",
            applications: job.applications || 0
          };
        });
        
        setJobs(fetchedJobs);
      } else {
        console.error('Unexpected API response structure:', result);
        setToast({
          message: "Invalid response format from server",
          type: "error"
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setToast({
        message: "Failed to load jobs. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
      

      if (toast?.type === "error") {
        setTimeout(() => {
          setToast(null);
        }, 3000);
      }
    }
  };

  const handleCreateJob = async () => {

    if (!newJob.title || !newJob.city || !newJob.salary || !newJob.description) {
      alert("Please fill in all required fields");
      return;
    }

    const filteredRequirements = newJob.requirements.filter(req => req.trim() !== "");
    if (filteredRequirements.length === 0) {
      alert("Please add at least one job requirement");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    
    setToast({ message: "Creating job...", type: "success" });


    const transporter_id = Cookies.get('userId') || "SIG00031";


    const questionsArray = filteredRequirements.map(question => ({ question }));


    const jobData = {
      transporter: transporter_id,
      title: newJob.title,
      description: newJob.description,
      type_of_job: newJob.type_of_job,
      job: {
        salary: newJob.salary,
        city: newJob.city,
        no_of_openings: newJob.no_of_openings.toString()
      },
      questions: questionsArray
    };
  

    try {
      const response = await fetch('https://internal.signodrive.com/api/method/signo_connect.apis.transporter.post_job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${frappe_token}`,
          'x-key':x_key
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        throw new Error('Failed to post job');
      }

      
      setIsCreatingJob(false);

    setNewJob({
      title: "",
      city: "",
      salary: "",
      description: "",
      no_of_openings: 1,
      requirements: [""],
      type_of_job: "Full-time"
      });


      setToast({ message: "Job created successfully!", type: "success" });
      
      await fetchJobs();
      
    } catch (error) {
      console.error('Error posting job:', error);
      

      setToast({ message: "Failed to post job. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
      

      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
  };


  const openEditDialog = (job: Job) => {
    setEditingJobId(job.feed_id);
    setEditJob({
      title: job.title,
      city: job.city,
      salary: job.salary,
      description: job.description,
      no_of_openings: job.no_of_openings || 1,
      requirements: job.questions.map((q: any) => q.question || ''),
      type_of_job: job.type_of_job,
    });
    setIsEditingJob(true);
  };
  
  const handleEditJob = async () => {
    if (!editingJobId) return;
    
    if (!editJob.title || !editJob.city || !editJob.salary || !editJob.description) {
      alert("Please fill in all required fields");
      return;
    }

    const filteredRequirements = editJob.requirements.filter(req => req.trim() !== "");
    if (filteredRequirements.length === 0) {
      alert("Please add at least one job requirement");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    
    setToast({ message: "Updating job...", type: "success" });

    try {
      const transporter_id = Cookies.get('userId') || "SIG00031";

      const jobData = {
        feed_id: editingJobId,
        transporter: transporter_id,
        title: editJob.title,
        description: editJob.description,
        _job: {
          title: editJob.title,
          description: editJob.description,
          type_of_job: editJob.type_of_job,
          salary: editJob.salary,
          city: editJob.city,
          no_of_openings: editJob.no_of_openings.toString(),
          questions: editJob.requirements.map(question => ({ question }))
        },
        questions: editJob.requirements.map(question => ({ question }))
      };
      
      console.log("Job update payload:", jobData);

      const response = await fetch('https://internal.signodrive.com/api/method/signo_connect.apis.transporter.update_job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${frappe_token}`,
          'x-key': x_key
        },
        body: JSON.stringify(jobData)
      });

      const result = await response.json();
      console.log("Edit job response:", result);
      
      if (!response.ok || (result && result.exception)) {
        const errorMessage = result.exception || result.message || 'Unknown error';
        throw new Error('Failed to update job: ' + errorMessage);
      }

      setIsEditingJob(false);
      setEditingJobId(null);
      setViewDetailsJobId(null);
      
      setToast({ message: "Job updated successfully!", type: "success" });
      

      await fetchJobs();
      
    } catch (error) {
      console.error('Error updating job:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToast({
        message: errorMessage,
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
      
      setTimeout(() => {
        setToast(null);
      }, 3000);
    }
  };


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
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-5 ${
            toast.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'
          }`}
        >
          {toast.type === 'error' ? 
            <XCircle className="h-5 w-5" /> : 
            <CheckCircle2 className="h-5 w-5" />
          }
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
      
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
                        <Label htmlFor="city">Location</Label>
                        <Input 
                          id="city" 
                          placeholder="e.g., Delhi to Mumbai"
                          value={newJob.city}
                          onChange={(e) => setNewJob({...newJob, city: e.target.value})}
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
                        <Label htmlFor="type_of_job">Job Type</Label>
                        <Select 
                          value={newJob.type_of_job}
                          onValueChange={(value) => setNewJob({...newJob, type_of_job: value})}
                        >
                          <SelectTrigger id="type_of_job">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
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

                    <div className="space-y-2">
                      <Label htmlFor="no_of_openings">Number of Openings</Label>
                      <Input 
                        id="no_of_openings" 
                        type="number"
                        min="1"
                        placeholder="e.g., 5"
                        value={newJob.no_of_openings}
                        onChange={(e) => setNewJob({...newJob, no_of_openings: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  <SheetFooter>
                    <Button variant="outline" onClick={() => setIsCreatingJob(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob} disabled={isSubmitting}>
                      {isSubmitting ? "Posting..." : "Post Job"}
                    </Button>
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
                        <Label htmlFor="city">Location</Label>
                        <Input 
                          id="city" 
                          placeholder="e.g., Delhi to Mumbai"
                          value={newJob.city}
                          onChange={(e) => setNewJob({...newJob, city: e.target.value})}
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
                        <Label htmlFor="type_of_job">Job Type</Label>
                        <Select 
                          value={newJob.type_of_job}
                          onValueChange={(value) => setNewJob({...newJob, type_of_job: value})}
                        >
                          <SelectTrigger id="type_of_job">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
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

                    <div className="space-y-2">
                      <Label htmlFor="no_of_openings">Number of Openings</Label>
                      <Input 
                        id="no_of_openings" 
                        type="number"
                        min="1"
                        placeholder="e.g., 5"
                        value={newJob.no_of_openings}
                        onChange={(e) => setNewJob({...newJob, no_of_openings: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatingJob(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob} disabled={isSubmitting}>
                      {isSubmitting ? "Posting..." : "Post Job"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({jobs.filter(j => j.status === 'active').length})</TabsTrigger>
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
                                <span>{job.city}</span>
                              </div>
                              <div className="flex items-center">
                                <BadgeIndianRupee className="h-4 w-4 mr-2" />
                                <span>{job.salary}</span>
                              </div>
                              {typeof job.no_of_openings !== 'undefined' && (
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-2" />
                                  <span>{job.no_of_openings} Opening{job.no_of_openings > 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {/* Comment out postedDate as it's not in the backend
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Posted {job.postedDate}</span>
                              </div>
                              */}
                            </div>
                          </div>

                          <div className="flex items-center sm:items-start gap-3">
                            <Dialog open={viewDetailsJobId === job.id} onOpenChange={open => setViewDetailsJobId(open ? job.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={() => setViewDetailsJobId(job.id)}>
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
                                        <p className="text-neutral-600">{job.city}</p>
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
                                      <Clock className="h-5 w-5 mr-3 text-neutral-500" />
                                      <div>
                                        <h4 className="font-medium">Job Type</h4>
                                        <p className="text-neutral-600">{job.type_of_job}</p>
                                      </div>
                                    </div>

                                    {typeof job.no_of_openings !== 'undefined' && (
                                      <div className="flex items-center">
                                        <Users className="h-5 w-5 mr-3 text-neutral-500" />
                                        <div>
                                          <h4 className="font-medium">No. of Openings</h4>
                                          <p className="text-neutral-600">{job.no_of_openings}</p>
                                        </div>
                                      </div>
                                    )}

                                    {job.transporter_name && (
                                      <div className="flex items-center">
                                        <Users className="h-5 w-5 mr-3 text-neutral-500" />
                                        <div>
                                          <h4 className="font-medium">Transporter Name</h4>
                                          <p className="text-neutral-600">{job.transporter_name}</p>
                                        </div>
                                      </div>
                                    )}

                                    {job.transporter && (
                                      <div className="flex items-center">
                                        <User className="h-5 w-5 mr-3 text-neutral-500" />
                                        <div>
                                          <h4 className="font-medium">Transporter ID</h4>
                                          <p className="text-neutral-600">{job.transporter}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <Separator className="mb-4" />

                                  <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-3">Job Description</h3>
                                    <p className="text-neutral-700 whitespace-pre-line">{job.description}</p>
                                  </div>

                                  <div>
                                    <h3 className="text-lg font-medium mb-3">Requirements</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                                      {job.questions?.map((q: any, index: number) => (
                                        <li key={index}>{q.question}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    openEditDialog(job);
                                    setViewDetailsJobId(null);
                                  }}>
                                    Edit Job
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditDialog(job)}>
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
                          {job.requirements?.map((req, index) => (
                            <Badge key={index} variant="outline">
                              {req}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end mt-4">
                          <div className="flex items-center justify-between w-full sm:w-auto">
                            <div className="flex items-center text-neutral-500 text-sm sm:hidden">
                              {/* Comment out viewsCount as it's not in the backend
                              <Eye className="h-4 w-4 mr-1" />
                              <span>{job.viewsCount} views</span>
                              */}
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
                            {/* Comment out viewsCount as it's not in the backend
                            <Eye className="h-4 w-4" />
                            <span>{job.viewsCount} views</span>
                            */}
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
                            <Building className="h-4 w-4 mr-2" />
                            <span>{user?.fullName || "Your Company"}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{job.city}</span>
                          </div>
                          <div className="flex items-center">
                            <BadgeIndianRupee className="h-4 w-4 mr-2" />
                            <span>{job.salary}</span>
                          </div>
                          {typeof job.no_of_openings !== 'undefined' && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>{job.no_of_openings} Opening{job.no_of_openings > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {/* Comment out postedDate as it's not in the backend
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Posted {job.postedDate}</span>
                          </div>
                          */}
                        </div>
                      </div>

                      <div className="flex items-center sm:items-start gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size={isMobile ? "sm" : "default"}
                        >
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
                                <Badge variant="default">
                                  Active
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
                                    <p className="text-neutral-600">{job.city}</p>
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
                                  <Clock className="h-5 w-5 mr-3 text-neutral-500" />
                                  <div>
                                    <h4 className="font-medium">Job Type</h4>
                                    <p className="text-neutral-600">{job.type_of_job}</p>
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
                                  {job.questions?.map((q: any, index: number) => (
                                    <li key={index}>{q.question}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                openEditDialog(job);
                                setViewDetailsJobId(null);
                              }}>
                                Edit Job
                        </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(job)}>
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
                        <Badge variant="outline">{job.type_of_job}</Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <Label htmlFor={`active-status-${job.id}`} className="text-sm">Status:</Label>
                        <Select 
                          value={job.status}
                          onValueChange={(value) => handleStatusChange(job.id, value as any)}
                        >
                          <SelectTrigger id={`active-status-${job.id}`} className="h-9 w-[130px]">
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
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
                          </div>

      {/* Edit Job Dialog */}
      <Dialog open={isEditingJob} onOpenChange={setIsEditingJob}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
            <DialogDescription>
              Update the details of this job posting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Job Title</Label>
              <Input 
                id="edit-title" 
                placeholder="e.g., Long-haul Truck Driver"
                value={editJob.title}
                onChange={(e) => setEditJob({...editJob, title: e.target.value})}
              />
                            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Location</Label>
                <Input 
                  id="edit-city" 
                  placeholder="e.g., Delhi to Mumbai"
                  value={editJob.city}
                  onChange={(e) => setEditJob({...editJob, city: e.target.value})}
                />
                            </div>

              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary</Label>
                <Input 
                  id="edit-salary" 
                  placeholder="e.g., ₹30,000-40,000/month"
                  value={editJob.salary}
                  onChange={(e) => setEditJob({...editJob, salary: e.target.value})}
                />
                          </div>
                        </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type_of_job">Job Type</Label>
                          <Select
                  value={editJob.type_of_job}
                  onValueChange={(value) => setEditJob({...editJob, type_of_job: value})}
                          >
                  <SelectTrigger id="edit-type_of_job">
                    <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                            </SelectContent>
                          </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Enter detailed job description, responsibilities, etc."
                rows={4}
                value={editJob.description}
                onChange={(e) => setEditJob({...editJob, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Requirements</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addEditRequirementField}
                >
                  Add Requirement
                          </Button>
                        </div>

              <div className="space-y-3">
                {editJob.requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      placeholder={`Requirement ${index + 1}`}
                      value={req}
                      onChange={(e) => updateEditRequirement(index, e.target.value)}
                    />
                    {editJob.requirements.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeEditRequirement(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                      </div>
                    ))}
                  </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-no_of_openings">Number of Openings</Label>
              <Input 
                id="edit-no_of_openings" 
                type="number"
                min="1"
                placeholder="e.g., 5"
                value={editJob.no_of_openings}
                onChange={(e) => setEditJob({...editJob, no_of_openings: parseInt(e.target.value) || 1})}
              />
                </div>
      </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingJob(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditJob} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation userType="transporter" />
      <Chatbot />
    </div>
  );
};

export default TransporterJobsPage;