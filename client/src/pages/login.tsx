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
import type { User } from "@/contexts/auth-context";
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
} from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UserType } from "@shared/schema";
import Cookies from "js-cookie";
const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;

// Form schemas
const phoneSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters").max(50),
  phoneNumber: z.string().min(10, "Enter a valid phone number").max(15),
});

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
  const [countryCode, setCountryCode] = useState("+91"); // Default country code
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

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
  
    setIsSubmitting(true);
    try {
      const testOtp = "123456";
  
      if (otp === testOtp) {
        // First try to get driver profile
        try {
          const formattedPhoneNumber = `${countryCode}${phoneNumber}`.slice(1);
          const driverResponse = await fetch(
            `https://internal.signodrive.com/api/method/signo_connect.apis.driver.get_driver_profile?phone_number=${formattedPhoneNumber}`,
            {
              method: "GET",
              headers: {
                "Authorization": `token ${frappe_token}`,
                "x-key": x_key
              },
            }
          );
          
          if (driverResponse.ok) {
            const driverData = await driverResponse.json();
            if (driverData.doc) {
              // Driver profile exists
              const userData: User = {
                id: driverData.doc.name,
                fullName: phoneForm.getValues("fullName"),
                phoneNumber: formattedPhoneNumber,
                userType: "driver" as const,
                profileCompleted: true,
              };
              
              setUserCookiesAndRedirect(userData);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking driver profile:", error);
        }
  
        // If driver profile not found, try transporter profile
        try {
          const formattedPhoneNumber = `${countryCode}${phoneNumber}`.slice(1);
          const transporterResponse = await fetch(
            `https://internal.signodrive.com/api/method/signo_connect.apis.transporter.get_transporter_profile?phone_number=${formattedPhoneNumber}`,
            {
              method: "GET",
              headers: {
                "Authorization": `token ${frappe_token}`,
                "x-key": x_key
              }
            }
          );
  
          if (transporterResponse.ok) {
            const transporterData = await transporterResponse.json();
            if (transporterData.doc) {
              // Transporter profile exists
              const userData: User = {
                id: transporterData.doc.name,
                fullName: phoneForm.getValues("fullName"),
                phoneNumber: formattedPhoneNumber,
                userType: "transporter" as const,
                profileCompleted: true,
              };
              
              setUserCookiesAndRedirect(userData);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking transporter profile:", error);
        }
  
        // If no profile found, redirect to welcome/registration page
        toast({
          title: "Notice",
          description: "No existing profile found. Redirecting to registration...",
        });
        setLocation("/welcome");
        return;
  
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
        description: error instanceof Error ? error.message : "OTP verification failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setUserCookiesAndRedirect = async (userData: User) => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const cookieOptions = { 
      expires: new Date(Date.now() + sevenDays),
      path: '/' 
    };
  
    Cookies.remove('phoneNumber');
    Cookies.remove('userId');
    Cookies.remove('userType');
  
    // Set new cookies
    Cookies.set('userId', userData.id, cookieOptions);
    Cookies.set('phoneNumber', userData.phoneNumber, cookieOptions);
    Cookies.set('userType', userData.userType, cookieOptions);
  
    // Login first and wait for it to complete
    await login(userData);
    
    // Get the redirect path based on user type
    const redirectPath = userData.userType === "driver" 
      ? "/driver/dashboard" 
      : "/transporter/dashboard";
    
    // Show success toast
    toast({
      title: "Success",
      description: `Welcome to SIGNO Connect, ${userData.fullName}!`,
    });
  
    // Redirect after a small delay to ensure state updates are complete
    setTimeout(() => {
      setLocation(redirectPath);
    }, 100);
  }


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
                  <div className="flex items-center space-x-2">
                    <Select
                      value={countryCode}
                      onValueChange={(value) => setCountryCode(value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+91">+91 (India)</SelectItem>
                        <SelectItem value="+1">+1 (USA)</SelectItem>
                        <SelectItem value="+44">+44 (UK)</SelectItem>
                        {/* Add more country codes as needed */}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      pattern="[0-9]*"
                      placeholder="Enter your phone number"
                      {...field}
                      className="h-12 flex-grow"
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        field.onChange(e);
                      }}
                    />
                  </div>
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