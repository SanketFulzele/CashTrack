import { describe, expect, it } from "vitest";
import { AuthError, extractSessionToken } from "../../api/_lib/auth";

describe("api/_lib/auth — extractSessionToken", () => {
  it("extracts Bearer token from Authorization header", () => {
    const token = extractSessionToken({
      headers: { authorization: "Bearer 33333333-3333-4333-8333-333333333333" },
    } as never);
    expect(token).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("extracts the Neon session token cookie", () => {
    const token = extractSessionToken({
      headers: {
        cookie: `__Secure-neon-auth.session_token=${"33333333-3333-4333-8333-333333333333"}; other=value`,
      },
    } as never);
    expect(token).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("extracts the http (non-secure prefix) session token cookie", () => {
    const token = extractSessionToken({
      headers: {
        cookie: `neon-auth.session_token=${"22222222-2222-4222-8222-222222222222"}`,
      },
    } as never);
    expect(token).toBe("22222222-2222-4222-8222-222222222222");
  });

  it("returns null when no token present", () => {
    const token = extractSessionToken({ headers: {} } as never);
    expect(token).toBeNull();
  });

  it("returns null for an empty Bearer token", () => {
    const token = extractSessionToken({
      headers: { authorization: "Bearer " },
    } as never);
    expect(token).toBeNull();
  });

  it("AuthError default status is 401", () => {
    const err = new AuthError("Unauthorized");
    expect(err.status).toBe(401);
  });
});