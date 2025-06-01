import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapPin, Route, User, Info, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Chatbot } from "@/components/features/chatbot";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";

const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;

// Job type
interface Job {
  name: string; // Document name (acts like an ID)
  status: string;
  description: string;
  transporter: string;
  transporter_name: string;
  title: string;
  salary: string;
  type_of_job: string;
  no_of_openings: string;
  city: string;
  feed: string;
  tags?: string[]; // Optional, ensure it aligns with your data or remove if unused
}

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();

  // Fetch jobs and recommend top 2 based on salary
  const { data: jobsResponse, isLoading: jobsLoading } = useQuery<{ status: boolean; data: Job[] }>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch(
        `https://internal.signodrive.com/api/method/signo_connect.api.proxy/Job?fields=["*"]&limit_page_length=100`,
        {
          method: "GET",
          headers: new Headers({
            "Authorization": `token ${frappe_token}`,
            "x-key": x_key,
            "Accept": "application/json",
            "Content-Type": "application/json",
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const recommendedJobs = jobsResponse?.data
    ?.filter(job => job.salary) // Ensure jobs have a salary
    ?.map(job => ({
      ...job,
      numericSalary: parseInt(job.salary.replace(/[^0-9]/g, ""), 10),
      tags: Array.isArray(job.tags) ? job.tags : [], // Ensure tags is always an array
    }))
    ?.sort((a, b) => b.numericSalary - a.numericSalary) // Sort by salary in descending order
    ?.slice(0, 2); // Take the top 2 jobs

  // Redirect to login if no user
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
          {t("driver")}
        </h1>
        <div className="ml-auto mr-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary font-medium"
            onClick={() => logout()}
          >
            {t("sign_out")}
          </Button>
        </div>
      </Header>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Welcome Card */}
        <Card className="bg-primary text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                <User className="text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-medium">{t("welcome_user")} {user.fullName}!</h2>
                <p className="text-primary-100">Delhi NCR</p>
              </div>
            </div>

            <div className="bg-primary-dark bg-opacity-30 rounded-md p-3 mb-4">
              <p className="text-sm flex items-start">
                <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>{t("complete_profile_hint")}</span>
              </p>
            </div>

            <div className="bg-primary-dark bg-opacity-30 rounded-md p-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="secondary" 
                  className="flex-1 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] bg-white text-primary hover:bg-neutral-100 text-sm md:text-base"
                  onClick={() => navigate("/driver/profile")}
                >
                  {t("complete_profile")}
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] bg-white text-primary hover:bg-neutral-100 flex items-center justify-center text-sm md:text-base"
                  onClick={() => navigate("/driver/jobs")}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  {t("find_jobs")}
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] bg-white text-primary hover:bg-neutral-100 flex items-center justify-center text-sm md:text-base"
                  onClick={() => navigate("/driver/trips")}
                >
                  <Route className="h-4 w-4 mr-1" />
                  {t("manage_your_trips")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Recommendations */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-neutral-800 mb-4">
              {t("recommended_jobs")}
            </h3>

            {jobsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-neutral-200 rounded-md p-4 animate-pulse">
                    <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-100 rounded w-1/4 mb-3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedJobs?.map(job => (
                  <div 
                    key={job.name}
                    className="border border-neutral-200 rounded-md p-4 hover:border-primary cursor-pointer transition duration-200"
                  >
                    {/* Job Title and Salary */}
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium text-neutral-800">{job.title || "Job Title Not Available"}</h4>
                      <span className="text-black font-medium">₹{job.numericSalary.toLocaleString()}</span>
                    </div>

                    {/* Transporter Name */}
                    <p className="text-neutral-500 text-sm mb-2">
                      {job.transporter_name || "Transporter Name Not Available"}
                    </p>

                    {/* Location */}
                    <div className="flex items-center mb-3">
                      <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                      <span className="text-neutral-500 text-sm">{job.city || "Location Not Available"}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {(job.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-neutral-100 text-neutral-600 text-xs py-1 px-2 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-4">
              <Button 
                variant="link" 
                className="text-primary font-medium"
                onClick={() => navigate("/driver/jobs")}
              >
                {t("view_all_jobs")} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation userType="driver" />
      <Chatbot />
    </div>
  );
};

export default DriverDashboard;