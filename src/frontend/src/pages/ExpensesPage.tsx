import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Plus, Receipt, Search, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Expense } from "../backend";
import AddExpenseModal from "../components/AddExpenseModal";
import UploadBillModal from "../components/UploadBillModal";
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

function ExpenseRow({ expense, index }: { expense: Expense; index: number }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const loadImage = async () => {
    if (expense.imageId && !imgUrl) {
      try {
        const bytes = await expense.imageId.getBytes();
        const blob = new Blob([bytes], { type: "image/jpeg" });
        setImgUrl(URL.createObjectURL(blob));
      } catch {
        // ignore
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      data-ocid={`expenses.item.${index + 1}`}
      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card shadow-xs hover:shadow-card transition-shadow"
    >
      {/* Thumbnail */}
      <button
        type="button"
        aria-label="Load bill image"
        className="w-12 h-12 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 cursor-pointer p-0"
        onClick={loadImage}
      >
        {expense.imageId ? (
          imgUrl ? (
            <img
              src={imgUrl}
              alt="Bill"
              className="w-full h-full object-cover"
              onLoad={() => setImgLoaded(true)}
              style={{ display: imgLoaded ? "block" : "none" }}
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )
        ) : (
          <Receipt className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {expense.description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {expense.userName} · {formatDate(expense.date)}
        </p>
      </div>

      <Badge variant="secondary" className="text-sm font-semibold shrink-0">
        {formatCurrency(expense.amount)}
      </Badge>
    </motion.div>
  );
}

export default function ExpensesPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const { data: profile } = useUserProfile();
  const { data: expenses = [], isLoading } = useAllExpenses();

  const filtered = expenses
    .filter(
      (e) =>
        search === "" ||
        e.userName.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.date - a.date));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all group expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="expenses.upload_bill.button"
            onClick={() => setShowUpload(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Bill
          </Button>
          <Button
            data-ocid="expenses.add_expense.button"
            variant="outline"
            onClick={() => setShowAdd(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-ocid="expenses.search_input"
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div data-ocid="expenses.loading_state" className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="expenses.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No expenses found</p>
            </div>
          ) : (
            filtered.map((exp, idx) => (
              <ExpenseRow
                key={`${exp.userName}-${String(exp.date)}-${exp.amount}`}
                expense={exp}
                index={idx}
              />
            ))
          )}
        </CardContent>
      </Card>

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
