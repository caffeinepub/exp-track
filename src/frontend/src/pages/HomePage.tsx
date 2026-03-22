import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  DollarSign,
  Plus,
  Receipt,
  TrendingUp,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import AddExpenseModal from "../components/AddExpenseModal";
import UploadBillModal from "../components/UploadBillModal";
import {
  useAggregateTotals,
  useAllExpenses,
  useAllOccasions,
  useUserProfile,
} from "../hooks/useQueries";
import MonthlyPage from "./MonthlyPage";

const CHART_COLORS = [
  "oklch(0.55 0.19 258)",
  "oklch(0.72 0.19 145)",
  "oklch(0.76 0.17 73)",
  "oklch(0.62 0.22 291)",
  "oklch(0.87 0.17 91)",
  "oklch(0.63 0.21 25)",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function HomePage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { data: profile } = useUserProfile();
  const { data: totals = [], isLoading: totalsLoading } = useAggregateTotals();
  const { data: expenses = [], isLoading: expensesLoading } = useAllExpenses();
  const { data: occasions = [] } = useAllOccasions();

  const displayName = profile?.displayName || "there";
  const totalSpend = totals.reduce((sum, [, amt]) => sum + amt, 0);
  const mySpend =
    totals.find(([name]) => name === profile?.displayName)?.[1] ?? 0;

  const chartData = totals.map(([name, value], i) => ({
    name,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const recentExpenses = [...expenses]
    .sort((a, b) => Number(b.date - a.date))
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your spending overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="home.upload_bill.button"
            onClick={() => setShowUpload(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Bill
          </Button>
          <Button
            data-ocid="home.add_expense.button"
            variant="outline"
            onClick={() => setShowAdd(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </Button>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList data-ocid="home.tab" className="mb-6">
          <TabsTrigger value="overview" data-ocid="home.overview.tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="monthly" data-ocid="home.monthly.tab">
            Monthly
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-0">
          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                label: "Total Expenses",
                value: formatCurrency(totalSpend),
                icon: DollarSign,
                color: "text-chart-1",
                bg: "bg-chart-1/10",
              },
              {
                label: "Occasions",
                value: occasions.length.toString(),
                icon: CalendarDays,
                color: "text-chart-3",
                bg: "bg-chart-3/10",
              },
              {
                label: "Your Total",
                value: formatCurrency(mySpend),
                icon: TrendingUp,
                color: "text-chart-4",
                bg: "bg-chart-4/10",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border-border shadow-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Chart + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Donut chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="lg:col-span-3"
            >
              <Card className="border-border shadow-card h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Spending Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totalsLoading ? (
                    <div
                      data-ocid="home.chart.loading_state"
                      className="space-y-2"
                    >
                      <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                  ) : chartData.length === 0 ? (
                    <div
                      data-ocid="home.chart.empty_state"
                      className="flex flex-col items-center justify-center h-48 text-muted-foreground"
                    >
                      <Receipt className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-sm">
                        No expenses yet. Upload a bill to get started!
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Spent",
                          ]}
                          contentStyle={{
                            background: "white",
                            border: "1px solid oklch(0.92 0.01 264)",
                            borderRadius: "8px",
                            fontSize: "13px",
                          }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "oklch(0.55 0.01 258)",
                              }}
                            >
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent expenses */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="border-border shadow-card h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Recent Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {expensesLoading ? (
                    <div
                      data-ocid="home.recent.loading_state"
                      className="space-y-2"
                    >
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : recentExpenses.length === 0 ? (
                    <div
                      data-ocid="home.recent.empty_state"
                      className="text-center py-8 text-muted-foreground"
                    >
                      <p className="text-sm">No expenses yet</p>
                    </div>
                  ) : (
                    recentExpenses.map((exp) => (
                      <div
                        key={`${exp.userName}-${String(exp.date)}`}
                        data-ocid="home.recent.item.1"
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {exp.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exp.userName}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {formatCurrency(exp.amount)}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="mt-0">
          <MonthlyPage />
        </TabsContent>
      </Tabs>

      <UploadBillModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        defaultUserName={profile?.displayName || ""}
      />
      <AddExpenseModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        defaultUserName={profile?.displayName || ""}
      />
    </div>
  );
}
