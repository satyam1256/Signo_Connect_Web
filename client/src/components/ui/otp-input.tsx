import React, { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  onChange: (otp: string) => void;
  value?: string;
  autoFocus?: boolean;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  onChange,
  value = "",
  autoFocus = true,
  className = "",
}) => {
  const [otp, setOtp] = useState<string[]>(value.split("").slice(0, length).concat(Array(length - value.length).fill("")));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value) {
      setOtp(value.split("").slice(0, length).concat(Array(length - value.length).fill("")));
    }
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    if (newValue.length > 1) {
      // Handle paste
      const pastedValue = newValue.slice(0, length);
      const newOtp = [...otp];
      
      for (let i = 0; i < pastedValue.length; i++) {
        if (i + index < length) {
          newOtp[i + index] = pastedValue[i];
        }
      }
      
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      // Focus last input or the one after pasted content
      const nextIndex = Math.min(index + pastedValue.length, length - 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    } else {
      // Handle single character input
      const newOtp = [...otp];
      newOtp[index] = newValue;
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      // Auto-focus next input
      if (newValue && index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      // Focus previous input on backspace when current input is empty
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
      // Move focus left
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1 && inputRefs.current[index + 1]) {
      // Move focus right
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i + index < length) {
        newOtp[i + index] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    onChange(newOtp.join(""));
    
    // Focus the input after the last pasted character
    const nextIndex = Math.min(index + pastedData.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  return (
    <div className="flex justify-between space-x-2">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(ref) => (inputRefs.current[i] = ref)}
          type="text"
          maxLength={1}
          value={otp[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e, i)}
          className={`w-12 h-12 text-center border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg ${className}`}
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]*"
        />
      ))}
    </div>
  );
};
