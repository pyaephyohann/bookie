"use server";

import { prisma } from "@/lib/prisma";
import { checkoutSchema, type CheckoutFormData } from "@/lib/checkout";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CartItemInput {
  bookId: string;
  quantity: number;
}

export interface CreateOrderResult {
  success: true;
  bookPass: string;
  orderId: string;
}

export interface CreateOrderError {
  success: false;
  error: string;
  fieldErrors?: Record<string, string>;
}

// ── BookPass generation ────────────────────────────────────────────────────

function generateBookPass(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `ORD-${year}-${random}${timestamp}`;
}

// ── Server Action ──────────────────────────────────────────────────────────

/**
 * Create a guest order from the cart.
 *
 * SECURITY: prices are fetched server-side from the database.
 * The client only sends bookId + quantity.
 */
export async function createOrder(
  formData: CheckoutFormData,
  cartItems: CartItemInput[],
): Promise<CreateOrderResult | CreateOrderError> {
  // 1. Validate customer input
  const parsed = checkoutSchema.safeParse(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      error: "Please check your information.",
      fieldErrors,
    };
  }

  // 2. Validate cart items
  if (!cartItems || cartItems.length === 0) {
    return {
      success: false,
      error: "Your cart is empty. Please add items before checkout.",
    };
  }

  // Deduplicate and validate quantities
  const uniqueItems = new Map<string, number>();
  for (const item of cartItems) {
    if (!item.bookId || typeof item.quantity !== "number" || item.quantity < 1) {
      return {
        success: false,
        error: "Invalid cart item.",
      };
    }
    if (item.quantity > 99) {
      return {
        success: false,
        error: "Maximum quantity per book is 99.",
      };
    }
    uniqueItems.set(item.bookId, (uniqueItems.get(item.bookId) ?? 0) + item.quantity);
  }

  // 3. Fetch books from database
  const bookIds = [...uniqueItems.keys()];
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds }, status: "PUBLISHED" },
  });

  if (books.length === 0) {
    return {
      success: false,
      error: "No valid books found in your cart.",
    };
  }

  // Check all requested books exist and are orderable
  const bookMap = new Map(books.map((b) => [b.id, b]));
  for (const bookId of bookIds) {
    if (!bookMap.has(bookId)) {
      return {
        success: false,
        error: `One or more books in your cart are no longer available.`,
      };
    }
  }

  // 4. Validate inventory (if stock tracking is meaningful)
  for (const bookId of bookIds) {
    const book = bookMap.get(bookId)!;
    const requestedQty = uniqueItems.get(bookId)!;
    if (book.stockQuantity < requestedQty) {
      return {
        success: false,
        error: `"${book.title}" only has ${book.stockQuantity} copies available. You requested ${requestedQty}.`,
      };
    }
  }

  // 5. Calculate totals server-side using authoritative prices
  let subtotal = 0;
  const orderItemsData: Array<{
    bookId: string;
    bookTitle: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }> = [];

  for (const [bookId, quantity] of uniqueItems) {
    const book = bookMap.get(bookId)!;
    const unitPrice = Number(book.price);
    const lineSubtotal = unitPrice * quantity;
    subtotal += lineSubtotal;
    orderItemsData.push({
      bookId,
      bookTitle: book.title,
      unitPrice,
      quantity,
      subtotal: lineSubtotal,
    });
  }

  const total = subtotal; // No tax/shipping/discount in B5

  // 6. Create order in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generate unique bookPass
      let bookPass = generateBookPass();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await tx.order.findUnique({ where: { bookPass } });
        if (!existing) break;
        bookPass = generateBookPass();
        attempts++;
      }
      if (attempts >= 10) {
        throw new Error("Could not generate a unique order reference. Please try again.");
      }

      // Create order
      const order = await tx.order.create({
        data: {
          bookPass,
          customerName: parsed.data.customerName,
          phone: parsed.data.phone,
          alternatePhone: parsed.data.alternatePhone || null,
          email: parsed.data.email,
          shippingAddress: parsed.data.shippingAddress,
          note: parsed.data.note || null,
          status: "PLACED",
          subtotal,
          discount: 0,
          shippingFee: 0,
          total,
          items: {
            create: orderItemsData.map((item) => ({
              bookId: item.bookId,
              bookTitle: item.bookTitle,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
      });

      // Create initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "PLACED",
          note: "Order placed by customer",
        },
      });

      // Update inventory
      for (const item of orderItemsData) {
        const book = bookMap.get(item.bookId)!;
        const newStock = book.stockQuantity - item.quantity;
        await tx.book.update({
          where: { id: item.bookId },
          data: { stockQuantity: newStock },
        });
        await tx.inventoryTransaction.create({
          data: {
            bookId: item.bookId,
            type: "SALE",
            quantity: -item.quantity,
            stockBefore: book.stockQuantity,
            stockAfter: newStock,
            note: `Order ${bookPass}`,
          },
        });
      }

      return { bookPass, orderId: order.id };
    });

    return {
      success: true,
      bookPass: result.bookPass,
      orderId: result.orderId,
    };
  } catch (error) {
    console.error("[bookie] Order creation failed:", error);
    return {
      success: false,
      error: "Failed to create your order. Please try again.",
    };
  }
}
