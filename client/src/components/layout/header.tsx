import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguageStore } from "@/lib/i18n";

interface HeaderProps {
  showBack?: boolean;
  backTo?: string;
  backAction?: () => void;
  children?: ReactNode;
}

export const Header = ({ showBack = false, backTo = "/", backAction, children }: HeaderProps) => {
  const { t } = useLanguageStore();

  const handleBack = () => {
    if (backAction) {
      backAction();
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
            <Link to="/">
              <svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50" className="h-10">
                <rect width="150" height="50" fill="#0D47A1" rx="4" ry="4" />
                <text x="75" y="30" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">SIGNO</text>
                <text x="75" y="42" fontFamily="Arial, sans-serif" fontSize="10" fill="#FFFFFF" textAnchor="middle">CONNECT</text>
              </svg>
            </Link>
          )}
          {children}
        </div>
        
        <LanguageSelector />
      </div>
    </header>
  );
};
