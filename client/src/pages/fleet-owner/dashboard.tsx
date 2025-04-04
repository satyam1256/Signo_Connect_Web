import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";

const FleetOwnerDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header />
      
      <div className="flex-grow container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Fleet Owner Dashboard</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button className="py-8" variant="outline">Post a Job</Button>
              <Button className="py-8" variant="outline">Find Drivers</Button>
              <Button className="py-8" variant="outline">Manage Fleet</Button>
              <Button className="py-8" variant="outline">View Analytics</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation userType="fleet_owner" />
    </div>
  );
};

export default FleetOwnerDashboard;