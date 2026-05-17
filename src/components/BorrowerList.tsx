import { BorrowerSummary } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, ChevronRight } from 'lucide-react';

interface Props {
  borrowers: BorrowerSummary[];
  onSelect: (id: string) => void;
}

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

export function BorrowerList({ borrowers, onSelect }: Props) {
  if (borrowers.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-base font-medium">No borrowers yet</p>
        <p className="text-sm mt-1">Add a borrower to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {borrowers.map((b) => (
        <Card
          key={b.id}
          className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
          onClick={() => onSelect(b.id)}
        >
          <CardContent className="px-4 py-3 flex items-center gap-3">

            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {b.name.charAt(0).toUpperCase()}
            </div>

            {/* Middle Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {b.name}
              </p>

              {b.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{b.phone}</span>
                </div>
              )}

              <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground">
                <span>
                  Lent{" "}
                  <span className="text-destructive font-mono">
                    {formatCurrency(b.totalLent)}
                  </span>
                </span>

                <span>
                  Rec{" "}
                  <span className="text-primary font-mono">
                    {formatCurrency(b.totalReceived)}
                  </span>
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="text-right shrink-0">
              <p
                className={`font-mono font-semibold text-sm ${
                  b.balance > 0 ? 'text-warning' : 'text-primary'
                }`}
              >
                {formatCurrency(b.balance)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Bal
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}