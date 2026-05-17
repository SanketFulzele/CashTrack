import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBorrowers,
  getTransactionsByBorrower,
  deleteBorrower,
} from "@/lib/store";
import { TransactionTimeline } from "@/components/TransactionTimeline";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Phone, Trash2, Share2 } from "lucide-react";
import { EditBorrowerDialog } from "@/components/EditBorrowerDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

const BorrowerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: borrowers = [] } = useQuery({
    queryKey: ["borrowers"],
    queryFn: getBorrowers,
  });

  const borrower = borrowers.find((b) => b.id === id);

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", id],
    queryFn: () => getTransactionsByBorrower(id!),
    enabled: !!id,
  });

  const { totalLent, totalReceived, balance } = useMemo(() => {
    const lent = transactions
      .filter((t) => t.type === "lent")
      .reduce((s, t) => s + t.amount, 0);

    const received = transactions
      .filter((t) => t.type === "received")
      .reduce((s, t) => s + t.amount, 0);

    return {
      totalLent: lent,
      totalReceived: received,
      balance: lent - received,
    };
  }, [transactions]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBorrower(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowers"] });
      navigate("/");
    },
  });

  // ✅ SHARE FUNCTION
  const handleShare = () => {
    if (!borrower) return;

    const lines: string[] = [];

    lines.push(`📊 CashTrack Summary`);
    lines.push(``);
    lines.push(`👤 Borrower: ${borrower.name}`);
    lines.push(``);
    lines.push(`💰 Total Lent: ${formatCurrency(totalLent)}`);
    lines.push(`💵 Total Received: ${formatCurrency(totalReceived)}`);
    lines.push(`📌 Balance: ${formatCurrency(balance)}`);
    lines.push(``);
    lines.push(`🧾 Transactions:`);

    transactions.forEach((t) => {
      const type = t.type === "lent" ? "Lent" : "Received";
      const date = new Date(t.date).toLocaleDateString("en-IN");

      lines.push(`${date} - ${type} ₹${t.amount}`);
    });

    const message = lines.join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
  };

  if (!borrower) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Borrower not found</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container px-4 flex items-center h-14 md:h-16 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <img
              src="/cashtrack.png"
              alt="Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
            />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">
              Cash Track
            </h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Borrower Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {borrower.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">
                {borrower.name}
              </h2>

              {borrower.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{borrower.phone}</span>
                </div>
              )}

              {borrower.notes && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {borrower.notes}
                </p>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Share */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <EditBorrowerDialog borrower={borrower} />

            <ConfirmDialog
              title="Delete Borrower"
              description={`Are you sure you want to delete ${borrower.name}? This will permanently remove all transactions.`}
              loading={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate()}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">
                Lent
              </p>
              <p className="font-mono font-semibold text-base sm:text-lg text-destructive">
                {formatCurrency(totalLent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">
                Received
              </p>
              <p className="font-mono font-semibold text-base sm:text-lg text-primary">
                {formatCurrency(totalReceived)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">
                Balance
              </p>
              <p
                className={`font-mono font-semibold text-base sm:text-lg ${
                  balance > 0 ? "text-warning" : "text-primary"
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <div className="flex-1">
            <AddTransactionDialog
              borrowerId={borrower.id}
              type="lent"
            />
          </div>

          <div className="flex-1">
            <AddTransactionDialog
              borrowerId={borrower.id}
              type="received"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-semibold">
            Transaction History
          </h3>
          <TransactionTimeline transactions={transactions} />
        </div>
      </main>
    </div>
  );
};

export default BorrowerPage;