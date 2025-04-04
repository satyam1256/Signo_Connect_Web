import { Link } from "wouter";
import { TruckIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguageStore } from "@/lib/i18n";
import { SteeringWheelIcon } from "./icons/steering-wheel-icon";
import { Chatbot } from "@/components/features/chatbot";
import signoLogo from "@/assets/signo-logo.png";

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
  const { t } = useLanguageStore();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />

      <div className="flex-grow container mx-auto px-4 py-6 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            {t("welcome")}
          </h1>
          <p className="text-neutral-500">
            {t("welcome_subtitle")}
          </p>
        </div>

        <div className="flex flex-col space-y-4 mb-8">
          <img
            className="w-64 mx-auto h-auto"
            src={signoLogo}
            alt="SIGNO Logo"
          />
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-neutral-800">
              I am a...
            </h2>

            <div className="flex flex-col space-y-3">
              <Link to="/driver/register">
                <Button 
                  className="w-full justify-between bg-primary text-white hover:bg-primary-dark h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <SteeringWheelIcon className="mr-3 h-5 w-5" />
                    <span>{t("driver")}</span>
                  </span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>

              <Link to="/fleet-owner/register">
                <Button 
                  className="w-full justify-between bg-[#FF6D00] text-white hover:bg-[#E65100] h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <TruckMovingIcon />
                    <span className="ml-3">{t("fleet_owner")}</span>
                  </span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              
              <Link to="/admin/frappe-drivers">
                <Button 
                  className="w-full justify-between bg-[#4A148C] text-white hover:bg-[#311B92] h-14"
                  size="lg"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Admin: Frappe Drivers</span>
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
            {t("already_have_account")}{" "}
            <Link to="/login" className="text-primary font-medium">
              {t("sign_in")}
            </Link>
          </p>
        </div>
      </div>

      <Chatbot />
    </div>
  );
};

export default WelcomePage;
