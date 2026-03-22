import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import SetNameModal from "./components/SetNameModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile } from "./hooks/useQueries";
import ExpensesPage from "./pages/ExpensesPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MonthlyPage from "./pages/MonthlyPage";
import OccasionDetailPage from "./pages/OccasionDetailPage";
import OccasionsPage from "./pages/OccasionsPage";

type Tab = "home" | "expenses" | "occasions" | "monthly";

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedOccasionId, setSelectedOccasionId] = useState<string | null>(
    null,
  );
  const [showSetName, setShowSetName] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    if (isAuthenticated && !profileLoading && profile !== undefined) {
      if (!profile || !profile.displayName) {
        setShowSetName(true);
      }
    }
  }, [isAuthenticated, profileLoading, profile]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedOccasionId(null);
  };

  const renderContent = () => {
    if (activeTab === "occasions" && selectedOccasionId) {
      return (
        <OccasionDetailPage
          occasionId={selectedOccasionId}
          onBack={() => setSelectedOccasionId(null)}
        />
      );
    }
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "expenses":
        return <ExpensesPage />;
      case "occasions":
        return (
          <OccasionsPage onSelectOccasion={(id) => setSelectedOccasionId(id)} />
        );
      case "monthly":
        return <MonthlyPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1">{renderContent()}</main>
      <Footer />
      <SetNameModal open={showSetName} onClose={() => setShowSetName(false)} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  );
}
