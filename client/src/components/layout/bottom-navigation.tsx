import { useLocation, Link, Route } from "wouter";
import { Home, Search, Bell, User, Users, FileText,  } from "lucide-react";
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
    <div 
      className={cn(
        "flex flex-col items-center py-2 px-3 cursor-pointer transition-all duration-200 rounded-md mx-1",
        isActive 
          ? `${color} font-medium bg-neutral-100` 
          : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
      )}
    >
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </div>
  </Link>
);

interface BottomNavigationProps {
  userType: "driver" | "transporter";
}

export const BottomNavigation = ({ userType }: BottomNavigationProps) => {
  const [location] = useLocation();
  const { t } = useLanguageStore();

  const isDriver = userType === "driver";
  const baseRoute = isDriver ? "/driver" : "/transporter";
  // Change color to a more visible orange for fleet owner
  const activeColor = isDriver ? "text-primary" : "text-[#FF6D00]";

  const getIconSize = { className: "h-5 w-5" };

  // Debug the current location
  // console.log("Current location:", location);
  // console.log("Expected dashboard path:", `${baseRoute}/dashboard`);
  
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
        {isDriver && (
          <NavItem
            to={`${baseRoute}/trips`}
            icon={<FileText {...getIconSize} />}
            label={t("trips")}
            isActive={location === `${baseRoute}/trips`}
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