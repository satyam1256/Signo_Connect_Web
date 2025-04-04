import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepProps {
  title: string;
  step: number;
  active: boolean;
  completed: boolean;
  isLast?: boolean;
}

const Step: React.FC<StepProps> = ({ title, step, active, completed, isLast = false }) => {
  return (
    <li className="flex-1 text-center relative">
      <div className="relative">
        <div
          className={cn(
            "w-6 h-6 mx-auto rounded-full text-sm flex items-center justify-center z-10 relative",
            active ? "bg-primary text-white" : completed ? "bg-accent text-white" : "bg-neutral-100 text-neutral-600"
          )}
        >
          {completed ? <Check className="h-3 w-3" /> : step}
        </div>
        <span className="block text-xs mt-1">{title}</span>
      </div>
      
      {!isLast && (
        <div
          className={cn(
            "absolute top-3 left-1/2 w-full h-0.5 z-0",
            active || completed ? "bg-primary" : "bg-neutral-200"
          )}
          style={{ width: "calc(100% - 1.5rem)" }}
        />
      )}
    </li>
  );
};

export interface ProgressStepsProps {
  steps: { title: string }[];
  currentStep: number;
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <ol className={cn("flex justify-between mb-8", className)}>
      {steps.map((step, index) => (
        <Step
          key={index}
          title={step.title}
          step={index + 1}
          active={currentStep === index + 1}
          completed={currentStep > index + 1}
          isLast={index === steps.length - 1}
        />
      ))}
    </ol>
  );
};
