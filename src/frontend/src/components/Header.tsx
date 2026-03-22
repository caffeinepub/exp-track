import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Receipt } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

type Tab = "home" | "expenses" | "occasions" | "monthly";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();

  const displayName =
    profile?.displayName ||
    `${identity?.getPrincipal().toString().slice(0, 8)}...`;
  const initials = profile?.displayName
    ? profile.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const navItems: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "expenses", label: "Expenses" },
    { id: "occasions", label: "Occasions" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">
              Exp Track
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                data-ocid={`nav.${item.id}.link`}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
                  activeTab === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {displayName}
              </span>
            </div>
            <Button
              data-ocid="header.logout.button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={clear}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-ocid={`nav.mobile.${item.id}.link`}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
