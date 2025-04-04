import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-primary">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-gray-500 mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button>Go Back Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}