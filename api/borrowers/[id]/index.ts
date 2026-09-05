import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../../_lib/db.js";
import { AuthError, verifySession } from "../../_lib/auth.js";
import { json, error, methodNotAllowed } from "../../_lib/response.js";
import { updateBorrowerSchema } from "../../_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "PATCH") return PATCH(req, res);
  if (req.method === "DELETE") return DELETE(req, res);
  return methodNotAllowed(res);
}

async function PATCH(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);
    const { id } = req.query as { id: string };

    if (!id) return error(res, 400, "Borrower ID is required");

    const parsed = updateBorrowerSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 400, parsed.error.issues[0].message);
    }

    const fields = parsed.data;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (fields.name !== undefined) { setClauses.push(`name = $${i++}`); values.push(fields.name); }
    if (fields.phone !== undefined) { setClauses.push(`phone = $${i++}`); values.push(fields.phone || null); }
    if (fields.notes !== undefined) { setClauses.push(`notes = $${i++}`); values.push(fields.notes || null); }

    if (setClauses.length === 0) return error(res, 400, "No fields to update");

    values.push(id, userId);
    const { rowCount } = await pool.query(
      `UPDATE borrowers SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++}`,
      values
    );

    if (rowCount === 0) return error(res, 404, "Borrower not found");

    return json(res, 200, { success: true });
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("PATCH /api/borrowers/[id] error:", err);
    return error(res, 500, "Internal server error");
  }
}

async function DELETE(req: VercelRequest, res: VercelResponse) {
  try {
    const { userId } = await verifySession(req);
    const { id } = req.query as { id: string };

    if (!id) return error(res, 400, "Borrower ID is required");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const txnResult = await client.query(
        `DELETE FROM transactions WHERE borrower_id = $1 AND user_id = $2`,
        [id, userId]
      );

      const borrowerResult = await client.query(
        `DELETE FROM borrowers WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (borrowerResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return error(res, 404, "Borrower not found");
      }

      await client.query("COMMIT");
      return json(res, 200, {
        success: true,
        deletedTransactions: txnResult.rowCount,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    if (err instanceof AuthError) return error(res, err.status, err.message);
    console.error("DELETE /api/borrowers/[id] error:", err);
    return error(res, 500, "Internal server error");
  }
}
