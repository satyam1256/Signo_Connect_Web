import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const FleetOwnerJobs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header />
      
      <div className="flex-grow container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Jobs</h1>
          <Button className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Post Job
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p>You haven't posted any jobs yet.</p>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation userType="fleet_owner" />
    </div>
  );
};

export default FleetOwnerJobs;