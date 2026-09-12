import type { ComponentProps } from "react";
import {
  BookStatus,
  OrderStatus,
  PaymentStatus,
  type BookStatus as BookStatusValue,
  type OrderStatus as OrderStatusValue,
  type PaymentStatus as PaymentStatusValue,
} from "@/generated/prisma/client";

/**
 * Bookie status badge foundation.
 * Visuals come from the `.status-*` semantic classes in app/globals.css —
 * status colors must never be hard-coded in components.
 */

export type StatusSemantic =
  | "success"
  | "pending"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const semanticClass: Record<StatusSemantic, string> = {
  success: "status-success",
  pending: "status-pending",
  warning: "status-warning",
  error: "status-error",
  info: "status-info",
  neutral: "status-neutral",
};

export interface BadgeProps extends ComponentProps<"span"> {
  semantic?: StatusSemantic;
}

export function Badge({ semantic = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span className={`status ${semanticClass[semantic]}${className ? ` ${className}` : ""}`} {...props} />
  );
}

/* Bookie domain mappings — the Prisma enums are the single source of truth. */

const orderStatusSemantic: Record<OrderStatusValue, StatusSemantic> = {
  PLACED: "info",
  CONFIRMED: "success",
  REJECTED: "error",
  PREPARING: "pending",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "neutral",
};

const paymentStatusSemantic: Record<PaymentStatusValue, StatusSemantic> = {
  PENDING: "pending",
  VERIFIED: "success",
  REJECTED: "error",
};

type StatusBadgeProps = Omit<BadgeProps, "semantic">;

export function OrderStatusBadge({ status, ...props }: StatusBadgeProps & { status: OrderStatusValue }) {
  return (
    <Badge semantic={orderStatusSemantic[status]} {...props}>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, ...props }: StatusBadgeProps & { status: PaymentStatusValue }) {
  return (
    <Badge semantic={paymentStatusSemantic[status]} {...props}>
      {status}
    </Badge>
  );
}

const bookStatusSemantic: Record<BookStatusValue, StatusSemantic> = {
  DRAFT: "pending",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

const bookStatusLabel: Record<BookStatusValue, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

/** Book publication status. Server components only (imports the Prisma enums). */
export function BookStatusBadge({ status, ...props }: StatusBadgeProps & { status: BookStatusValue }) {
  return (
    <Badge semantic={bookStatusSemantic[status]} {...props}>
      {bookStatusLabel[status]}
    </Badge>
  );
}

// Re-exported so consumers (and exhaustiveness checks) can use the enum values.
export { BookStatus, OrderStatus, PaymentStatus };
