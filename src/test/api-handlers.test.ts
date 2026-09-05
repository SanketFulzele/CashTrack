import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError, verifySession } from "../../api/_lib/auth";
import pool from "../../api/_lib/db";
import borrowersHandler from "../../api/borrowers/index";
import borrowerByIdHandler from "../../api/borrowers/[id]/index";
import borrowerTransactionsHandler from "../../api/borrowers/[id]/transactions";
import transactionsHandler from "../../api/transactions/index";
import transactionByIdHandler from "../../api/transactions/[id]/index";

vi.mock("../../api/_lib/auth.js", () => {
  class MockAuthError extends Error {
    status: number;
    constructor(message: string, status = 401) {
      super(message);
      this.name = "AuthError";
      this.status = status;
    }
  }
  return {
    AuthError: MockAuthError,
    verifySession: vi.fn(),
  };
});

vi.mock("../../api/_lib/db.js", () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ATTRACKER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const BORROWER_A = "11111111-1111-4111-8111-111111111111";
const BORROWER_B = "22222222-2222-4222-8222-222222222222";
const TXN_1 = "33333333-3333-4333-8333-333333333333";

interface Res {
  statusCode: number;
  body: unknown;
  status: (code: number) => Res;
  json: (data: unknown) => Res;
}

function createRes(): Res {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(this: Res, code: number): Res {
      this.statusCode = code;
      return this;
    },
    json(this: Res, data: unknown): Res {
      this.body = data;
      return this;
    },
  };
  return res;
}

function req(overrides: Record<string, unknown> = {}) {
  return {
    method: "GET",
    headers: {},
    query: {},
    body: {},
    ...overrides,
  } as never;
}

const mockVerify = vi.mocked(verifySession);
const mockQuery = vi.mocked(pool.query);

beforeEach(() => {
  vi.clearAllMocks();
  (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [], rowCount: 0 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/borrowers", () => {
  it("returns 401 when unauthenticated", async () => {
    mockVerify.mockRejectedValue(new AuthError("Session token missing"));
    const res = createRes();
    const r = req({ method: "GET" });
    await borrowersHandler(r, res as never);
    expect(res.statusCode).toBe(401);
  });

  it("returns only the authenticated user's borrowers", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const rows = [{ id: BORROWER_A, user_id: USER_A, name: "Alice" }];
    mockQuery.mockResolvedValue({ rows, rowCount: 1 } as never);
    const res = createRes();
    await borrowersHandler(req({ method: "GET" }), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE user_id = $1"),
      [USER_A]
    );
  });
});

describe("POST /api/borrowers", () => {
  it("creates a borrower using the authenticated user id", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const created = { id: BORROWER_A, user_id: USER_A, name: "Bob" };
    mockQuery.mockResolvedValue({ rows: [created], rowCount: 1 } as never);
    const res = createRes();
    await borrowersHandler(
      req({ method: "POST", body: { name: "Bob", user_id: ATTRACKER } }),
      res as never
    );
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(created);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      [USER_A, "Bob", null, null]
    );
  });

  it("returns 400 for missing name", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const res = createRes();
    await borrowersHandler(req({ method: "POST", body: {} }), res as never);
    expect(res.statusCode).toBe(400);
  });

  it("does not let a spoofed user_id change ownership", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [{ id: BORROWER_A }], rowCount: 1 } as never);
    const res = createRes();
    await borrowersHandler(
      req({ method: "POST", body: { name: "Mallory", user_id: ATTRACKER } }),
      res as never
    );
    const args = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
    expect(args[1][0]).toBe(USER_A);
    expect(args[1]).not.toContain(ATTRACKER);
  });
});

describe("PATCH /api/borrowers/:id", () => {
  it("updates own borrower and returns 200", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
    const res = createRes();
    await borrowerByIdHandler(
      req({ method: "PATCH", query: { id: BORROWER_A }, body: { name: "New" } }),
      res as never
    );
    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = $2 AND user_id = $3"),
      ["New", BORROWER_A, USER_A]
    );
  });

  it("returns 404 when borrower not found/not owned", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    const res = createRes();
    await borrowerByIdHandler(
      req({ method: "PATCH", query: { id: BORROWER_B }, body: { name: "Hmm" } }),
      res as never
    );
    expect(res.statusCode).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockVerify.mockRejectedValue(new AuthError("Unauthorized"));
    const res = createRes();
    await borrowerByIdHandler(
      req({ method: "PATCH", query: { id: BORROWER_A }, body: { name: "X" } }),
      res as never
    );
    expect(res.statusCode).toBe(401);
  });
});

describe("DELETE /api/borrowers/:id (manual cascade)", () => {
  it("deletes transactions then borrower in a transaction", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const client = {
      query: vi.fn(),
      release: vi.fn(),
    };
    vi.mocked(pool.connect).mockResolvedValue(client as never);
    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 2 }) // DELETE transactions
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // DELETE borrowers
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT
    const res = createRes();
    await borrowerByIdHandler(
      req({ method: "DELETE", query: { id: BORROWER_A } }),
      res as never
    );
    expect(res.statusCode).toBe(200);
    expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM transactions WHERE borrower_id = $1 AND user_id = $2"),
      [BORROWER_A, USER_A]
    );
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("DELETE FROM borrowers WHERE id = $1 AND user_id = $2"),
      [BORROWER_A, USER_A]
    );
    expect(client.query).toHaveBeenNthCalledWith(4, "COMMIT");
  });

  it("rolls back and returns 404 when borrower not owned", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const client = { query: vi.fn(), release: vi.fn() };
    vi.mocked(pool.connect).mockResolvedValue(client as never);
    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // DELETE transactions
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // DELETE borrowers -> not owned
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK
    const res = createRes();
    await borrowerByIdHandler(
      req({ method: "DELETE", query: { id: BORROWER_B } }),
      res as never
    );
    expect(res.statusCode).toBe(404);
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.query).not.toHaveBeenCalledWith("COMMIT");
  });
});

