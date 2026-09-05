import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export const createBorrowerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateBorrowerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const createTransactionSchema = z.object({
  borrower_id: z.string().uuid("Borrower ID must be a valid UUID"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["lent", "received"]),
  date: z.string().regex(DATE_REGEX, "Date must be valid (YYYY-MM-DD)"),
  time: z.string().regex(TIME_REGEX, "Time must be valid (HH:MM)").optional(),
  notes: z.string().max(1000).optional(),
});

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  date: z.string().regex(DATE_REGEX, "Date must be valid (YYYY-MM-DD)").optional(),
  time: z.string().regex(TIME_REGEX, "Time must be valid (HH:MM)").optional(),
  notes: z.string().max(1000).optional(),
});
