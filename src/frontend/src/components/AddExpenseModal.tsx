import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateExpense } from "../hooks/useQueries";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  defaultUserName?: string;
  occasionId?: string;
}

export default function AddExpenseModal({
  open,
  onClose,
  defaultUserName = "",
  occasionId,
}: AddExpenseModalProps) {
  const [userName, setUserName] = useState(defaultUserName);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const createExpense = useCreateExpense();

  const handleSubmit = async () => {
    if (!amount || !userName.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createExpense.mutateAsync({
        userName: userName.trim(),
        amount: Number.parseFloat(amount),
        description: description.trim() || "Manual expense",
        date: BigInt(Date.now()) * BigInt(1_000_000),
        occasionId: occasionId || undefined,
      });
      toast.success("Expense added!");
      setUserName(defaultUserName);
      setAmount("");
      setDescription("");
      onClose();
    } catch {
      toast.error("Failed to add expense.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="add_expense.dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ae-user">Your Name *</Label>
            <Input
              id="ae-user"
              data-ocid="add_expense.input"
              placeholder="e.g. Alex"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ae-amount">Amount ($) *</Label>
            <Input
              id="ae-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ae-desc">Description</Label>
            <Textarea
              id="ae-desc"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button
              data-ocid="add_expense.cancel_button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              data-ocid="add_expense.submit_button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={createExpense.isPending}
            >
              {createExpense.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
