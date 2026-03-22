import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import AddExpenseModal from "../components/AddExpenseModal";
import UploadBillModal from "../components/UploadBillModal";
import {
  useAddParticipant,
  useAllOccasions,
  useExpensesByOccasion,
  useUserProfile,
} from "../hooks/useQueries";

const COLORS = [
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

function formatDate(bigintNs: bigint) {
  const ms = Number(bigintNs) / 1_000_000;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(ms));
}

interface Props {
  occasionId: string;
  onBack: () => void;
}

export default function OccasionDetailPage({ occasionId, onBack }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantName, setParticipantName] = useState("");

  const { data: occasions = [] } = useAllOccasions();
  const { data: profile } = useUserProfile();
  const { data: expenses = [], isLoading } = useExpensesByOccasion(occasionId);
  const addParticipant = useAddParticipant();

  const occasion = occasions.find((o) => o.id === occasionId);

  const handleAddParticipant = async () => {
    if (!participantName.trim()) return;
    try {
      await addParticipant.mutateAsync({
        occasionId,
        participantName: participantName.trim(),
      });
      toast.success("Participant added!");
      setParticipantName("");
      setShowAddParticipant(false);
    } catch {
      toast.error("Failed to add participant.");
    }
  };

  // Per-participant spending
  const participantSpending = (occasion?.participants || []).map((name, i) => ({
    name,
    amount: expenses
      .filter((e) => e.userName === name)
      .reduce((s, e) => s + e.amount, 0),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button
          data-ocid="occasion_detail.back.button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {occasion?.name || "Loading..."}
          </h1>
          {occasion?.description && (
            <p className="text-sm text-muted-foreground">
              {occasion.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="occasion_detail.upload_bill.button"
            onClick={() => setShowUpload(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Bill
          </Button>
          <Button
            data-ocid="occasion_detail.add_expense.button"
            variant="outline"
            onClick={() => setShowAdd(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Participants + chart */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participants
                </CardTitle>
                <Button
                  data-ocid="occasion_detail.add_participant.button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setShowAddParticipant(true)}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!occasion ? (
                <Skeleton className="h-8 w-full" />
              ) : occasion.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No participants yet
                </p>
              ) : (
                occasion.participants.map((p, i) => (
                  <div
                    key={p}
                    data-ocid={`occasion_detail.participant.item.${i + 1}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {p}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(
                        expenses
                          .filter((e) => e.userName === p)
                          .reduce((s, e) => s + e.amount, 0),
                      )}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {participantSpending.length > 0 && (
            <Card className="border-border shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Spending Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={participantSpending} layout="vertical">
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={60}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), "Spent"]}
                      contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {participantSpending.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Expense list */}
        <div className="lg:col-span-3">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Expenses ({expenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div
                  data-ocid="occasion_detail.expenses.loading_state"
                  className="space-y-2"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : expenses.length === 0 ? (
                <div
                  data-ocid="occasion_detail.expenses.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <p className="text-sm">No expenses for this occasion yet.</p>
                </div>
              ) : (
                [...expenses]
                  .sort((a, b) => Number(b.date - a.date))
                  .map((exp, idx) => (
                    <motion.div
                      key={`${exp.userName}-${String(exp.date)}`}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      data-ocid={`occasion_detail.expenses.item.${idx + 1}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {exp.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exp.userName} · {formatDate(exp.date)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {formatCurrency(exp.amount)}
                      </Badge>
                    </motion.div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add participant dialog */}
      <Dialog
        open={showAddParticipant}
        onOpenChange={(v) => !v && setShowAddParticipant(false)}
      >
        <DialogContent
          data-ocid="occasion_detail.add_participant.dialog"
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="participant-name">Name</Label>
              <Input
                id="participant-name"
                data-ocid="occasion_detail.add_participant.input"
                placeholder="Participant name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-ocid="occasion_detail.add_participant.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddParticipant(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="occasion_detail.add_participant.submit_button"
                className="flex-1"
                onClick={handleAddParticipant}
                disabled={!participantName.trim() || addParticipant.isPending}
              >
                {addParticipant.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UploadBillModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        defaultUserName={profile?.displayName || ""}
        occasionId={occasionId}
      />
      <AddExpenseModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        defaultUserName={profile?.displayName || ""}
        occasionId={occasionId}
      />
    </div>
  );
}
