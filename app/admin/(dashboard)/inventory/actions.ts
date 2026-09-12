"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fd, toFieldErrors } from "@/lib/admin/catalog";
import type { InventoryActionState } from "./InventoryAdjustForm";

/**
 * Inventory mutations (A4).
 *
 * SECURITY: every action re-validates the admin session server-side and
 * re-validates the submitted payload with Zod. The UI is never trusted.
 *
 * CONCURRENCY: stock transitions are applied by an atomic conditional
 * `UPDATE … WHERE … RETURNING` statement, so the arithmetic and the
 * insufficient-stock check run inside PostgreSQL, not in application memory.
 * PostgreSQL row-locks the Book row for the duration of the surrounding
 * transaction, which serialises concurrent adjustments — a read-then-write
 * pattern under the default READ COMMITTED isolation would lose updates
 * (verified: two concurrent +5/+3 adjustments on stock 10 produced 13 instead
 * of 18 before this fix).
 */

// ── Validation schemas ─────────────────────────────────────────────────────

const adjustmentSchema = z.object({
  bookId: z.string().trim().min(1, "Book is required"),
  type: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN", "DAMAGE"], {
    message: "Choose a valid transaction type",
  }),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required")
    .refine((v) => /^\d+$/.test(v), "Must be a whole number")
    .refine((v) => Number(v) > 0, "Quantity must be at least 1")
    .refine((v) => Number(v) <= 100000, "Quantity is unreasonably high")
    .transform((v) => Number(v)),
  note: z
    .string()
    .trim()
    .max(500, "Note is too long")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

// ── Core mutation ──────────────────────────────────────────────────────────

interface StockTransition {
  stockBefore: number;
  stockAfter: number;
}

/**
 * Apply a signed delta to a book's stock with one atomic statement.
 *
 * `UPDATE "Book" SET stockQuantity = stockQuantity + delta WHERE id = …
 *  AND stockQuantity >= -delta RETURNING …`
 *
 * - The delta is computed by the database, so concurrent updates on the same
 *   row serialise instead of overwriting each other (no lost updates).
 * - The `stockQuantity >= -delta` guard makes the insufficient-stock check
 *   atomic with the write (no check-then-act gap). For increases the guard is
 *   trivially true because stock is never negative.
 * - Returns null when no row matched: either the book is missing or a
 *   decrease would take stock below zero. The caller disambiguates.
 * - Must run inside a transaction (the row lock is held until commit so the
 *   follow-up InventoryTransaction insert observes a stable transition).
 */
async function applyStockDelta(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  bookId: string,
  delta: number,
): Promise<StockTransition | null> {
  const guard = delta < 0 ? -delta : 0;
  const rows = await tx.$queryRaw<StockTransition[]>`
    UPDATE "Book"
    SET "stockQuantity" = "stockQuantity" + ${delta},
        "updatedAt" = now()
    WHERE "id" = ${bookId}
      AND "stockQuantity" >= ${guard}
    RETURNING "stockQuantity" - ${delta} AS "stockBefore",
              "stockQuantity" AS "stockAfter"`;
  return rows[0] ?? null;
}

/**
 * Set a book's stock to an absolute value with a row lock held from the read
 * to the write, so the recorded before/after history is exact even when a
 * concurrent adjustment commits between the two statements.
 */
async function setStockAbsolute(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  bookId: string,
  newQuantity: number,
): Promise<StockTransition | null> {
  const rows = await tx.$queryRaw<StockTransition[]>`
    WITH locked AS (
      SELECT "stockQuantity" AS "stockBefore"
      FROM "Book"
      WHERE "id" = ${bookId}
      FOR UPDATE
    )
    UPDATE "Book" b
    SET "stockQuantity" = ${newQuantity},
        "updatedAt" = now()
    FROM locked
    WHERE b."id" = ${bookId}
    RETURNING locked."stockBefore" AS "stockBefore",
              b."stockQuantity" AS "stockAfter"`;
  return rows[0] ?? null;
}

// ── Stock adjustment ───────────────────────────────────────────────────────

export async function adjustStockAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  await requireAdmin();

  const parsed = adjustmentSchema.safeParse({
    bookId: fd(formData, "bookId"),
    type: fd(formData, "type"),
    quantity: fd(formData, "quantity"),
    note: fd(formData, "note"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { bookId, type, quantity, note } = parsed.data;

  // Signed delta: DAMAGE reduces stock; every other admin type adds.
  // (Absolute corrections use the dedicated "Set stock" action.)
  const delta = type === "DAMAGE" ? -quantity : quantity;

  try {
    await prisma.$transaction(async (tx) => {
      const transition = await applyStockDelta(tx, bookId, delta);

      if (!transition) {
        // No row matched: book missing, or a decrease below zero.
        const exists = await tx.book.findUnique({
          where: { id: bookId },
          select: { id: true },
        });
        throw new Error(exists ? "INSUFFICIENT_STOCK" : "BOOK_NOT_FOUND");
      }

      await tx.inventoryTransaction.create({
        data: {
          bookId,
          type,
          quantity,
          stockBefore: transition.stockBefore,
          stockAfter: transition.stockAfter,
          note: note ?? null,
        },
      });
    });

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${bookId}`);
    revalidatePath("/admin", "layout");

    redirect(`/admin/inventory/${bookId}?notice=adjusted`);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "BOOK_NOT_FOUND":
          return { error: "That book no longer exists." };
        case "INSUFFICIENT_STOCK":
          return {
            error: "Cannot reduce stock below zero. The current stock is too low for this adjustment.",
          };
        case "NEGATIVE_STOCK":
          return {
            error: "Stock cannot become negative.",
          };
      }
    }
    // Next.js redirects throw — let those through
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;

    console.error("[bookie] adjustStockAction failed:", error);
    return { error: "Could not adjust stock. Please try again." };
  }
}

// ── Set stock (direct override) ────────────────────────────────────────────

const setStockSchema = z.object({
  bookId: z.string().trim().min(1, "Book is required"),
  quantity: z
    .string()
    .trim()
    .min(1, "Quantity is required")
    .refine((v) => /^\d+$/.test(v), "Must be a whole number")
    .refine((v) => Number(v) >= 0, "Stock cannot be negative")
    .refine((v) => Number(v) <= 100000, "Quantity is unreasonably high")
    .transform((v) => Number(v)),
  note: z
    .string()
    .trim()
    .max(500, "Note is too long")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function setStockAction(
  _prev: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  await requireAdmin();

  const parsed = setStockSchema.safeParse({
    bookId: fd(formData, "bookId"),
    quantity: fd(formData, "quantity"),
    note: fd(formData, "note"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { bookId, quantity, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const transition = await setStockAbsolute(tx, bookId, quantity);

      if (!transition) {
        throw new Error("BOOK_NOT_FOUND");
      }

      // No history entry for a no-op set.
      if (transition.stockBefore !== transition.stockAfter) {
        await tx.inventoryTransaction.create({
          data: {
            bookId,
            type: "ADJUSTMENT",
            quantity: Math.abs(transition.stockAfter - transition.stockBefore),
            stockBefore: transition.stockBefore,
            stockAfter: transition.stockAfter,
            note: note ?? `Stock set to ${transition.stockAfter}`,
          },
        });
      }
    });

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${bookId}`);
    revalidatePath("/admin", "layout");

    redirect(`/admin/inventory/${bookId}?notice=updated`);
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_NOT_FOUND") {
      return { error: "That book no longer exists." };
    }
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;

    console.error("[bookie] setStockAction failed:", error);
    return { error: "Could not update stock. Please try again." };
  }
}
