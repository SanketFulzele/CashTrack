import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { AuthError, verifySession } from "../_lib/auth.js";
import { json, error, methodNotAllowed } from "../_lib/response.js";
import { createBorrowerSchema } from "../_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return GET(req, res);
  if (req.method === "POST") return POST(req, res);
  return methodNotAllowed(res);
}

async function GET(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);

    const { rows } = await pool.query(
      `SELECT * FROM borrowers WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return json(res, 200, rows);
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("GET /api/borrowers error:", err);
    return error(res, 500, "Internal server error");
  }
}

async function POST(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);

    const parsed = createBorrowerSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 400, parsed.error.issues[0].message);
    }

    const { name, phone, notes } = parsed.data;

    const { rows } = await pool.query(
      `INSERT INTO borrowers (user_id, name, phone, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, name, phone || null, notes || null]
    );

    return json(res, 201, rows[0]);
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("POST /api/borrowers error:", err);
    return error(res, 500, "Internal server error");
  }
}
