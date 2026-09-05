import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { AuthError, extractSessionToken, verifySession } from "./_lib/auth.js";

/**
 * TEMPORARY DIAGNOSTIC ENDPOINT — DO NOT TREAT AS PRODUCTION CODE.
 *
 * Investigaates the production "Internal server error" on /api/borrowers by
 * staging the exact same auth + database calls the real routes use, while
 * logging only secret-free metadata (never passwords, never DATABASE_URL,
 * never full tokens/cookies) and returning a safe boolean/status report.
 *
 * To be removed once the root cause is identified and fixed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const report = {
    requestReceived: true,
    authorizationHeaderPresent: false,
    cookieHeaderPresent: false,
    sessionTokenFound: false,
    neonAuthStatus: null as number | null,
    sessionFound: false,
    userIdFound: false,
    databaseConnection: null as boolean | null,
  };

  try {
    if (req.method !== "GET") {
      console.log("[DEBUG AUTH] Rejected non-GET method:", req.method);
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("[DEBUG AUTH] Request received");

    // 2. Inspect request headers (names only, never values)
    report.authorizationHeaderPresent = Boolean(req.headers.authorization);
    report.cookieHeaderPresent = Boolean(req.headers.cookie);
    console.log("[DEBUG AUTH] Authorization header exists:", report.authorizationHeaderPresent);
    console.log("[DEBUG AUTH] Cookie header exists:", report.cookieHeaderPresent);

    if (req.headers.cookie) {
      const names = req.headers.cookie
        .split(";")
        .map((part) => part.trim().split("=")[0])
        .filter(Boolean);
      console.log("[DEBUG AUTH] Cookie names:", names.join(", ") || "(none)");
    }

    // 3. Session extraction with the real implementation
    const token = extractSessionToken(req);
    report.sessionTokenFound = token !== null;
    console.log("[DEBUG AUTH] Session token found:", report.sessionTokenFound);
    console.log("[DEBUG AUTH] Session token length:", token ? token.length : 0);

    // 4. Neon Auth session validation with the real implementation
    let userId: string | null = null;
    console.log("[DEBUG AUTH] Calling Neon Auth");
    try {
      const verified = await verifySession(req);
      userId = verified.userId;
      report.neonAuthStatus = 200;
      report.sessionFound = true;
      report.userIdFound = true;
      console.log("[DEBUG AUTH] Neon Auth response status: 200");
      console.log("[DEBUG AUTH] Neon Auth session found: true");
      console.log("[DEBUG AUTH] Authenticated user ID exists: true");
    } catch (err) {
      report.neonAuthStatus =
        err instanceof AuthError ? err.status : null;
      report.sessionFound = false;
      report.userIdFound = false;
      console.log(
        "[DEBUG AUTH] Neon Auth response status:",
        report.neonAuthStatus ?? "unknown"
      );
      console.log("[DEBUG AUTH] Neon Auth session found: false");
      console.log("[DEBUG AUTH] Authenticated user ID exists: false");
      console.warn(
        "[DEBUG AUTH] Session validation failed:",
        err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      );
    }

    // 5. Database connectivity (only after authentication succeeded)
    if (userId) {
      try {
        await pool.query("SELECT 1");
        report.databaseConnection = true;
        console.log("[DEBUG AUTH] Database connection: success");
      } catch (dbErr) {
        report.databaseConnection = false;
        console.log("[DEBUG AUTH] Database connection: failed");
        console.warn(
          "[DEBUG AUTH] DB query threw:",
          dbErr instanceof Error ? `${dbErr.name}: ${dbErr.message}` : String(dbErr)
        );
      }
    }

    return res.status(200).json({
      requestReceived: report.requestReceived,
      authorizationHeaderPresent: report.authorizationHeaderPresent,
      cookieHeaderPresent: report.cookieHeaderPresent,
      sessionTokenFound: report.sessionTokenFound,
      neonAuthStatus: report.neonAuthStatus,
      sessionFound: report.sessionFound,
      userIdFound: report.userIdFound,
      databaseConnection: report.databaseConnection,
    });
  } catch (unexpected) {
    console.error("[DEBUG AUTH] Unhandled endpoint error:", unexpected);
    return res.status(500).json({ error: "Internal server error" });
  }
}