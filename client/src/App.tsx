import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const App = () => {
  const [count, setCount] = useState(0);
  
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

        <div className="flex justify-center mb-8">
          <Button 
            onClick={() => setCount(count + 1)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Count: {count}
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-neutral-800">
              I am a...
            </h2>

            <div className="flex flex-col space-y-3">
              <Link href="#driver">
                <Button 
                  className="w-full justify-between bg-primary text-white hover:bg-primary/90 h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Driver</span>
                  </span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>

              <Link href="#fleet-owner">
                <Button 
                  className="w-full justify-between bg-[#FF6D00] text-white hover:bg-[#E65100]/90 h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>Fleet Owner/Transporter</span>
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
            <Link href="#login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
