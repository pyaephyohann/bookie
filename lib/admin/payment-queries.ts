import { prisma } from "@/lib/prisma";
import type { Prisma, PaymentStatus, PaymentMethod } from "@/generated/prisma/client";
import { CATALOG_PAGE_SIZE } from "@/lib/admin/catalog";

/**
 * Admin payment queries (A6). SERVER-ONLY — never import in a client component.
 *
 * Payments are fetched with their order and verification information.
 * All list queries are paginated + filtered in the database.
 */

// ── Shared ──────────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}

function paginate<T>(items: T[], total: number, page: number): Paginated<T> {
  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)),
  };
}

function clampPage(page: number | undefined): number {
  const n = Number(page);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

// ── Payment overview ────────────────────────────────────────────────────────

export interface PaymentOverview {
  totalPayments: number;
  pending: number;
  verified: number;
  rejected: number;
}

export async function getPaymentOverview(): Promise<PaymentOverview> {
  const [total, pending, verified, rejected] = await Promise.all([
    prisma.payment.aggregate({ _count: true }),
    prisma.payment.aggregate({
      _count: true,
      where: { status: "PENDING" },
    }),
    prisma.payment.aggregate({
      _count: true,
      where: { status: "VERIFIED" },
    }),
    prisma.payment.aggregate({
      _count: true,
      where: { status: "REJECTED" },
    }),
  ]);

  return {
    totalPayments: total._count,
    pending: pending._count,
    verified: verified._count,
    rejected: rejected._count,
  };
}

// ── Payment filter options ──────────────────────────────────────────────────

export const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "KPAY", label: "KPay" },
  { value: "AYAPAY", label: "AYA Pay" },
] as const;

export const PAYMENT_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Amount high → low" },
  { value: "amount-asc", label: "Amount low → high" },
] as const;

// ── Payment list ────────────────────────────────────────────────────────────

export interface PaymentListFilters {
  q?: string;
  status?: string;
  method?: string;
  sort?: string;
  page?: number;
}

export interface PaymentListRow {
  id: string;
  orderId: string;
  bookPass: string;
  customerName: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionReference: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

function paymentOrderBy(sort: string | undefined): Prisma.PaymentOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "amount-desc":
      return { amount: "desc" };
    case "amount-asc":
      return { amount: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

function paymentWhere(filters: PaymentListFilters): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};

  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { order: { bookPass: { contains: q, mode: "insensitive" } } },
      { order: { customerName: { contains: q, mode: "insensitive" } } },
      { transactionReference: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.status && filters.status !== "") {
    where.status = filters.status as PaymentStatus;
  }

  if (filters.method && filters.method !== "") {
    where.method = filters.method as PaymentMethod;
  }

  return where;
}

const paymentListSelect = {
  id: true,
  orderId: true,
  method: true,
  amount: true,
  status: true,
  transactionReference: true,
  verifiedAt: true,
  createdAt: true,
  order: {
    select: {
      bookPass: true,
      customerName: true,
    },
  },
  verifiedBy: {
    select: { name: true },
  },
} satisfies Prisma.PaymentSelect;

type DbPaymentListRow = Prisma.PaymentGetPayload<{ select: typeof paymentListSelect }>;

function toPaymentListRow(payment: DbPaymentListRow): PaymentListRow {
  return {
    id: payment.id,
    orderId: payment.orderId,
    bookPass: payment.order.bookPass,
    customerName: payment.order.customerName,
    method: payment.method,
    amount: Number(payment.amount),
    status: payment.status,
    transactionReference: payment.transactionReference,
    verifiedByName: payment.verifiedBy?.name ?? null,
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function listPayments(
  filters: PaymentListFilters,
): Promise<Paginated<PaymentListRow>> {
  const page = clampPage(filters.page);
  const where = paymentWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: paymentListSelect,
      orderBy: paymentOrderBy(filters.sort),
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.payment.count({ where }),
  ]);

  return paginate(rows.map(toPaymentListRow), total, page);
}

// ── Payment detail ──────────────────────────────────────────────────────────

export interface PaymentDetail {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  slipUrl: string | null;
  transactionReference: string | null;
  verifiedById: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    bookPass: string;
    status: string;
    total: number;
    customerName: string;
    phone: string;
    email: string;
  };
}

export async function getPaymentDetail(paymentId: string): Promise<PaymentDetail | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      orderId: true,
      method: true,
      amount: true,
      status: true,
      slipUrl: true,
      transactionReference: true,
      verifiedById: true,
      verifiedAt: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
      order: {
        select: {
          id: true,
          bookPass: true,
          status: true,
          total: true,
          customerName: true,
          phone: true,
          email: true,
        },
      },
      verifiedBy: {
        select: { name: true },
      },
    },
  });

  if (!payment) return null;

  return {
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    amount: Number(payment.amount),
    status: payment.status,
    slipUrl: payment.slipUrl,
    transactionReference: payment.transactionReference,
    verifiedById: payment.verifiedById,
    verifiedByName: payment.verifiedBy?.name ?? null,
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    rejectionReason: payment.rejectionReason,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    order: {
      id: payment.order.id,
      bookPass: payment.order.bookPass,
      status: payment.order.status,
      total: Number(payment.order.total),
      customerName: payment.order.customerName,
      phone: payment.order.phone,
      email: payment.order.email,
    },
  };
}
