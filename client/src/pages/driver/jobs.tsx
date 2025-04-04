import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

const DriverJobs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header />
      
      <div className="flex-grow container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p>No jobs available at the moment.</p>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation userType="driver" />
    </div>
  );
};

export default DriverJobs;