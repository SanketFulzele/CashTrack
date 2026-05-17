import { Transaction } from "@/types";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  transactions: Transaction[];
}

export function TransactionTimeline({ transactions }: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["borrowers"],
      });
    },
  });

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No transactions yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => {
        const isLent = t.type === "lent";

        const dateObj = new Date(t.date);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const dd = String(dateObj.getDate()).padStart(2, "0");

        const combined = new Date(
          `${yyyy}-${mm}-${dd}T${t.time ?? "00:00"}`
        );

        const formattedDate = format(
          combined,
          "MMM d, yyyy • hh:mm a"
        );

        return (
          <div
            key={t.id}
            className="flex gap-3 sm:gap-4 rounded-lg border bg-card p-3 sm:p-4"
          >
            {/* Icon */}
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isLent
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {isLent ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <span
                  className={`font-mono font-semibold text-base sm:text-lg ${
                    isLent
                      ? "text-destructive"
                      : "text-primary"
                  }`}
                >
                  {isLent ? "-" : "+"} ₹
                  {t.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                  })}
                </span>

                <span className="text-[11px] sm:text-xs text-muted-foreground">
                  {formattedDate}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {isLent ? "Money lent" : "Payment received"}    
                {t.notes && <> - {t.notes} </> }
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
              <EditTransactionDialog transaction={t} />

              <ConfirmDialog
                title="Delete Transaction"
                description="Are you sure you want to delete this transaction?"
                loading={deleteMutation.isPending}
                onConfirm={() =>
                  deleteMutation.mutate(t.id)
                }
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}