import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBorrowers, getTransactionsByBorrower } from "@/lib/store";
import { BorrowerSummary } from "@/types";
import { StatsCards } from "@/components/StatsCards";
import { BorrowerList } from "@/components/BorrowerList";
import { AddBorrowerDialog } from "@/components/AddBorrowerDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: borrowers = [] } = useQuery({
    queryKey: ["borrowers"],
    queryFn: getBorrowers,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["all-transactions"],
    queryFn: async () => {
      const all = await Promise.all(
        borrowers.map((b) => getTransactionsByBorrower(b.id))
      );
      return all.flat();
    },
    enabled: borrowers.length > 0,
  });

  const summaries: BorrowerSummary[] = useMemo(() => {
    return borrowers.map((b) => {
      const bTxns = transactions.filter(
        (t) => t.borrower_id === b.id
      );

      const totalLent = bTxns
        .filter((t) => t.type === "lent")
        .reduce((s, t) => s + t.amount, 0);

      const totalReceived = bTxns
        .filter((t) => t.type === "received")
        .reduce((s, t) => s + t.amount, 0);

      return {
        ...b,
        totalLent,
        totalReceived,
        balance: totalLent - totalReceived,
      };
    });
  }, [borrowers, transactions]);

  const stats = useMemo(() => {
    return {
      totalLent: summaries.reduce((s, b) => s + b.totalLent, 0),
      totalReceived: summaries.reduce((s, b) => s + b.totalReceived, 0),
      totalOutstanding: summaries.reduce((s, b) => s + b.balance, 0),
      activeBorrowers: summaries.filter((b) => b.balance > 0).length,
    };
  }, [summaries]);

  const filtered = summaries.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const lines = ["Borrower,Type,Amount,Date"];
    transactions.forEach((t) => {
      const borrower = borrowers.find(
        (b) => b.id === t.borrower_id
      );
      lines.push(
        `"${borrower?.name || "Unknown"}","${t.type}",${t.amount},"${t.date}"`
      );
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashtrack-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container px-4 flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-2">
            <img
              src="/cashtrack.png"
              alt="Logo"
              className="h-9 w-9 sm:h-11 sm:w-11 object-contain"
            />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">
              Cash Track
            </h1>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="gap-2 text-xs"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <AddBorrowerDialog />

            <UserMenu />
          </div>

          {/* Mobile User */}
          <div className="sm:hidden">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <div className="text-sm">
          <StatsCards {...stats} />
        </div>

        <div className="space-y-4">
          {/* Borrowers Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold">
              Borrowers
            </h2>

            {/* Mobile Buttons */}
            <div className="flex items-center gap-2 sm:hidden">
              <AddBorrowerDialog />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="p-2"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search borrowers..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-9 bg-white/50 text-sm"
            />
          </div>

          <BorrowerList
            borrowers={filtered}
            onSelect={(id) =>
              navigate(`/borrower/${id}`)
            }
          />
        </div>
      </main>
    </div>
  );
};

export default Index;