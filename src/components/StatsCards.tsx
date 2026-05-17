import { IndianRupee, ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  totalLent: number;
  totalReceived: number;
  totalOutstanding: number;
  activeBorrowers: number;
}

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

export function StatsCards({ totalLent, totalReceived, totalOutstanding, activeBorrowers }: Props) {
  const stats = [
    { label: 'Total Lent', value: formatCurrency(totalLent), icon: ArrowUpRight, color: 'text-destructive' },
    { label: 'Total Received', value: formatCurrency(totalReceived), icon: ArrowDownLeft, color: 'text-primary' },
    { label: 'Outstanding', value: formatCurrency(totalOutstanding), icon: IndianRupee, color: totalOutstanding > 0 ? 'text-warning' : 'text-primary' },
    { label: 'Active Borrowers', value: activeBorrowers.toString(), icon: Users, color: 'text-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => (
        <Card key={s.label} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className={`text-xl md:text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
