import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useLanguageStore } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import { useStepper } from "@/hooks/useStepper";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jwtDecode } from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { FileUpload } from "@/components/ui/file-upload";
import { Shield, Check } from "lucide-react";

// Schemas
const basicInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  countryCode: z.string().default("+91"),
  preferredLocations: z.array(z.string()).optional(),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const documentsSchema = z.object({
  drivingLicense: z.instanceof(File).optional().nullable(),
  identityProof: z.instanceof(File).optional().nullable(),
});

// Location options
const locationOptions = [
  { value: "delhi_ncr", label: "Delhi NCR" },
  { value: "mumbai", label: "Mumbai" },
  { value: "bangalore", label: "Bangalore" },
  { value: "chennai", label: "Chennai" },
  { value: "kolkata", label: "Kolkata" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "pune", label: "Pune" },
  { value: "ahmedabad", label: "Ahmedabad" },
];

interface DriverRegistrationResponse {
  message?: {
    driver_id: string;
    name: string;
    phone_number: string;
  };
  data?: {
    driver_id: string;
    name: string;
    phone_number: string;
  };
  status: boolean;
}

const DriverRegistration = () => {
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<z.infer<typeof basicInfoSchema> | null>(null);

  const steps = [
    { title: t("basic_info") },
    { title: t("verification") },
    { title: t("documents") },
    { title: t("success") },
  ];

  const stepper = useStepper({ steps: steps.length });

  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      countryCode: "+91",
      preferredLocations: [],
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const documentsForm = useForm<z.infer<typeof documentsSchema>>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      drivingLicense: null,
      identityProof: null,
    },
  });


  const registerMutation = useMutation<DriverRegistrationResponse, Error, z.infer<typeof basicInfoSchema>>({
    mutationFn: async (data) => {
      const response = await fetch("http://localhost:8000/api/method/signo_connect.apis.driver.register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name1: data.fullName,
          phone_number: data.countryCode + data.phoneNumber,
          user_type: "driver",
        }),
        credentials: "include",
      });


      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Registration failed");
      }

      const responseData = await response.json();

      // const data = await response.json();
      console.log("Driver Registration SID")
      console.log(responseData.message.data.sid);
      localStorage.setItem("SID" , responseData.message.data.sid);
      localStorage.setItem("userId" ,responseData.message.data.driver_id);
      // const token = responseData.responseData.token as string;
      
      
      console.log("----------------------")
      // console.log("Decoded token:", decoded);
      // console.log("Register SID:---> ", decoded.sid);

      if (!responseData || (!responseData.data && !responseData.message)) {
        throw new Error("Invalid response format from server");
      }

      return responseData;
    },
    onSuccess: (data) => {
      const userData = data.data || data.message;
      if (userData?.driver_id) {
        setUserId(userData.driver_id);
        setPhoneNumber(userData.phone_number);
        setPendingRegistrationData(null);
        toast.success("Registration successful!");
        stepper.nextStep(); // Go to documents
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Registration failed. Please try again.");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate success
      return { success: true };
    },
    onSuccess: () => {
      setRegistrationComplete(true);
      stepper.nextStep();
      if (userId) {
        login({
          id: userId,
          fullName: basicInfoForm.getValues().fullName,
          phoneNumber: phoneNumber,
          userType: "driver",
          profileCompleted: true,
        });
      }
    },
    onError: () => {
      toast.error("Failed to upload documents. Please try again.");
    },
  });

  // HANDLERS

  const onBasicInfoSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    setPendingRegistrationData(data);
    stepper.nextStep(); // Go to OTP
  };

  const onOtpSubmit = (data: z.infer<typeof otpSchema>) => {
    const testOtp = "123456";

    if (data.otp === testOtp) {
      if (pendingRegistrationData) {
        registerMutation.mutate(pendingRegistrationData);
        stepper.nextStep();
      } else {
        toast.error("Missing registration info. Please restart.");
      }
    } else {
      toast.error("Invalid OTP. For testing, use 123456");
    }
  };

  const onDocumentsSubmit = (data: z.infer<typeof documentsSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleSkipDocuments = () => {
    setRegistrationComplete(true);
    stepper.nextStep();
    if (userId) {
      login({
        id: userId,
        fullName: basicInfoForm.getValues().fullName,
        phoneNumber: phoneNumber,
        userType: "driver",
        profileCompleted: false,
      });
    }
  };

  const goToDashboard = () => {
    login({
      id: userId!,
      fullName: basicInfoForm.getValues().fullName,
      phoneNumber: phoneNumber,
      userType: "driver",
      profileCompleted: registrationComplete,
    });
    navigate("/driver/dashboard");
  };


  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header showBack backTo="/" />

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2 text-neutral-800">{t("driver_registration")}</h2>
            <p className="text-neutral-500 mb-6">{t("create_account_steps")}</p>

            <ProgressSteps 
              steps={steps} 
              currentStep={stepper.currentStep} 
              className="mb-8" 
            />

            {/* Step 1: Basic Info */}
            {stepper.currentStep === 1 && (
              <Form {...basicInfoForm}>
                <form onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-4">
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("mobile_number")}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex">
                          <FormField
                            control={basicInfoForm.control}
                            name="countryCode"
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
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
                              className="rounded-l-none"
                              placeholder="Enter your number" 
                              type="tel"
                              {...field} 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicInfoForm.control}
                    name="preferredLocations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("preferred_job_locations")}{" "}
                          <span className="text-neutral-500 text-xs">
                            ({t("optional")})
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange([...field.value || [], value])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select locations" />
                            </SelectTrigger>
                            <SelectContent>
                              {locationOptions.map((location) => (
                                <SelectItem 
                                  key={location.value} 
                                  value={location.value}
                                >
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.map((location) => {
                              const locationLabel = locationOptions.find(
                                (option) => option.value === location
                              )?.label;
                              return (
                                <div
                                  key={location}
                                  className="bg-neutral-100 text-neutral-700 rounded-md px-2 py-1 text-sm flex items-center"
                                >
                                  {locationLabel}
                                  <button
                                    type="button"
                                    className="ml-1 text-neutral-500 hover:text-neutral-700"
                                    onClick={() => {
                                      field.onChange(
                                        field.value?.filter((l) => l !== location)
                                      );
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Processing..." : t("continue")}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 2: Verification */}
            {stepper.currentStep === 2 && (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-block p-3 bg-primary-100 rounded-full mb-2">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium text-neutral-800">
                      {t("verify_number")}
                    </h3>
                    <p className="text-neutral-500">
                      {t("otp_sent")} <span className="font-medium">{phoneNumber}</span>
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
                          <OtpInput
                            length={6}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="text-center">
                    <p className="text-neutral-500">
                      {t("didnt_receive_otp")}{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => onBasicInfoSubmit(basicInfoForm.getValues())}
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
                    >
                      {t("back")}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={otpForm.formState.isSubmitting}
                    >
                      {otpForm.formState.isSubmitting ? "Verifying..." : t("verify")}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 3: Documents */}
            {stepper.currentStep === 3 && (
              <Form {...documentsForm}>
                <form onSubmit={documentsForm.handleSubmit(onDocumentsSubmit)} className="space-y-6">
                  <p className="text-neutral-500 mb-6">
                    {t("upload_docs_optional")}
                  </p>

                  <FormField
                    control={documentsForm.control}
                    name="drivingLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUpload
                            title={t("driving_license")}
                            buttonText={t("upload_license")}
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={documentsForm.control}
                    name="identityProof"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUpload
                            title={t("identity_proof")}
                            buttonText={t("upload_id_proof")}
                            onChange={field.onChange}
                            value={field.value}
                            helpText={t("accepted_formats")}
                          />
                        </FormControl>
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
                    >
                      {t("back")}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Processing..." : t("continue")}
                    </Button>
                  </div>

                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link"
                      onClick={handleSkipDocuments}
                    >
                      {t("skip_for_now")}
                    </Button>
                    <p className="text-xs text-neutral-500 mt-1">
                      {t("complete_later")}
                    </p>
                  </div>
                </form>
              </Form>
            )}

            {/* Step 4: Success */}
            {stepper.currentStep === 4 && registrationComplete && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-accent-100 rounded-full mb-4">
                    <Check className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-medium text-neutral-800 mb-2">
                    {t("registration_successful")}
                  </h3>
                  <p className="text-neutral-500">
                    {t("account_created")}
                  </p>
                </div>

                <div className="bg-neutral-50 rounded-md p-4 mb-6">
                  <h4 className="font-medium text-neutral-800 mb-2">
                    {t("next_steps")}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-accent mt-1 mr-2" />
                      <span>Browse available jobs in your area</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-accent mt-1 mr-2" />
                      <span>Complete your profile to increase visibility</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-accent mt-1 mr-2" />
                      <span>Set your preferences for notifications</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  className="w-full" 
                  onClick={goToDashboard}
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

export default DriverRegistration;
