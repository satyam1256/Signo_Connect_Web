import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { languages, useLanguageStore } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage } = useLanguageStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((lang) => lang.code === currentLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (code: typeof languages[number]["code"]) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center space-x-1 h-8"
        onClick={toggleDropdown}
      >
        <span>{currentLang?.code.toUpperCase()}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      <div
        className={cn(
          "absolute right-0 z-10 mt-1 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
          isOpen ? "block" : "hidden"
        )}
      >
        <div className="py-1">
          {languages.map((language) => (
            <button
              key={language.code}
              className={cn(
                "block w-full px-4 py-2 text-left text-sm hover:bg-neutral-100",
                currentLanguage === language.code && "bg-neutral-50 font-medium"
              )}
              onClick={() => handleLanguageSelect(language.code)}
            >
              {language.nativeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
