import type { VercelResponse } from "@vercel/node";

export function json(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data);
}

export function error(res: VercelResponse, status: number, message: string) {
  return json(res, status, { error: message });
}

export function methodNotAllowed(res: VercelResponse) {
  return error(res, 405, "Method not allowed");
}
