import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguageStore } from "@/lib/i18n";
import signoLogo from "@/assets/signo-logo.png";

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
              <img src={signoLogo} alt="SIGNO Logo" className="h-10" />
            </Link>
          )}
          {children}
        </div>

        <LanguageSelector />
      </div>
    </header>
  );
};
