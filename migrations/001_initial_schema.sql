-- Sprint 2: Neon Database Foundation
-- CashTrack schema: borrowers + transactions
-- Corrected to match actual Supabase source schema defaults
-- Note: type column uses TEXT (not enum) — values are 'lent' / 'received'
-- Note: transactions table does NOT have created_at (TypeScript discrepancy documented in CASH_TRACK_MIGRATION.md)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  borrower_id uuid NOT NULL DEFAULT gen_random_uuid() REFERENCES borrowers(id),
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('lent', 'received')),
  date timestamptz DEFAULT now(),
  time text,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_borrowers_user_id ON borrowers(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_borrower_id ON transactions(borrower_id);
