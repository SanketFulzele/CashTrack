import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError, extractSessionToken, verifySession } from "../../api/_lib/auth";
import pool from "../../api/_lib/db";
import debugAuthHandler from "../../api/debug-auth";

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
    extractSessionToken: vi.fn(),
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

const mockExtract = vi.mocked(extractSessionToken);
const mockVerify = vi.mocked(verifySession);
const mockQuery = vi.mocked(pool.query);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/debug-auth (temporary diagnostic)", () => {
  it("returns 405 for non-GET requests", async () => {
    const res = createRes();
    await debugAuthHandler(req({ method: "POST" }), res as never);
    expect(res.statusCode).toBe(405);
  });

  it("reports the session-token-missing path without credentials", async () => {
    mockExtract.mockReturnValue(null);

    const res = createRes();
    await debugAuthHandler(req({ method: "GET", headers: {} }), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      requestReceived: true,
      authorizationHeaderPresent: false,
      cookieHeaderPresent: false,
      sessionTokenFound: false,
      neonAuthStatus: null,
      sessionFound: false,
      userIdFound: false,
      databaseConnection: null,
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("reports a failing Neon Auth call and skips the database", async () => {
    mockExtract.mockReturnValue("some-token");
    mockVerify.mockRejectedValue(new AuthError("Unable to verify session", 500));

    const res = createRes();
    await debugAuthHandler(req({ method: "GET", headers: { authorization: "Bearer some-token" } }), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      authorizationHeaderPresent: true,
      sessionTokenFound: true,
      neonAuthStatus: 500,
      sessionFound: false,
      userIdFound: false,
      databaseConnection: null,
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("runs SELECT 1 when the session verifies and reports database success", async () => {
    mockExtract.mockReturnValue("some-token");
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [{ "?column?": 1 }], rowCount: 1 } as never);

    const res = createRes();
    await debugAuthHandler(req({ method: "GET", headers: { authorization: "Bearer some-token" } }), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      authorizationHeaderPresent: true,
      sessionTokenFound: true,
      neonAuthStatus: 200,
      sessionFound: true,
      userIdFound: true,
      databaseConnection: true,
    });
    expect(mockQuery).toHaveBeenCalledWith("SELECT 1");
  });

  it("reports database failure when SELECT 1 throws", async () => {
    mockExtract.mockReturnValue("some-token");
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockRejectedValue(new Error("password authentication failed"));

    const res = createRes();
    await debugAuthHandler(req({ method: "GET", headers: { authorization: "Bearer some-token" } }), res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      sessionFound: true,
      userIdFound: true,
      databaseConnection: false,
    });
  });

  it("never leaks the token value in responses", async () => {
    mockExtract.mockReturnValue("top-secret-token");
    mockVerify.mockResolvedValue({ userId: USER_A });
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 } as never);

    const res = createRes();
    await debugAuthHandler(req({ method: "GET", headers: { authorization: "Bearer some-token" } }), res as never);

    expect(JSON.stringify(res.body)).not.toContain("top-secret-token");
  });
});