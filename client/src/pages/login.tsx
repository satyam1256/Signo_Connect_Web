import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { useLanguageStore } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { OtpInput } from "@/components/ui/otp-input";
import signoLogo from "@/assets/signo-logo.png";
import { jwtDecode } from "jwt-decode";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Textarea,
  // TextareaContent,
  // TextareaLabel,
} from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UserType } from "@shared/schema";

// Form schemas
const phoneSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters").max(50),
  phoneNumber: z.string().min(10, "Enter a valid phone number").max(15),
});

// Login steps
enum LoginStep {
  PHONE = 1,
  OTP = 2,
}

const LoginPage = () => {
  console.log("AT login")
  const { t } = useLanguageStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const [step, setStep] = useState<LoginStep>(LoginStep.PHONE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone number form
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
    },
  });

  // Handle phone number submission
  const onPhoneSubmit = async (values: z.infer<typeof phoneSchema>) => {
    setIsSubmitting(true);
    try {

      // Store the response data for OTP verification
      setPhoneNumber(values.phoneNumber);
      setStep(LoginStep.OTP);

      toast({
        title: "Success",
        description: `Verification code sent to ${values.phoneNumber}`,
      });
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "We couldn't process your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    try {
      // Always use 123456 for testing
      const testOtp = "123456";
      
      if (otp === testOtp) {
        // Make another API call to get user data
        const response = await fetch("http://localhost:8000/api/method/signo_connect.api.login2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name1: phoneForm.getValues("fullName"),
            phone_number: phoneNumber,
          }),
        });

        const data = await response.json();
        
        const token = data.data.token as string;
        
        const decoded = jwtDecode<{
          user_type: string;
          user_id: string;
          sid: string;
          name: string;
          phone_number: string;
          license_number?: string | null;
          exp: number;
        }>(token);

        console.log("Decoded token:", decoded);
        console.log("Login SID:---> ", decoded.sid);
        localStorage.setItem("userId" , decoded.user_id);
        localStorage.setItem("SID" , decoded.sid);

        console.log("Login verification response:", data);

        if (!data.status) {
          throw new Error(data.message || "Login verification failed");
        }

        // Map backend user data to frontend format
        const userData = {
          id: data.data.user.id,
          fullName: data.data.user.name,
          phoneNumber: data.data.user.phone_number,
          userType: data.data.user.user_type,
          token: data.data.token,
          profileCompleted: false, // Default to false, user will be prompted to complete profile
          // Add additional fields based on user type
          ...(data.data.user.user_type === "transporter" && {
            companyName: data.data.user.company_name,
          }),
          ...(data.data.user.user_type === "driver" && {
            licenseNumber: data.data.user.dl_number,
          }),
        };

        // Login user
        login(userData);

        setTimeout(() => {
          if (data.data.user.user_type === "driver") {
            setLocation('/driver/dashboard');
          }
          else{
            setLocation('/transporter/dashboard');
          }
          
        }, 0);

        // Redirect to the dashboard page after successful login
        // setLocation('/driver/dashboard');

        // Success notification
        toast({
          title: "Success",
          description: `Welcome to SIGNO Connect, ${userData.fullName}!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid verification code. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "We couldn't verify your OTP. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset OTP and go back to phone step
  const handleBackToPhone = () => {
    setOtp("");
    setStep(LoginStep.PHONE);
  };

  // Render OTP verification step
  const renderOtpStep = () => (
    <div className="flex flex-col space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          {t("verify_number")}
        </h2>
        <p className="text-neutral-500">
          {t("otp_sent")} {phoneNumber}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <label className="text-sm font-medium text-neutral-700">
            {t("enter_otp")}
          </label>
          <OtpInput 
            length={6} 
            value={otp} 
            onChange={setOtp} 
            autoFocus 
          />
        </div>

        <Button
          className="w-full h-12"
          size="lg"
          onClick={handleVerifyOtp}
          disabled={otp.length !== 6 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            t("verify")
          )}
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-neutral-500">
            {t("didnt_receive_otp")}{" "}
            <button
              type="button"
              className="text-primary font-medium"
              onClick={handleBackToPhone}
            >
              {t("resend")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  // Render phone input step
  const renderPhoneStep = () => (
    <div className="flex flex-col space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          Sign In to SIGNO Connect
        </h2>
        <p className="text-neutral-500">
          Enter your name and mobile number to continue
        </p>
      </div>

      <Form {...phoneForm}>
        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
          <FormField
            control={phoneForm.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("full_name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your full name"
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={phoneForm.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("mobile_number")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your phone number"
                    {...field}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 mt-4"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header showBack backTo="/" />

      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex justify-center mb-8">
              <img src={signoLogo} alt="SIGNO Logo" className="h-16" />
            </div>

            {step === LoginStep.PHONE ? renderPhoneStep() : renderOtpStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;