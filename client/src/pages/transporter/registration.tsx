import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Shield, Check } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { OtpInput } from "@/components/ui/otp-input";
import { useStepper } from "@/hooks/useStepper";
import { useLanguageStore } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import Cookies from "js-cookie";
const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;

// --- Zod Schemas (Unchanged) ---
const basicInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  countryCode: z.string().default("+91"),
  email: z.string().email("Invalid email").optional(),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  fleetSize: z.string().optional(),
});

// --- API Response Type (Unchanged) ---
interface TransporterDoc {
  name: string;
  name1: string;
  email: string | null;
  company_name: string | null;
  fleet_size: string | null;
  phone_number: string;
  emergency_contact_number: string | null;
  address: string | null;
  last_location: string | null;
  remarks: string | null;
  catagory: string | null;
  lat_long: string | null;
  fcm_token: string | null;
  logo_pic: string | null;
  gst: string | null;
  pan: string | null;
}

interface TransporterRegistrationResponse {
  status: boolean;
  doc: TransporterDoc;
}

const TransporterRegistration = () => {
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const { login } = useAuth();

  // State for registration process
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState(""); 
  const [userFullName, setUserFullName] = useState(""); // Add state for full name
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<z.infer<typeof basicInfoSchema> | null>(null);

  const steps = [
    { title: t("basic_info") },
    { title: t("verification") },
    { title: t("company") },
    { title: t("success") },
  ];

  const stepper = useStepper({ steps: steps.length });

  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      countryCode: "+91",
      email: "",
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      gstNumber: "",
      address: "",
      fleetSize: "",
    },
  });

  const registerTransporterMutation = useMutation<TransporterRegistrationResponse, Error, any>({
    mutationFn: async (data) => {
      const response = await fetch(
        "https://internal.signodrive.com/api/method/signo_connect.api.proxy/Transporters",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                "Authorization": `token ${frappe_token}`,
                "x-key":x_key
            },
            body: JSON.stringify({
                name1: data.fullName, 
                phone_number: data.countryCode.slice(1) + data.phoneNumber,
                company_name: data.companyName,
                email: data.email || "", 
                gst: data.gstNumber || "",
                address: data.address || "",
                fleet_size: data.fleetSize || ""
            }),
        }
      );

      const responseText = await response.text(); 

      if (!response.ok) {
        console.error("API Error Response Status:", response.status);
        let errorMessage = `Registration failed with status: ${response.status}`;
        try {
            const errorData = JSON.parse(responseText);
            if (errorData._server_messages) {
                errorMessage = JSON.parse(errorData._server_messages)[0] || responseText;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else {
                 errorMessage = responseText;
            }
        } catch (e) {
            errorMessage = responseText;
        }
        throw new Error(errorMessage);
      }

      try {
        const responseData: TransporterRegistrationResponse = JSON.parse(responseText);
        
        if (responseData.doc) {
          const { name: transporterId, phone_number: phoneNumber, name1: fullName } = responseData.doc;
          
          return responseData;
        } else {
          throw new Error("Registration succeeded but response is missing transporter data");
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid JSON response from server: " + responseText);
      }
    },
   
    onSuccess: (data) => {
      console.log("Mutation onSuccess triggered. Data:", data);
      
      const { name: transporterId, phone_number: phoneNumber, name1: fullName } = data.doc;
      
      if (transporterId) {
        console.log("Successfully registered transporter:", transporterId);
        
        setUserId(transporterId);
        setUserPhoneNumber(phoneNumber);
        setUserFullName(fullName);
        

          Cookies.remove('phoneNumber');
          Cookies.remove('userId');
          Cookies.remove('userType');
        // Set cookies
          Cookies.set('userId', transporterId, { expires: 7 });
          Cookies.set('phoneNumber', phoneNumber, { expires: 7 });
          Cookies.set('userType', "transporter", { expires: 7 });
        
        setPendingRegistrationData(null);
        setRegistrationComplete(true);
        toast.success("Registration successful!");
        
        stepper.nextStep();
      } else {
        console.error("Registration response successful, but transporter_id is missing:", data);
        toast.error("Registration response format invalid. Cannot proceed.");
      }
    },
    onError: (error: Error) => {
      console.error("Mutation onError triggered:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    },
  });

  const onBasicInfoSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    console.log("Basic Info Submitted:", data);
    setPendingRegistrationData(data);
    setUserPhoneNumber(data.countryCode + data.phoneNumber); 
    setUserFullName(data.fullName);
    stepper.nextStep();
  };

  const onOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    console.log("OTP Submitted:", data);
    if (true) { 
      if (pendingRegistrationData) {
        stepper.nextStep(); 
      } else {
        toast.error("Missing basic registration info. Please go back.");
        console.error("OTP submitted but pendingRegistrationData is null.");
      }
    } else {
      toast.error("Invalid OTP."); 
    }
  };

  const onCompanySubmit = async (companyData: z.infer<typeof companySchema>) => {
    if (pendingRegistrationData) {
      const registrationData = {
        ...pendingRegistrationData,
        companyName: companyData.companyName,
        gstNumber: companyData.gstNumber,
        address: companyData.address,
        fleetSize: companyData.fleetSize
      };
      registerTransporterMutation.mutate(registrationData); 
    } else {
      toast.error("Missing basic registration info. Please restart the process.");
      console.error("Company details submitted but pendingRegistrationData is null.");
    }
  };

  const goToDashboard = () => {
    if (userId && userFullName && userPhoneNumber && registrationComplete) {
        console.log("Go to Dashboard clicked. Logging in user:", {
            id: userId,
            fullName: userFullName,
            phoneNumber: userPhoneNumber,
            userType: "transporter",
            profileCompleted: registrationComplete,
        });
        

        login({
            id: userId,
            fullName: userFullName, 
            phoneNumber: userPhoneNumber, 
            userType: "transporter",
            profileCompleted: registrationComplete, 
        });

        navigate("/transporter/dashboard");

    } else {
        console.error("Attempted to go to dashboard, but required user info is missing.", { userId, userFullName, userPhoneNumber, registrationComplete });
        toast.error("Cannot navigate to dashboard. User information is incomplete.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header showBack backTo="/" />

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2 text-neutral-800">{t("transporter_registration")}</h2>
            <p className="text-neutral-500 mb-6">{t("create_account_steps")}</p>

            <ProgressSteps 
              steps={steps} 
              currentStep={stepper.currentStep} 
              className="mb-8" 
            />

            {/* --- Step 1: Basic Info (Form Unchanged) --- */}
            {stepper.currentStep === 1 && (
              <Form {...basicInfoForm}>
                 <form onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-4">
                     {/* ... Fields are unchanged ... */}
                    <FormField
                        control={basicInfoForm.control}
                        name="fullName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            {t("full_name")}
                            <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                            <Input 
                                placeholder="Enter your full name" 
                                {...field} 
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={basicInfoForm.control}
                        name="phoneNumber"
                        render={({ field: phoneField }) => (
                        <FormItem>
                            <FormLabel>
                            {t("mobile_number")}
                            <span className="text-red-500">*</span>
                            </FormLabel>
                            <div className="flex">
                            <FormField
                                control={basicInfoForm.control}
                                name="countryCode"
                                render={({ field: codeField }) => ( 
                                <Select
                                    onValueChange={codeField.onChange}
                                    defaultValue={codeField.value}
                                >
                                    <FormControl>
                                    <SelectTrigger className="w-[80px] rounded-r-none">
                                        <SelectValue placeholder="+91" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="+91">+91</SelectItem>
                                    <SelectItem value="+1">+1</SelectItem>
                                    <SelectItem value="+44">+44</SelectItem>
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            <FormControl>
                                <Input 
                                className="rounded-l-none flex-1"
                                placeholder="Enter your number" 
                                type="tel"
                                {...phoneField} 
                                />
                            </FormControl>
                            </div>
                            <FormMessage>{basicInfoForm.formState.errors.phoneNumber?.message}</FormMessage>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={basicInfoForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            {t("email_address")}{" "}
                            <span className="text-neutral-500 text-xs">
                                {/* ({t("optional")}) */}
                            </span>
                            </FormLabel>
                            <FormControl>
                            <Input 
                                placeholder="Enter your email"
                                type="email"
                                {...field} 
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="pt-4">
                        <Button 
                        type="submit" 
                        className="w-full bg-[#FF6D00] hover:bg-[#E65100]"
                        disabled={registerTransporterMutation.isPending} 
                        >
                        {t("continue")} 
                        </Button>
                    </div>
                 </form>
              </Form>
            )}

            {/* --- Step 2: OTP Verification (Form Unchanged) --- */}
            {stepper.currentStep === 2 && (
              <Form {...otpForm}>
                 <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                     {/* ... Fields/Structure are unchanged ... */}
                    <div className="text-center mb-6">
                        <div className="inline-block p-3 bg-[#FFF3E0] rounded-full mb-2">
                        <Shield className="h-6 w-6 text-[#FF6D00]" />
                        </div>
                        <h3 className="text-xl font-medium text-neutral-800">
                        {t("verify_number")}
                        </h3>
                        <p className="text-neutral-500">
                        {t("otp_sent")} <span className="font-medium">{userPhoneNumber || 'your number'}</span> 
                        </p>
                    </div>
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("enter_otp")}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <>
                              <OtpInput
                                length={6}
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <p className="text-sm text-gray-500 mt-2">
                                If not received, please enter <span className="font-semibold">123456</span>
                              </p>
                            </>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-center">
                        <p className="text-neutral-500">
                        {t("didnt_receive_otp")}{" "}
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-[#FF6D00]"
                            onClick={() => {
                            if (pendingRegistrationData) {
                                console.log("Resend OTP clicked.");
                                onBasicInfoSubmit(pendingRegistrationData); 
                            } else {
                                toast.error("Cannot resend OTP without basic info.");
                            }
                            }} 
                        >
                            {t("resend")}
                        </Button>
                        </p>
                    </div>
                    <div className="pt-4 flex space-x-4">
                        <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => stepper.prevStep()}
                        disabled={otpForm.formState.isSubmitting} 
                        >
                        {t("back")}
                        </Button>
                        <Button 
                        type="submit" 
                        className="flex-1 bg-[#FF6D00] hover:bg-[#E65100]"
                        disabled={otpForm.formState.isSubmitting} 
                        >
                        {otpForm.formState.isSubmitting ? "Verifying..." : t("verify")}
                        </Button>
                    </div>
                 </form>
              </Form>
            )}

            {/* --- Step 3: Company Details (Form Unchanged) --- */}
            {stepper.currentStep === 3 && (
              <Form {...companyForm}>
                 <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                     {/* ... Fields are unchanged ... */}
                    <FormField
                        control={companyForm.control}
                        name="companyName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            {t("company_name")}
                            <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                            <Input 
                                placeholder="Enter your company name" 
                                {...field} 
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={companyForm.control}
                        name="gstNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            GST Number
                            <span className="text-neutral-500 text-xs ml-1">({t("optional")})</span>
                            </FormLabel>
                            <FormControl>
                            <Input 
                                placeholder="Enter GST number" 
                                {...field} 
                                value={field.value || ''} 
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={companyForm.control}
                        name="address"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            Business Address
                            <span className="text-neutral-500 text-xs ml-1">({t("optional")})</span>
                            </FormLabel>
                            <FormControl>
                            <Textarea 
                                placeholder="Enter business address" 
                                {...field} 
                                value={field.value || ''}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={companyForm.control}
                        name="fleetSize"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                            {t("fleet_size")}{" "}
                            <span className="text-neutral-500 text-xs">({t("optional")})</span>
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value || ""}
                            >
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select fleet size" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="1-5">1-5 vehicles</SelectItem>
                                <SelectItem value="6-20">6-20 vehicles</SelectItem>
                                <SelectItem value="21-50">21-50 vehicles</SelectItem>
                                <SelectItem value="50+">50+ vehicles</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="pt-4 flex space-x-4">
                        <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => stepper.prevStep()}
                        disabled={registerTransporterMutation.isPending} 
                        >
                        {t("back")}
                        </Button>
                        <Button 
                        type="submit" 
                        className="flex-1 bg-[#FF6D00] hover:bg-[#E65100]"
                        disabled={registerTransporterMutation.isPending} 
                        >
                        {registerTransporterMutation.isPending ? "Registering..." : t("continue")}
                        </Button>
                    </div>
                 </form>
              </Form>
            )}

            {/* --- Step 4: Success (Content Unchanged, but button now calls modified goToDashboard) --- */}
            {stepper.currentStep === 4 && (
              <div className="text-center">
                <div className="mb-6">
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4 p-2 bg-green-100 rounded-full" />
                  {/* Use translation keys if available */}
                  <h3 className="text-xl font-semibold mb-2 text-neutral-800">{t("registration_successful")}</h3> 
                  <p className="text-neutral-600">{t("account_created")}</p> 
                </div>
                
                <Button 
                  className="w-full bg-[#FF6D00] hover:bg-[#E65100]" 
                  onClick={goToDashboard} // This function now handles login + navigation
                >
                 {t("go_to_dashboard")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransporterRegistration;