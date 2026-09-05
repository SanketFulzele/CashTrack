import { Borrower, Transaction } from "@/types";
import { getSessionToken } from "@/lib/neon-auth";

/* ===========================
   API REQUEST HELPER
=========================== */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // Neon Auth's session cookie lives on the Auth host, not on this origin, so
  // the browser never sends it to /api/*. Attach the session JWT explicitly;
  // api/_lib/auth.ts extracts it from the Authorization header.
  const token = await getSessionToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  };

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError("Network error: could not reach the API", 0);
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string" && data.error) {
        message = data.error;
      }
    } catch {
      // non-JSON error body — keep the status fallback
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ===========================
   RESPONSE MAPPING
=========================== */

// `transactions.amount` is NUMERIC in Neon, which the `pg` driver returns as a
// string; the frontend type (and Supabase behavior it replaced) uses a number.
function normalizeTransaction(row: Transaction): Transaction {
  return { ...row, amount: Number(row.amount) };
}

/* ===========================
   BORROWERS
=========================== */

export async function getBorrowers(): Promise<Borrower[]> {
  return apiRequest<Borrower[]>("/borrowers");
}

export async function addBorrower(data: {
  name: string;
  phone?: string;
  notes?: string;
}): Promise<Borrower> {
  const payload: { name: string; phone?: string; notes?: string } = {
    name: data.name,
  };
  if (data.phone) payload.phone = data.phone;
  if (data.notes) payload.notes = data.notes;
  return apiRequest<Borrower>("/borrowers", {
    method: "POST",
    body: payload,
  });
}

export async function updateBorrower(
  id: string,
  updates: {
    name?: string;
    phone?: string;
    notes?: string;
  }
): Promise<void> {
  await apiRequest<void>(`/borrowers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    // Undefined becomes "" so the API clears cleared fields (same as the old
    // store sending null); undefined keys are dropped by JSON.stringify.
    body: {
      name: updates.name,
      phone: updates.phone ?? "",
      notes: updates.notes ?? "",
    },
  });
}

export async function deleteBorrower(id: string): Promise<void> {
  await apiRequest<void>(`/borrowers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* ===========================
   TRANSACTIONS
=========================== */

export async function getTransactionsByBorrower(
  borrowerId: string
): Promise<Transaction[]> {
  const rows = await apiRequest<Transaction[]>(
    `/borrowers/${encodeURIComponent(borrowerId)}/transactions`
  );
  return rows.map(normalizeTransaction);
}

export async function addTransaction(t: {
  borrower_id: string;
  amount: number;
  type: "lent" | "received";
  date: string;
  time?: string;
  notes?: string | null;
}): Promise<Transaction> {
  const payload: {
    borrower_id: string;
    amount: number;
    type: "lent" | "received";
    date: string;
    time?: string;
    notes?: string;
  } = {
    borrower_id: t.borrower_id,
    amount: t.amount,
    type: t.type,
    date: t.date,
  };

  if (t.time) payload.time = t.time;
  if (t.notes && t.notes.trim() !== "") payload.notes = t.notes;

  const row = await apiRequest<Transaction>("/transactions", {
    method: "POST",
    body: payload,
  });
  return normalizeTransaction(row);
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
  await apiRequest<void>(`/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: {
      ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
      ...(updates.date !== undefined ? { date: updates.date } : {}),
      ...(updates.time !== undefined ? { time: updates.time } : {}),
      notes: updates.notes ?? "",
    },
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiRequest<void>(`/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}