describe("GET /api/borrowers/:id/transactions", () => {
  it("returns transactions only for owned borrower", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const rows = [{ id: TXN_1, user_id: USER_A, borrower_id: BORROWER_A }];
    mockQuery.mockResolvedValue({ rows, rowCount: 1 } as never);
    const res = createRes();
    await borrowerTransactionsHandler(
      req({ method: "GET", query: { id: BORROWER_A } }),
      res as never
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(rows);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("JOIN borrowers b ON t.borrower_id = b.id"),
      [BORROWER_A, USER_A]
    );
  });
});

describe("POST /api/transactions", () => {
  const validTxn = {
    borrower_id: BORROWER_A,
    amount: 100,
    type: "lent",
    date: "2026-01-05",
  };

  it("creates transaction for an owned borrower", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: BORROWER_A }], rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [{ id: TXN_1 }], rowCount: 1 } as never);
    const res = createRes();
    await transactionsHandler(req({ method: "POST", body: validTxn }), res as never);
    expect(res.statusCode).toBe(201);
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[0]).toContain("INSERT INTO transactions");
    expect(insertCall[1]).toEqual([USER_A, BORROWER_A, 100, "lent", "2026-01-05", null, null]);
  });

  it("rejects transaction for a borrower not owned by user", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    const res = createRes();
    await transactionsHandler(req({ method: "POST", body: validTxn }), res as never);
    expect(res.statusCode).toBe(404);
    expect(mockQuery).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO transactions"), expect.anything());
  });

  it("rejects a spoofed user_id", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const body = { ...validTxn, user_id: ATTRACKER };
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: BORROWER_A }], rowCount: 1 } as never)
      .mockResolvedValueOnce({ rows: [{ id: TXN_1 }], rowCount: 1 } as never);
    const res = createRes();
    await transactionsHandler(req({ method: "POST", body }), res as never);
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1][0]).toBe(USER_A);
    expect(insertCall[1]).not.toContain(ATTRACKER);
  });

  it("returns 400 for invalid type", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const res = createRes();
    await transactionsHandler(
      req({ method: "POST", body: { ...validTxn, type: "gifted" } }),
      res as never
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for non-positive amount", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const res = createRes();
    await transactionsHandler(
      req({ method: "POST", body: { ...validTxn, amount: 0 } }),
      res as never
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid borrower id", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const res = createRes();
    await transactionsHandler(
      req({ method: "POST", body: { ...validTxn, borrower_id: "not-a-uuid" } }),
      res as never
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for malformed date", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const res = createRes();
    await transactionsHandler(
      req({ method: "POST", body: { ...validTxn, date: "not-a-date" } }),
      res as never
    );
    expect(res.statusCode).toBe(400);
  });
});

describe("PATCH /api/transactions/:id", () => {
  it("updates own transaction and returns 200", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
    const res = createRes();
    await transactionByIdHandler(
      req({ method: "PATCH", query: { id: TXN_1 }, body: { amount: 250 } }),
      res as never
    );
    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = $2 AND user_id = $3"),
      [250, TXN_1, USER_A]
    );
  });

  it("returns 404 when not owned or missing", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    const res = createRes();
    await transactionByIdHandler(
      req({ method: "PATCH", query: { id: TXN_1 }, body: { notes: "x" } }),
      res as never
    );
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /api/transactions/:id", () => {
  it("deletes own transaction and returns 200", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);
    const res = createRes();
    await transactionByIdHandler(
      req({ method: "DELETE", query: { id: TXN_1 } }),
      res as never
    );
    expect(res.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE id = $1 AND user_id = $2"),
      [TXN_1, USER_A]
    );
  });

  it("does not delete another user's transaction", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);
    const res = createRes();
    await transactionByIdHandler(
      req({ method: "DELETE", query: { id: TXN_1 } }),
      res as never
    );
    expect(res.statusCode).toBe(404);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      [TXN_1, USER_A]
    );
  });
});

describe("method not allowed", () => {
  it("returns 405 for unsupported methods", async () => {
    const res = createRes();
    await borrowersHandler(req({ method: "PUT" }), res as never);
    expect(res.statusCode).toBe(405);
  });
});

describe("SQL injection resistance", () => {
  it("passes malicious input as a bound parameter, not interpolated SQL", async () => {
    mockVerify.mockResolvedValue({ userId: USER_A });
    const evil = "Bob'; DROP TABLE borrowers; --";
    mockQuery.mockResolvedValue({ rows: [{ id: BORROWER_A, name: evil }], rowCount: 1 } as never);
    const res = createRes();
    await borrowersHandler(
      req({ method: "POST", body: { name: evil } }),
      res as never
    );
    expect(res.statusCode).toBe(201);
    const call = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
    expect(call[0]).not.toContain("DROP TABLE");
    expect(call[1]).toContain(evil);
  });
});