export interface Borrower {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  borrower_id: string;
  type: "lent" | "received";
  amount: number;
  date: string;
  time?: string;
  notes?: string | null; // nullable field coming from the database
  created_at: string;
}

export interface BorrowerSummary extends Borrower {
  totalLent: number;
  totalReceived: number;
  balance: number;
}