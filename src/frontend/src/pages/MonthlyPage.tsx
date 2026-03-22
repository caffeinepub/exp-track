import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Receipt, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Expense } from "../backend";
import { useAllExpenses, useUserProfile } from "../hooks/useQueries";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateBigInt: bigint) {
  const ms = Number(dateBigInt) / 1_000_000;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ms));
}

function getExpenseDate(dateBigInt: bigint): Date {
  return new Date(Number(dateBigInt) / 1_000_000);
}

function MonthlyExpenseRow({
  expense,
  index,
}: {
  expense: Expense;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-ocid={`monthly.item.${index + 1}`}
      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card shadow-xs hover:shadow-card transition-shadow"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Receipt className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {expense.description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(expense.date)}
        </p>
      </div>

      <Badge variant="secondary" className="text-sm font-semibold shrink-0">
        {formatCurrency(expense.amount)}
      </Badge>
    </motion.div>
  );
}

export default function MonthlyPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const { data: profile } = useUserProfile();
  const { data: expenses = [], isLoading } = useAllExpenses();

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const filtered = useMemo(() => {
    const userName = profile?.displayName;
    return expenses
      .filter((e) => {
        if (userName && e.userName !== userName) return false;
        const d = getExpenseDate(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .sort((a, b) => Number(b.date - a.date));
  }, [expenses, profile, year, month]);

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered],
  );

  const prevMonthExpenses = useMemo(() => {
    const prevY = month === 0 ? year - 1 : year;
    const prevM = month === 0 ? 11 : month - 1;
    const userName = profile?.displayName;
    return expenses
      .filter((e) => {
        if (userName && e.userName !== userName) return false;
        const d = getExpenseDate(e.date);
        return d.getFullYear() === prevY && d.getMonth() === prevM;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, profile, year, month]);

  const diff = total - prevMonthExpenses;
  const diffPercent =
    prevMonthExpenses > 0 ? (diff / prevMonthExpenses) * 100 : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Monthly Expenses
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personal spending by month
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-xs">
          <Button
            data-ocid="monthly.pagination_prev"
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={prevMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span
            data-ocid="monthly.month.toggle"
            className="text-sm font-semibold text-foreground min-w-[130px] text-center"
          >
            {monthLabel}
          </span>
          <Button
            data-ocid="monthly.pagination_next"
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={nextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="border-border shadow-card bg-primary text-primary-foreground">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total Spent</p>
                <p className="text-4xl font-bold mt-1">
                  {formatCurrency(total)}
                </p>
                <p className="text-sm mt-1 opacity-70">
                  {filtered.length} transaction
                  {filtered.length !== 1 ? "s" : ""} in {monthLabel}
                </p>
              </div>
              {diffPercent !== null && (
                <div
                  className={`flex items-center gap-1 text-sm font-semibold mt-1 px-3 py-1 rounded-full ${
                    diff >= 0
                      ? "bg-destructive/20 text-destructive-foreground"
                      : "bg-success/20 text-primary-foreground"
                  }`}
                >
                  <TrendingUp
                    className={`w-3.5 h-3.5 ${diff < 0 ? "rotate-180" : ""}`}
                  />
                  {diff >= 0 ? "+" : ""}
                  {diffPercent.toFixed(1)}% vs last month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expense list */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {isLoading
              ? "Loading..."
              : `${filtered.length} expense${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div data-ocid="monthly.loading_state" className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="monthly.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No expenses in {monthLabel}</p>
              <p className="text-xs mt-1">
                Add expenses from the Expenses tab to see them here.
              </p>
            </div>
          ) : (
            filtered.map((exp, idx) => (
              <MonthlyExpenseRow
                key={`${exp.userName}-${String(exp.date)}-${exp.amount}`}
                expense={exp}
                index={idx}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
