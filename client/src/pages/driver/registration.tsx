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
import Cookies from "js-cookie";
const frappe_token = import.meta.env.VITE_FRAPPE_API_TOKEN;
const x_key = import.meta.env.VITE_FRAPPE_X_KEY;

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

interface DriverDoc {
  name: string;
  name1: string;
  phone_number: string;
  email: string | null;
  emergency_contact_number: string | null;
  address: string | null;
  last_location: string | null;
  experience: string | null;
  remarks: string | null;
  catagory: string;
  fcm_token: string | null;
  lat_long: string | null;
  reference_number: string | null;
  profile_pic: string | null;
  bank_pic: string | null;
  dl_front_pic: string | null;
  dl_back_pic: string | null;
  aadhar_front_pic: string | null;
  aadhar_back_pic: string | null;
  pf_pic: string | null;
  bank_ac_number: string | null;
  bank_ifsc: string | null;
  bank_holder_name: string | null;
  upi_id: string | null;
  dl_number: string | null;
  dob: string | null;
  aadhar_number: string | null;
  is_bank_verified: number;
  is_kyc_verfied: number;
  is_dl_verified: number;
  is_aadhar_verified: number;
}

interface DriverRegistrationResponse {
  status: boolean;
  doc: DriverDoc;
}

const DriverRegistration = () => {
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [userId, setUserId] = useState<string | null>(null);
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [userFullName, setUserFullName] = useState("");
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
      console.log("Registering driver with data:", data);
      const response = await fetch("https://internal.signodrive.com/api/method/signo_connect.api.proxy/Drivers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `token ${frappe_token}`,
          "x-key": x_key
        },
        body: JSON.stringify({
          name1: data.fullName,
          phone_number: data.countryCode.slice(1) + data.phoneNumber,
          user_type: "driver",
        }),
      });

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
        const responseData: DriverRegistrationResponse = JSON.parse(responseText);
        
        if (responseData.doc) {
          const { name: driverId, phone_number: phoneNumber, name1: fullName } = responseData.doc;
          
          return responseData;
        } else {
          throw new Error("Registration succeeded but response is missing driver data");
        }
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid JSON response from server: " + responseText);
      }
    },
    onSuccess: (data) => {
      console.log("Mutation onSuccess triggered. Data:", data);
    
      const { name: driverId, phone_number: phoneNumber, name1: fullName } = data.doc;
    
      if (driverId) {
        console.log("Successfully registered driver:", driverId);
        
        setUserId(driverId);
        setUserPhoneNumber(phoneNumber);
        setUserFullName(fullName);


          Cookies.remove('phoneNumber');
          Cookies.remove('userId');
          Cookies.remove('userType');
          // Store in Cookies
          Cookies.set('userId', driverId, { expires: 7 });
          Cookies.set('phoneNumber', phoneNumber, { expires: 7 });
          Cookies.set('userType', "driver", { expires: 7 });
          
    
        setPendingRegistrationData(null);
        setRegistrationComplete(true);
        toast.success(t("registration_successful"));
        
        stepper.nextStep();
      } else {
        console.error("Registration response successful, but driver_id is missing:", data);
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
        console.log("OTP verified (using bypass/test). Proceeding to Documents.");
        stepper.nextStep();
      } else {
        toast.error("Missing basic registration info. Please go back.");
        console.error("OTP submitted but pendingRegistrationData is null.");
      }
    } else {
      toast.error("Invalid OTP.");
    }
  };

  const onDocumentsSubmit = (data: z.infer<typeof documentsSchema>) => {
    console.log("Documents Submitted:", data);
    if (pendingRegistrationData) {
      registerMutation.mutate(pendingRegistrationData);
    } else {
      toast.error("Missing basic registration info. Please restart the process.");
      console.error("Documents submitted but pendingRegistrationData is null.");
    }
  };

  const handleSkipDocuments = () => {
    if (pendingRegistrationData) {
      registerMutation.mutate(pendingRegistrationData);
    } else {
      toast.error("Missing basic registration info. Please restart the process.");
    }
  };

  const goToDashboard = () => {
    if (userId && userFullName && userPhoneNumber && registrationComplete) {
      console.log("Go to Dashboard clicked. Logging in user:", {
        id: userId,
        fullName: userFullName,
        phoneNumber: userPhoneNumber,
        userType: "driver",
        profileCompleted: registrationComplete,
      });

      login({
        id: userId,
        fullName: userFullName,
        phoneNumber: userPhoneNumber,
        userType: "driver",
        profileCompleted: registrationComplete,
      });

      navigate("/driver/dashboard");
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
                            placeholder={t("enter_full_name")} 
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
                        className="p-0 h-auto"
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
                      disabled={registerMutation.isPending}
                    >
                      {t("back")}
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Processing..." : t("continue")}
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