import { useLocation, Link } from "wouter";
import { Home, Search, Bell, User, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/lib/i18n";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  color: string;
}

const NavItem = ({ to, icon, label, isActive, color }: NavItemProps) => (
  <Link to={to}>
    <a 
      className={cn(
        "flex flex-col items-center py-1 px-3",
        isActive ? color : "text-neutral-500"
      )}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </a>
  </Link>
);

interface BottomNavigationProps {
  userType: "driver" | "fleet_owner";
}

export const BottomNavigation = ({ userType }: BottomNavigationProps) => {
  const [location] = useLocation();
  const { t } = useLanguageStore();
  
  const isDriver = userType === "driver";
  const baseRoute = isDriver ? "/driver" : "/fleet-owner";
  const activeColor = isDriver ? "text-primary" : "text-secondary";
  
  const getIconSize = { className: "h-5 w-5" };
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-neutral-200 z-10">
      <div className="flex justify-around py-2">
        <NavItem
          to={`${baseRoute}/dashboard`}
          icon={<Home {...getIconSize} />}
          label={t("home")}
          isActive={location === `${baseRoute}/dashboard`}
          color={activeColor}
        />
        
        {isDriver ? (
          <NavItem
            to={`${baseRoute}/jobs`}
            icon={<Search {...getIconSize} />}
            label={t("jobs")}
            isActive={location === `${baseRoute}/jobs`}
            color={activeColor}
          />
        ) : (
          <NavItem
            to={`${baseRoute}/drivers`}
            icon={<Users {...getIconSize} />}
            label={t("drivers")}
            isActive={location === `${baseRoute}/drivers`}
            color={activeColor}
          />
        )}
        
        {isDriver ? (
          <NavItem
            to={`${baseRoute}/alerts`}
            icon={<Bell {...getIconSize} />}
            label={t("alerts")}
            isActive={location === `${baseRoute}/alerts`}
            color={activeColor}
          />
        ) : (
          <NavItem
            to={`${baseRoute}/jobs`}
            icon={<FileText {...getIconSize} />}
            label={t("jobs")}
            isActive={location === `${baseRoute}/jobs`}
            color={activeColor}
          />
        )}
        
        <NavItem
          to={`${baseRoute}/profile`}
          icon={<User {...getIconSize} />}
          label={t("profile")}
          isActive={location === `${baseRoute}/profile`}
          color={activeColor}
        />
      </div>
    </div>
  );
};
