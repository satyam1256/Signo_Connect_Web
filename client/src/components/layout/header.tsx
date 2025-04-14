import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguageStore } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";
import signoLogo from "@/assets/signo-logo.png";

interface HeaderProps {
  showBack?: boolean;
  backTo?: string;
  backAction?: () => void;
  children?: ReactNode;
}

export const Header = ({ showBack = false, backTo = "/", backAction, children }: HeaderProps) => {
  const { t } = useLanguageStore();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (backAction) {
      backAction();
    }
  };

  const handleLogoClick = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user type
      if (user.userType === 'driver') {
        navigate('/driver/dashboard');
      } else if (user.userType === 'transporter') {
        navigate('/transporter/dashboard');
      }
    } else {
      // If not authenticated, go to home page
      navigate('/');
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {showBack ? (
            backAction ? (
              <button 
                onClick={handleBack}
                className="flex items-center text-primary mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>{t("back")}</span>
              </button>
            ) : (
              <Link 
                to={backTo}
                className="flex items-center text-primary mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                <span>{t("back")}</span>
              </Link>
            )
          ) : (
            <button onClick={handleLogoClick} className="focus:outline-none">
              <img src={signoLogo} alt="SIGNO Logo" className="h-10" />
            </button>
          )}
          {children}
        </div>

        <LanguageSelector />
      </div>
    </header>
  );
};
