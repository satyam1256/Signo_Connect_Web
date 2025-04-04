import { Link } from "wouter";
import { TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Custom icon component
export const TruckMovingIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 640 512"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path d="M48 0C21.5 0 0 21.5 0 48V368c0 26.5 21.5 48 48 48H64c0 53 43 96 96 96s96-43 96-96H384c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V288 256 237.3c0-17-6.7-33.3-18.7-45.3L512 114.7c-12-12-28.3-18.7-45.3-18.7H416V48c0-26.5-21.5-48-48-48H48zM416 160h50.7L544 237.3V256H416V160zM112 416a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm368-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
  </svg>
);

const WelcomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-xl font-bold text-primary">SIGNO Connect</h1>
        </div>
      </header>

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            Welcome to SIGNO Connect
          </h1>
          <p className="text-neutral-500">
            The logistics marketplace connecting drivers and transporters
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-neutral-800">
              I am a...
            </h2>

            <div className="flex flex-col space-y-3">
              <Link href="/driver/register">
                <Button 
                  className="w-full justify-between bg-primary text-white hover:bg-primary/90 h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 4V8" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 12L8 12" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 16V20" stroke="currentColor" strokeWidth="2" />
                      <path d="M16 12L20 12" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Driver</span>
                  </span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>

              <Link href="/fleet-owner/register">
                <Button 
                  className="w-full justify-between bg-[#FF6D00] text-white hover:bg-[#E65100]/90 h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <TruckMovingIcon />
                    <span className="ml-3">Fleet Owner/Transporter</span>
                  </span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-neutral-500">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
