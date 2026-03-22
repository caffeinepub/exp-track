import { Button } from "@/components/ui/button";
import { Loader2, PieChart, Receipt, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: branding */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Exp Track
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Track expenses,
              <br />
              <span className="text-primary">together.</span>
            </h1>
            <p className="mt-3 text-muted-foreground text-base">
              Upload bills, split costs, and visualize spending across your
              group — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Receipt, label: "Scan Bills", desc: "AI-powered OCR" },
              {
                icon: PieChart,
                label: "Visual Charts",
                desc: "Spending breakdown",
              },
              { icon: Users, label: "Multi-User", desc: "Group tracking" },
              { icon: TrendingUp, label: "Occasions", desc: "Event budgets" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border shadow-xs"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: login card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-2xl shadow-card p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to access your expense tracker
            </p>
          </div>

          <div className="space-y-3">
            <Button
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-11 text-base font-semibold"
            >
              {isLoggingIn || isInitializing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isInitializing
                ? "Initializing..."
                : isLoggingIn
                  ? "Connecting..."
                  : "Sign in with Internet Identity"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Secure, decentralized authentication powered by the Internet
            Computer.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
