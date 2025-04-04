import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DriverRegistration = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header showBack backTo="/" />
      
      <div className="flex-grow container mx-auto px-4 py-6 max-w-md">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6">Driver Registration</h1>
            <p className="mb-6">This is a placeholder for the driver registration page.</p>
            <Button className="w-full">Continue</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverRegistration;