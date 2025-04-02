import { useState } from "react";

interface UseStepperProps {
  steps: number;
  initialStep?: number;
}

export const useStepper = ({ steps, initialStep = 1 }: UseStepperProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const nextStep = () => {
    if (currentStep < steps) {
      setCurrentStep(currentStep + 1);
      return true;
    }
    return false;
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= steps) {
      setCurrentStep(step);
      return true;
    }
    return false;
  };

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps;

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    totalSteps: steps,
  };
};
