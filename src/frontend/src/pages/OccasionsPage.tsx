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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Loader2, PartyPopper, Plus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Occasion } from "../backend";
import {
  useAllExpenses,
  useAllOccasions,
  useCreateOccasion,
} from "../hooks/useQueries";

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
    year: "numeric",
  }).format(new Date(ms));
}

interface OccasionCardProps {
  occasion: Occasion;
  totalSpent: number;
  index: number;
  onClick: () => void;
}

function OccasionCard({
  occasion,
  totalSpent,
  index,
  onClick,
}: OccasionCardProps) {
  const budget = 1000; // no budget field on Occasion, show a nominal 1000
  const progress = Math.min((totalSpent / budget) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card
        data-ocid={`occasions.item.${index + 1}`}
        className="border-border shadow-card hover:shadow-md transition-all cursor-pointer group"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                {occasion.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {occasion.description || "No description"}
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {formatDate(occasion.createdAt)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Spent</span>
              <span>{formatCurrency(totalSpent)}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>
              {occasion.participants.length} participant
              {occasion.participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface OccasionsPageProps {
  onSelectOccasion: (id: string) => void;
}

export default function OccasionsPage({
  onSelectOccasion,
}: OccasionsPageProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { data: occasions = [], isLoading } = useAllOccasions();
  const { data: allExpenses = [] } = useAllExpenses();
  const createOccasion = useCreateOccasion();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createOccasion.mutateAsync({
        name: name.trim(),
        description: description.trim(),
      });
      toast.success("Occasion created!");
      setName("");
      setDescription("");
      setShowCreate(false);
    } catch {
      toast.error("Failed to create occasion.");
    }
  };

  const getTotalForOccasion = (id: string) =>
    allExpenses
      .filter((e) => e.occasionId === id)
      .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Occasions</h1>
          <p className="text-sm text-muted-foreground">
            Track expenses for special events
          </p>
        </div>
        <Button
          data-ocid="occasions.create.button"
          onClick={() => setShowCreate(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Occasion
        </Button>
      </div>

      {isLoading ? (
        <div
          data-ocid="occasions.loading_state"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : occasions.length === 0 ? (
        <div
          data-ocid="occasions.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <PartyPopper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No occasions yet</p>
          <p className="text-sm mt-1">
            Create your first occasion to start tracking
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {occasions.map((occ, idx) => (
            <OccasionCard
              key={occ.id}
              occasion={occ}
              totalSpent={getTotalForOccasion(occ.id)}
              index={idx}
              onClick={() => onSelectOccasion(occ.id)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(v) => !v && setShowCreate(false)}
      >
        <DialogContent data-ocid="occasions.create.dialog" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Occasion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="occ-name">Occasion Name *</Label>
              <Input
                id="occ-name"
                data-ocid="occasions.create.input"
                placeholder="e.g. Team Retreat 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occ-desc">Description</Label>
              <Textarea
                id="occ-desc"
                placeholder="Brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-ocid="occasions.create.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="occasions.create.submit_button"
                className="flex-1"
                onClick={handleCreate}
                disabled={!name.trim() || createOccasion.isPending}
              >
                {createOccasion.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
