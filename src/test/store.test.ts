import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const { getSessionTokenMock } = vi.hoisted(() => ({
  getSessionTokenMock: vi.fn(),
}));

vi.mock("@/lib/neon-auth", () => ({
  getSessionToken: getSessionTokenMock,
}));

import {
  ApiError,
  getBorrowers,
  addBorrower,
  updateBorrower,
  deleteBorrower,
  getTransactionsByBorrower,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/store";

const fetchMock = vi.fn();

const BORROWER = "11111111-1111-4111-8111-111111111111";
const TXN_1 = "33333333-3333-4333-8333-333333333333";

function mockFetchOk(body: unknown, status = 200) {
  fetchMock.mockResolvedValue({
    ok: true,
    status,
    json: async () => body,
  } as never);
}

function mockFetchError(status: number, body?: unknown) {
  fetchMock.mockResolvedValue({
    ok: false,
    status,
    statusText: "Unauthorized",
    json: async () => body,
  } as never);
}

function lastFetchCallBody(): Record<string, unknown> {
  const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse((call[1] as RequestInit).body as string);
}

function lastFetchCallInit(): RequestInit {
  const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return call[1] as RequestInit;
}

describe("src/lib/store (API-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    getSessionTokenMock.mockResolvedValue("session-jwt-token");
  });

  it("getBorrowers calls GET /api/borrowers", async () => {
    const rows = [{ id: BORROWER, name: "Alice", created_at: "2026-01-01T00:00:00.000Z" }];
    mockFetchOk(rows);

    const result = await getBorrowers();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/borrowers",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(rows);
  });

  it("addBorrower calls POST /api/borrowers with the expected body and no user_id", async () => {
    mockFetchOk({ id: BORROWER, name: "Bob" }, 201);

    const result = await addBorrower({ name: "Bob", phone: "", notes: "" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/borrowers",
      expect.objectContaining({ method: "POST" })
    );
    expect(lastFetchCallBody()).toEqual({ name: "Bob" });
    expect(lastFetchCallBody().user_id).toBeUndefined();
    expect(result).toEqual({ id: BORROWER, name: "Bob" });
  });

  it("updateBorrower calls PATCH /api/borrowers/:id (undefined clears via empty string)", async () => {
    mockFetchOk({ success: true });

    await updateBorrower(BORROWER, {
      name: "New Name",
      phone: undefined,
      notes: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/borrowers/${BORROWER}`,
      expect.objectContaining({ method: "PATCH" })
    );
    expect(lastFetchCallBody()).toEqual({
      name: "New Name",
      phone: "",
      notes: "",
    });
    expect(lastFetchCallBody().user_id).toBeUndefined();
  });

  it("deleteBorrower calls DELETE /api/borrowers/:id", async () => {
    mockFetchOk({ success: true });

    await deleteBorrower(BORROWER);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/borrowers/${BORROWER}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("getTransactionsByBorrower calls GET /api/borrowers/:borrowerId/transactions and normalizes numeric amount", async () => {
    const rows = [
      {
        id: TXN_1,
        amount: "500.00",
        type: "lent",
        date: "2026-01-05T00:00:00.000Z",
      },
    ];
    mockFetchOk(rows);

    const result = await getTransactionsByBorrower(BORROWER);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/borrowers/${BORROWER}/transactions`,
      expect.objectContaining({ method: "GET" })
    );
    expect(result[0].amount).toBe(500);
  });

  it("addTransaction calls POST /api/transactions with expected body and no user_id / no Supabase dependency", async () => {
    mockFetchOk(
      { id: TXN_1, amount: "250.00", type: "lent", date: "2026-01-05T00:00:00.000Z" },
      201
    );

    const result = await addTransaction({
      borrower_id: BORROWER,
      amount: 250,
      type: "lent",
      date: "2026-01-05",
      time: "10:30",
      notes: "lunch",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/transactions",
      expect.objectContaining({ method: "POST" })
    );
    expect(lastFetchCallBody()).toEqual({
      borrower_id: BORROWER,
      amount: 250,
      type: "lent",
      date: "2026-01-05",
      time: "10:30",
      notes: "lunch",
    });
    expect(lastFetchCallBody().user_id).toBeUndefined();
    expect(result.amount).toBe(250);
  });

  it("addTransaction omits empty optional fields", async () => {
    mockFetchOk({ id: TXN_1, amount: "10" }, 201);

    await addTransaction({
      borrower_id: BORROWER,
      amount: 10,
      type: "received",
      date: "2026-01-05",
      time: "",
      notes: "",
    });

    expect(lastFetchCallBody()).toEqual({
      borrower_id: BORROWER,
      amount: 10,
      type: "received",
      date: "2026-01-05",
    });
  });

  it("updateTransaction calls PATCH /api/transactions/:id", async () => {
    mockFetchOk({ success: true });

    await updateTransaction(TXN_1, {
      amount: 300,
      date: "2026-02-01",
      time: undefined,
      notes: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/transactions/${TXN_1}`,
      expect.objectContaining({ method: "PATCH" })
    );
    expect(lastFetchCallBody()).toEqual({
      amount: 300,
      date: "2026-02-01",
      notes: "",
    });
    expect(lastFetchCallBody().user_id).toBeUndefined();
  });

  it("deleteTransaction calls DELETE /api/transactions/:id", async () => {
    mockFetchOk({ success: true });

    await deleteTransaction(TXN_1);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/transactions/${TXN_1}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throws a useful ApiError for a non-2xx response with an { error } body", async () => {
    mockFetchError(400, { error: "Amount must be positive" });

    await expect(
      addTransaction({
        borrower_id: BORROWER,
        amount: 0,
        type: "lent",
        date: "2026-01-05",
      })
    ).rejects.toThrow("Amount must be positive");

    try {
      await addTransaction({
        borrower_id: BORROWER,
        amount: 0,
        type: "lent",
        date: "2026-01-05",
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
    }
  });

  it("throws a useful error for a non-JSON error body", async () => {
    mockFetchError(500);

    await expect(deleteTransaction(TXN_1)).rejects.toThrow(
      "Request failed with status 500"
    );
  });

  it("attaches the Neon session JWT as a Bearer token on every request", async () => {
    mockFetchOk([]);
    getSessionTokenMock.mockResolvedValue("fresh-jwt");

    await getBorrowers();

    expect(getSessionTokenMock).toHaveBeenCalled();
    expect(lastFetchCallInit().headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer fresh-jwt" })
    );
  });

  it("omits Authorization when no session token is available", async () => {
    mockFetchError(401, { error: "Session token missing" });
    getSessionTokenMock.mockResolvedValue(null);

    await expect(getBorrowers()).rejects.toThrow("Session token missing");

    expect(lastFetchCallInit().headers).toEqual({});
    expect(lastFetchCallInit().headers).not.toHaveProperty("Authorization");
  });
});

describe("store source check (no Supabase database dependency)", () => {
  const storeSource = readFileSync(
    path.resolve(process.cwd(), "src/lib/store.ts"),
    "utf-8"
  );

  it("store.ts contains no Supabase imports or database calls", () => {
    expect(storeSource).not.toContain("supabase");
    expect(storeSource).not.toContain("@supabase/supabase-js");
    expect(storeSource).not.toContain("getUser");
    expect(storeSource).not.toContain(".from(");
  });

  it("store.ts delegates everything to /api endpoints", () => {
    expect(storeSource).toContain('fetch(`/api');
    expect(storeSource).toContain('"/borrowers"');
    expect(storeSource).toContain('"/transactions"');
  });

  it("store.ts authenticates /api requests with the Neon session token", () => {
    expect(storeSource).toContain("@/lib/neon-auth");
    expect(storeSource).toContain("getSessionToken");
    expect(storeSource).toContain("Authorization");
    expect(storeSource).toContain("Bearer");
  });
});