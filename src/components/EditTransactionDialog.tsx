import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTransaction } from "@/lib/store";
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
import { Pencil, Loader2 } from "lucide-react";
import { Transaction } from "@/types";

interface Props {
  transaction: Transaction;
}

export function EditTransactionDialog({ transaction }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [date, setDate] = useState(transaction.date.split("T")[0]);
  const [time, setTime] = useState(transaction.time ?? "00:00");
  const [notes, setNotes] = useState(transaction.notes ?? "");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () =>
      updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        date,
        time,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["borrowers"],
      });

      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[90%] max-w-md rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              placeholder="Optional notes about this transaction"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2"
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {mutation.isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}