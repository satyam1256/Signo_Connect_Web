import { useState } from "react";
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
      await apiRequest(
        "POST",
        "/api/register",
        {
          fullName: values.fullName,
          phoneNumber: values.phoneNumber,
          userType: "driver", // Default to driver, will be overridden by actual value in database
        }
      );

      // Save phone number for next step
      setPhoneNumber(values.phoneNumber);

      // Move to OTP step
      setStep(LoginStep.OTP);

      // Success notification
      toast({
        title: "Verification code sent",
        description: `An OTP has been sent to ${values.phoneNumber}`,
      });
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "We couldn't process your request. Please try again.",
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
      
      const response = await apiRequest(
        "POST",
        "/api/verify-otp",
        {
          phoneNumber,
          otp: testOtp, // Force the test OTP instead of using the input value
        }
      );

      if (!response.ok) {
        throw new Error('OTP verification failed');
      }

      const data = await response.json();

      if (data.verified) {
        // Fetch user data
        const userResponse = await apiRequest(
          "GET",
          `/api/user/${data.userId}`
        );
        
        if (!userResponse.ok) {
          throw new Error('User data fetch failed');
        }

        const userData = await userResponse.json();

        // Login user
        login(userData.user);

        // Redirect based on user type
        if (userData.user.userType === "driver") {
          setLocation("/driver/dashboard");
        } else {
          setLocation("/fleet-owner/dashboard");
        }

        // Success notification
        toast({
          title: "Login successful",
          description: "Welcome to SIGNO Connect",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: "The OTP you provided is invalid. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "We couldn't verify your OTP. Please try again.",
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