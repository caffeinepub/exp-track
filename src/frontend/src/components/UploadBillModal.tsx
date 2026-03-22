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
import { CheckCircle, ImageIcon, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useCreateExpense, useExtractAmount } from "../hooks/useQueries";

interface UploadBillModalProps {
  open: boolean;
  onClose: () => void;
  defaultUserName?: string;
  occasionId?: string;
}

export default function UploadBillModal({
  open,
  onClose,
  defaultUserName = "",
  occasionId,
}: UploadBillModalProps) {
  const [step, setStep] = useState<"upload" | "confirm">("upload");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [userName, setUserName] = useState(defaultUserName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractAmount = useExtractAmount();
  const createExpense = useCreateExpense();

  const handleFileChange = async (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      try {
        const result = await extractAmount.mutateAsync(base64);
        if (result.amount !== undefined) {
          setAmount(result.amount.toFixed(2));
        }
        setStep("confirm");
      } catch {
        setStep("confirm");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!amount || !userName.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      let imageId: ExternalBlob | undefined;
      if (imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        imageId = ExternalBlob.fromBytes(bytes);
      }
      await createExpense.mutateAsync({
        userName: userName.trim(),
        amount: Number.parseFloat(amount),
        description: description.trim() || "Bill expense",
        date: BigInt(Date.now()) * BigInt(1_000_000),
        occasionId: occasionId || undefined,
        imageId,
      });
      toast.success("Expense added!");
      handleClose();
    } catch {
      toast.error("Failed to add expense.");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setImageFile(null);
    setImagePreview("");
    setAmount("");
    setDescription("");
    setUserName(defaultUserName);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent data-ocid="upload_bill.dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Bill</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <button
              type="button"
              data-ocid="upload_bill.dropzone"
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFileChange(f);
              }}
            >
              {extractAmount.isPending ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Extracting amount from bill...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Drop bill image here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              data-ocid="upload_bill.upload_button"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />
            <p className="text-xs text-muted-foreground text-center">
              Supported: JPG, PNG, HEIC. AI will extract the total amount.
            </p>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden border border-border h-32">
                <img
                  src={imagePreview}
                  alt="Bill"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-chart-2 text-white rounded-full p-1">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            )}
            {!imagePreview && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No image</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Amount ($) *</Label>
                <Input
                  id="expense-amount"
                  data-ocid="upload_bill.input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-user">Your Name *</Label>
                <Input
                  id="expense-user"
                  placeholder="Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-desc">Description</Label>
              <Textarea
                id="expense-desc"
                placeholder="e.g. Dinner at restaurant"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-ocid="upload_bill.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("upload")}
              >
                Back
              </Button>
              <Button
                data-ocid="upload_bill.submit_button"
                className="flex-1"
                onClick={handleSubmit}
                disabled={createExpense.isPending}
              >
                {createExpense.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Expense
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
