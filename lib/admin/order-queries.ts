import { prisma } from "@/lib/prisma";
import type { Prisma, OrderStatus, PaymentStatus } from "@/generated/prisma/client";
import { CATALOG_PAGE_SIZE } from "@/lib/admin/catalog";

/**
 * Admin order queries (A5). SERVER-ONLY — never import in a client component.
 *
 * Orders are fetched with their items, payments, and status history.
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

// ── Order overview ──────────────────────────────────────────────────────────

export interface OrderOverview {
  totalOrders: number;
  placed: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  rejectedCancelled: number;
}

export async function getOrderOverview(): Promise<OrderOverview> {
  const [total, placed, confirmed, shipped, delivered, rejectedCancelled] =
    await Promise.all([
      prisma.order.aggregate({ _count: true }),
      prisma.order.aggregate({
        _count: true,
        where: { status: "PLACED" },
      }),
      prisma.order.aggregate({
        _count: true,
        where: { status: "CONFIRMED" },
      }),
      prisma.order.aggregate({
        _count: true,
        where: { status: "SHIPPED" },
      }),
      prisma.order.aggregate({
        _count: true,
        where: { status: "DELIVERED" },
      }),
      prisma.order.aggregate({
        _count: true,
        where: { status: { in: ["REJECTED", "CANCELLED"] } },
      }),
    ]);

  return {
    totalOrders: total._count,
    placed: placed._count,
    confirmed: confirmed._count,
    shipped: shipped._count,
    delivered: delivered._count,
    rejectedCancelled: rejectedCancelled._count,
  };
}

// ── Order status options ────────────────────────────────────────────────────

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payment statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NONE", label: "No payment" },
] as const;

export const ORDER_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total high → low" },
  { value: "total-asc", label: "Total low → high" },
] as const;

// ── Order list ──────────────────────────────────────────────────────────────

export interface OrderListFilters {
  q?: string;
  status?: string;
  paymentStatus?: string;
  sort?: string;
  page?: number;
}

export interface OrderListRow {
  id: string;
  bookPass: string;
  customerName: string;
  phone: string;
  email: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  paymentStatus: PaymentStatus | null;
  paymentMethod: string | null;
  createdAt: string;
}

function orderOrderBy(sort: string | undefined): Prisma.OrderOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "total-desc":
      return { total: "desc" };
    case "total-asc":
      return { total: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

function orderWhere(filters: OrderListFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.q) {
    const q = filters.q;
    where.OR = [
      { bookPass: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.status && filters.status !== "") {
    where.status = filters.status as OrderStatus;
  }

  if (filters.paymentStatus && filters.paymentStatus !== "") {
    if (filters.paymentStatus === "NONE") {
      // Orders with no payment record
      where.payments = { none: {} };
    } else {
      where.payments = {
        some: { status: filters.paymentStatus as PaymentStatus },
      };
    }
  }

  return where;
}

const orderListSelect = {
  id: true,
  bookPass: true,
  customerName: true,
  phone: true,
  email: true,
  status: true,
  total: true,
  createdAt: true,
  items: { select: { id: true } },
  payments: {
    select: { status: true, method: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} satisfies Prisma.OrderSelect;

type DbOrderListRow = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;

function toOrderListRow(order: DbOrderListRow): OrderListRow {
  const latestPayment = order.payments[0] ?? null;
  return {
    id: order.id,
    bookPass: order.bookPass,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    status: order.status,
    total: Number(order.total),
    itemCount: order.items.length,
    paymentStatus: latestPayment?.status ?? null,
    paymentMethod: latestPayment?.method ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function listOrders(
  filters: OrderListFilters,
): Promise<Paginated<OrderListRow>> {
  const page = clampPage(filters.page);
  const where = orderWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderListSelect,
      orderBy: orderOrderBy(filters.sort),
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return paginate(rows.map(toOrderListRow), total, page);
}

// ── Order detail ────────────────────────────────────────────────────────────

export interface OrderDetailItem {
  id: string;
  bookTitle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDetailPayment {
  id: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  slipUrl: string | null;
  transactionReference: string | null;
  createdAt: string;
}

export interface OrderDetailHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  changedByName: string | null;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  bookPass: string;
  customerName: string;
  phone: string;
  alternatePhone: string | null;
  email: string;
  shippingAddress: string;
  note: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderDetailItem[];
  payments: OrderDetailPayment[];
  statusHistory: OrderDetailHistoryEntry[];
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      bookPass: true,
      customerName: true,
      phone: true,
      alternatePhone: true,
      email: true,
      shippingAddress: true,
      note: true,
      status: true,
      subtotal: true,
      discount: true,
      shippingFee: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          bookTitle: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        select: {
          id: true,
          method: true,
          amount: true,
          status: true,
          slipUrl: true,
          transactionReference: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        select: {
          id: true,
          status: true,
          note: true,
          changedBy: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    bookPass: order.bookPass,
    customerName: order.customerName,
    phone: order.phone,
    alternatePhone: order.alternatePhone,
    email: order.email,
    shippingAddress: order.shippingAddress,
    note: order.note,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingFee: Number(order.shippingFee),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      bookTitle: item.bookTitle,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      status: p.status,
      slipUrl: p.slipUrl,
      transactionReference: p.transactionReference,
      createdAt: p.createdAt.toISOString(),
    })),
    statusHistory: order.statusHistory.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      changedByName: h.changedBy?.name ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}
