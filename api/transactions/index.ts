import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { AuthError, verifySession } from "../_lib/auth.js";
import { json, error, methodNotAllowed } from "../_lib/response.js";
import { createTransactionSchema } from "../_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") return POST(req, res);
  return methodNotAllowed(res);
}

async function POST(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);

    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 400, parsed.error.issues[0].message);
    }

    const { borrower_id, amount, type, date, time, notes } = parsed.data;

    const { rows: owners } = await pool.query(
      `SELECT id FROM borrowers WHERE id = $1 AND user_id = $2`,
      [borrower_id, userId]
    );

    if (owners.length === 0) {
      return error(res, 404, "Borrower not found or access denied");
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, borrower_id, amount, type, date, time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, borrower_id, amount, type, date, time || null, notes || null]
    );

    return json(res, 201, rows[0]);
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("POST /api/transactions error:", err);
    return error(res, 500, "Internal server error");
  }
}
