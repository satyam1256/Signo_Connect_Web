import React from "react";
import { cn } from "@/lib/utils";

interface SteeringWheelIconProps {
  className?: string;
}

export const SteeringWheelIcon: React.FC<SteeringWheelIconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-5 w-5", className)}
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
        clipRule="evenodd"
      />
      <path
        d="M7.5 12c0-.966.784-1.75 1.75-1.75h1.5a.75.75 0 000-1.5h-1.5A3.25 3.25 0 006 12v1.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V12zM16.25 10.25A1.75 1.75 0 0014.5 12v1.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V12c0-.966-.784-1.75-1.75-1.75h-1.5a.75.75 0 000 1.5h1.5z"
      />
    </svg>
  );
};
