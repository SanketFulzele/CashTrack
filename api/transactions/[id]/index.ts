import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../../_lib/db.js";
import { AuthError, verifySession } from "../../_lib/auth.js";
import { json, error, methodNotAllowed } from "../../_lib/response.js";
import { updateTransactionSchema } from "../../_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "PATCH") return PATCH(req, res);
  if (req.method === "DELETE") return DELETE(req, res);
  return methodNotAllowed(res);
}

async function PATCH(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);
    const { id } = req.query as { id: string };

    if (!id) return error(res, 400, "Transaction ID is required");

    const parsed = updateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 400, parsed.error.issues[0].message);
    }

    const fields = parsed.data;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (fields.amount !== undefined) { setClauses.push(`amount = $${i++}`); values.push(fields.amount); }
    if (fields.date !== undefined) { setClauses.push(`date = $${i++}`); values.push(fields.date); }
    if (fields.time !== undefined) { setClauses.push(`time = $${i++}`); values.push(fields.time || null); }
    if (fields.notes !== undefined) { setClauses.push(`notes = $${i++}`); values.push(fields.notes || null); }

    if (setClauses.length === 0) return error(res, 400, "No fields to update");

    values.push(id, userId);
    const { rowCount } = await pool.query(
      `UPDATE transactions SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++}`,
      values
    );

    if (rowCount === 0) return error(res, 404, "Transaction not found");

    return json(res, 200, { success: true });
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("PATCH /api/transactions/[id] error:", err);
    return error(res, 500, "Internal server error");
  }
}

async function DELETE(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);
    const { id } = req.query as { id: string };

    if (!id) return error(res, 400, "Transaction ID is required");

    const { rowCount } = await pool.query(
      `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (rowCount === 0) return error(res, 404, "Transaction not found");

    return json(res, 200, { success: true });
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("DELETE /api/transactions/[id] error:", err);
    return error(res, 500, "Internal server error");
  }
}
