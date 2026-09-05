import { createAuthClient } from "@neondatabase/neon-js/auth";

export const authClient = createAuthClient(
  import.meta.env.VITE_NEON_AUTH_URL
);

/*
 * Neon Auth's session cookie is scoped to the Neon Auth host, so /api/*
 * requests on the app origin never carry it. Instead the SDK exposes the
 * current session JWT: the Auth server returns a fresh token via the
 * `set-auth-jwt` header on every /get-session call, and the client exposes
 * it as `session.token`. We send it as `Authorization: Bearer <token>` to
 * our own API (api/_lib/auth.ts already extracts that header) and cache it
 * until shortly before its `exp` so we do not hammer the Auth host.
 */

const REFRESH_LEAD_MS = 30_000;

let cachedToken: { value: string; expiresAt: number } | null = null;
let inflightToken: Promise<string | null> | null = null;

function jwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function resetTokenCache() {
  cachedToken = null;
}

export async function getSessionToken(): Promise<string | null> {
  if (
    cachedToken &&
    Date.now() < cachedToken.expiresAt - REFRESH_LEAD_MS
  ) {
    return cachedToken.value;
  }
  if (inflightToken) return inflightToken;

  inflightToken = (async () => {
    try {
      const session = await authClient.getSession();
      const token = session.data?.session?.token ?? null;
      if (!token) {
        resetTokenCache();
        return null;
      }
      cachedToken = {
        value: token,
        expiresAt: jwtExpiryMs(token) ?? Date.now(),
      };
      return token;
    } catch {
      resetTokenCache();
      return null;
    } finally {
      inflightToken = null;
    }
  })();

  return inflightToken;
}

export function invalidateSessionToken(): void {
  resetTokenCache();
}
