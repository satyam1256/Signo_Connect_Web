import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

const DriverAlerts = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header />
      
      <div className="flex-grow container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Alerts</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p>You have no new alerts.</p>
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation userType="driver" />
    </div>
  );
};

export default DriverAlerts;