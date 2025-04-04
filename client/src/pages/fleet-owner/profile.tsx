import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";

const FleetOwnerProfile = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header />
      
      <div className="flex-grow container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Company Profile</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-300 mb-4"></div>
              <h2 className="text-xl font-semibold">Company Name</h2>
              <p className="text-gray-500">Fleet ID: FLT12345</p>
            </div>
            
            <Button variant="outline" className="w-full mb-4">Edit Company Profile</Button>
            <Button variant="outline" className="w-full">Sign Out</Button>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation userType="fleet_owner" />
    </div>
  );
};

export default FleetOwnerProfile;