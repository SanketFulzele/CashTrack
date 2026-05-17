import { supabase } from "@/lib/supabase";
import { Borrower, Transaction } from "@/types";

/* ===========================
   BORROWERS
=========================== */

export async function getBorrowers(): Promise<Borrower[]> {
  const { data, error } = await supabase
    .from("borrowers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching borrowers:", error);
    throw error;
  }

  return data ?? [];
}

export async function addBorrower(data: {
  name: string;
  phone?: string;
  notes?: string;
}): Promise<Borrower> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  // Build payload safely without nulls
  const payload = {
    name: data.name,
    user_id: user.id,
    ...(data.phone ? { phone: data.phone } : {}),
    ...(data.notes ? { notes: data.notes } : {}),
  };

  const { data: inserted, error } = await supabase
    .from("borrowers")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error adding borrower:", error);
    throw error;
  }

  return inserted;
}

export async function updateBorrower(
  id: string,
  updates: {
    name?: string;
    phone?: string;
    notes?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("borrowers")
    .update({
      name: updates.name,
      phone: updates.phone || null,
      notes: updates.notes || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating borrower:", error);
    throw error;
  }
}

export async function deleteBorrower(id: string): Promise<void> {
  const { error: txnError } = await supabase
    .from("transactions")
    .delete()
    .eq("borrower_id", id);

  if (txnError) {
    console.error("Error deleting related transactions:", txnError);
    throw txnError;
  }

  const { error } = await supabase
    .from("borrowers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting borrower:", error);
    throw error;
  }
}

/* ===========================
   TRANSACTIONS
=========================== */

export async function getTransactionsByBorrower(
  borrowerId: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("borrower_id", borrowerId)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }

  return data ?? [];
}

export async function addTransaction(t: {
  borrower_id: string;
  amount: number;
  type: "lent" | "received";
  date: string;
  time?: string;
  notes?: string | null;
}): Promise<Transaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const payload: {
    borrower_id: string;
    amount: number;
    type: "lent" | "received";
    date: string;
    user_id: string;
    time?: string;
    notes?: string | null;
  } = {
    borrower_id: t.borrower_id,
    amount: t.amount,
    type: t.type,
    date: t.date,
    user_id: user.id,
  };

  if (t.time) payload.time = t.time;
  if (t.notes && t.notes.trim() !== "") payload.notes = t.notes;

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }

  return data;
}

export async function updateTransaction(
  id: string,
  updates: {
    amount?: number;
    date?: string;
    time?: string;
    notes?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({
      amount: updates.amount,
      date: updates.date,
      time: updates.time,
      notes: updates.notes ?? null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
}