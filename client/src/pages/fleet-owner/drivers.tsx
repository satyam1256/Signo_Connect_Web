import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const FleetOwnerDrivers = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header />
      
      <div className="flex-grow container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Find Drivers</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search for drivers..." className="pl-10" />
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p>No drivers found. Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation userType="fleet_owner" />
    </div>
  );
};

export default FleetOwnerDrivers;