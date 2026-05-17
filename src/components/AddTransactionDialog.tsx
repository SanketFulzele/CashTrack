import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTransaction } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";

interface Props {
  borrowerId: string;
  type: "lent" | "received";
}

export function AddTransactionDialog({ borrowerId, type }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();
  const isLent = type === "lent";

  const mutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error("Invalid amount");
      }

      return addTransaction({
        borrower_id: borrowerId,
        type,
        amount: amt,
        date,
        time,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", borrowerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["borrowers"],
      });

      setAmount("");
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (isOpen) {
          const now = new Date();
          setDate(now.toISOString().split("T")[0]);
          setTime(now.toTimeString().slice(0, 5));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={isLent ? "default" : "outline"}
          size="sm"
          className="gap-2 w-full"
        >
          {isLent ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownLeft className="h-4 w-4" />
          )}
          {isLent ? "Lend Money" : "Record Payment"}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[92%] max-w-md rounded-xl p-6">
        <DialogHeader>
          <DialogTitle>
            {isLent ? "Lend Money" : "Record Repayment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              disabled={mutation.isPending}
            />
          </div>

           <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes about this transaction"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {mutation.isPending
              ? "Recording..."
              : isLent
              ? "Record Lending"
              : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}