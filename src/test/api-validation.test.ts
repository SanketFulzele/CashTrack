import { describe, it, expect } from "vitest";
import {
  createBorrowerSchema,
  updateBorrowerSchema,
  createTransactionSchema,
  updateTransactionSchema,
} from "../../api/_lib/validation";

describe("createBorrowerSchema", () => {
  it("accepts valid data", () => {
    const result = createBorrowerSchema.safeParse({ name: "John" });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = createBorrowerSchema.safeParse({
      name: "John",
      phone: "123",
      notes: "test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createBorrowerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createBorrowerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateBorrowerSchema", () => {
  it("accepts partial update", () => {
    const result = updateBorrowerSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  it("accepts empty update", () => {
    const result = updateBorrowerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = updateBorrowerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  it("accepts valid lent transaction", () => {
    const result = createTransactionSchema.safeParse({
      borrower_id: "00000000-0000-0000-0000-000000000001",
      amount: 100,
      type: "lent",
      date: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid received transaction", () => {
    const result = createTransactionSchema.safeParse({
      borrower_id: "00000000-0000-0000-0000-000000000001",
      amount: 50.5,
      type: "received",
      date: "2026-01-01",
      time: "14:30",
      notes: "cash",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = createTransactionSchema.safeParse({
      borrower_id: "00000000-0000-0000-0000-000000000001",
      amount: 100,
      type: "invalid",
      date: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive amount", () => {
    const result = createTransactionSchema.safeParse({
      borrower_id: "00000000-0000-0000-0000-000000000001",
      amount: 0,
      type: "lent",
      date: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid uuid", () => {
    const result = createTransactionSchema.safeParse({
      borrower_id: "not-a-uuid",
      amount: 100,
      type: "lent",
      date: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed time", () => {
    const result = createTransactionSchema.safeParse({
      borrower_id: "00000000-0000-0000-0000-000000000001",
      amount: 100,
      type: "lent",
      date: "2026-01-01",
      time: "14:3",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = createTransactionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateTransactionSchema", () => {
  it("accepts partial update", () => {
    const result = updateTransactionSchema.safeParse({ amount: 200 });
    expect(result.success).toBe(true);
  });

  it("accepts empty update", () => {
    const result = updateTransactionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects non-positive amount", () => {
    const result = updateTransactionSchema.safeParse({ amount: -1 });
    expect(result.success).toBe(false);
  });
});
