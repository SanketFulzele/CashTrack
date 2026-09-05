import type { VercelRequest } from "@vercel/node";

const SESSION_TOKEN_COOKIE_NAME = "__Secure-neon-auth.session_token";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

interface SessionResponse {
  session: unknown;
  user: { id: string } | null;
}

export function extractSessionToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return token.trim() || null;
  }

  const cookie = req.headers.cookie;
  if (!cookie) return null;

  const match = cookie.match(
    /(?:^|;\s*)([^;=\s]*session_token[^;=\s]*)=([^;]+)/i
  );
  return match ? match[2].trim() : null;
}

/**
 * Server-side session verification.
 *
 * Delegates session validation to the managed Neon Auth server via its
 * public `get-session` endpoint — the same mechanism used internally by the
 * official `@neondatabase/auth/server` toolkit. Requires only the auth base
 * URL; no cookie secret, JWKS parsing, or key management on this side.
 *
 * The authenticated user's id (`user.id`) is extracted from the verified
 * session and used for every database query. A user_id supplied by the
 * browser is never trusted.
 */
export async function verifySession(req: VercelRequest): Promise<{ userId: string }> {
  const token = extractSessionToken(req);
  if (!token) throw new AuthError("Session token missing");

  const baseUrl = process.env.NEON_AUTH_URL;
  if (!baseUrl) throw new AuthError("NEON_AUTH_URL is not set on the server", 500);

  const sessionRes = await fetch(`${baseUrl}/get-session`, {
    method: "GET",
    headers: {
      Cookie: `${SESSION_TOKEN_COOKIE_NAME}=${token}`,
    },
  });

  if (!sessionRes.ok) {
    throw new AuthError("Unable to verify session", 500);
  }

  const data = (await sessionRes.json()) as SessionResponse;
  const userId = data.user?.id;
  if (!userId) throw new AuthError("Unauthorized");

  return { userId };
}