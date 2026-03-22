import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSetDisplayName } from "../hooks/useQueries";

interface SetNameModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SetNameModal({ open, onClose }: SetNameModalProps) {
  const [name, setName] = useState("");
  const setDisplayName = useSetDisplayName();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      await setDisplayName.mutateAsync(name.trim());
      toast.success("Name saved!");
      onClose();
    } catch {
      toast.error("Failed to save name. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-ocid="set_name.dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set your display name</DialogTitle>
          <DialogDescription>
            Choose a name so others can see who made each expense.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Your name</Label>
            <Input
              id="display-name"
              data-ocid="set_name.input"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <Button
            data-ocid="set_name.submit_button"
            className="w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || setDisplayName.isPending}
          >
            {setDisplayName.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Name
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
