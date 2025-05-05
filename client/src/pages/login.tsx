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

  // Handle OTP verification

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
  
    setIsSubmitting(true);
    try {
      const testOtp = "123456";
  
      if (otp === testOtp) {

        const cookiePhoneNumber = Cookies.get("phoneNumber");
        const userId = Cookies.get("userId");
        const rawUserType = Cookies.get("userType");
  
        if (!cookiePhoneNumber || !userId || !rawUserType) {
          throw new Error("Required user data not found in cookies.");
        }
  
        const normalizeLast10 = (num: string) => num.replace(/\D/g, "").slice(-10);

        if (normalizeLast10(cookiePhoneNumber) !== normalizeLast10(phoneNumber)) {
          throw new Error("Phone number mismatch. Please try again.");
        }
  
        const userType = rawUserType === "driver" || rawUserType === "transporter" ? rawUserType : "driver";
  
        const userData: User = {
          id: userId,
          fullName: phoneForm.getValues("fullName"),
          phoneNumber: cookiePhoneNumber,
          userType: userType,
          profileCompleted: false,
        };

        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const cookieOptions = { 
          expires: new Date(Date.now() + sevenDays),
          path: '/' 
        };

        Object.entries({
          userId,
          phoneNumber: cookiePhoneNumber,
          userType
        }).forEach(([key, value]) => {
          if (Cookies.get(key)) {
            Cookies.set(key, value, cookieOptions);
          }
        });

  
        login(userData);
  
        if (userType === "driver") {
          setLocation("/driver/dashboard");
        } else {
          setLocation("/transporter/dashboard");
        }
  
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
        description:
          error instanceof Error ? error.message : "OTP verification failed.",
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