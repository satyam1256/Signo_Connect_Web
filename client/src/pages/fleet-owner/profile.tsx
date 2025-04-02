import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useLanguageStore } from "@/lib/i18n";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

const FleetOwnerProfilePage = () => {
  const { user } = useAuth();
  const { t } = useLanguageStore();
  const [, navigate] = useLocation();

  // If no user is logged in, redirect to welcome page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 pb-16">
      <Header>
        <h1 className="text-xl font-bold text-neutral-800 ml-2">
          {t("profile")}
        </h1>
      </Header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile content will go here */}
        <p className="text-center py-12 text-neutral-500">
          Fleet owner profile and company information will be displayed here.
        </p>
      </div>
      
      <BottomNavigation userType="fleet_owner" />
    </div>
  );
};

export default FleetOwnerProfilePage;