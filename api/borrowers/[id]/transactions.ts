import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../../_lib/db.js";
import { AuthError, verifySession } from "../../_lib/auth.js";
import { json, error, methodNotAllowed } from "../../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return GET(req, res);
  return methodNotAllowed(res);
}

async function GET(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);
    const { id } = req.query as { id: string };

    if (!id) return error(res, 400, "Borrower ID is required");

    const { rows } = await pool.query(
      `SELECT t.* FROM transactions t
       JOIN borrowers b ON t.borrower_id = b.id
       WHERE t.borrower_id = $1 AND b.user_id = $2
       ORDER BY t.date DESC NULLS LAST, t.time DESC NULLS LAST`,
      [id, userId]
    );

    return json(res, 200, rows);
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("GET /api/borrowers/[id]/transactions error:", err);
    return error(res, 500, "Internal server error");
  }
}
