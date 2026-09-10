import { prisma } from "@/lib/prisma";

// ── Types ───────────────────────────────────────────────────────────────────

export interface KpiData {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalBooks: number;
  lowStockBooks: number;
}

export interface RevenuePoint {
  label: string;
  date: string;
  revenue: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface CategorySales {
  name: string;
  slug: string;
  orderCount: number;
  totalRevenue: number;
}

export interface PaymentStats {
  totalAmount: number;
  verified: number;
  pending: number;
  rejected: number;
  byMethod: { method: string; count: number; total: number }[];
}

export interface InventoryAlert {
  id: string;
  title: string;
  slug: string;
  stockQuantity: number;
  coverImage: string | null;
  status: string;
  orderCount: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val) || 0;
  if (typeof val === "object" && "toNumber" in val && typeof (val as { toNumber: () => number }).toNumber === "function") {
    return (val as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

// ── KPI ─────────────────────────────────────────────────────────────────────

export async function getKpiData(): Promise<KpiData> {
  const thirtyDaysAgo = daysAgo(30);

  const [ordersAgg, pendingCount, completedCount, booksCount, lowStockCount, revenueAgg] =
    await Promise.all([
      prisma.order.aggregate({ _count: true }),
      prisma.order.aggregate({
        _count: true,
        where: { status: { in: ["PLACED", "CONFIRMED", "PREPARING"] } },
      }),
      prisma.order.aggregate({
        _count: true,
        where: { status: { in: ["DELIVERED", "SHIPPED"] } },
      }),
      prisma.book.aggregate({ _count: true }),
      prisma.book.aggregate({
        _count: true,
        where: { stockQuantity: { lte: 5 }, status: "PUBLISHED" },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "VERIFIED", createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

  return {
    totalRevenue: toNumber(revenueAgg._sum.amount),
    totalOrders: ordersAgg._count,
    pendingOrders: pendingCount._count,
    completedOrders: completedCount._count,
    totalBooks: booksCount._count,
    lowStockBooks: lowStockCount._count,
  };
}

// ── Revenue chart ───────────────────────────────────────────────────────────

export async function getRevenueData(days: number = 30): Promise<RevenuePoint[]> {
  const since = daysAgo(days);

  const payments = await prisma.payment.findMany({
    where: { status: "VERIFIED", createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = daysAgo(days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const p of payments) {
    const key = p.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + toNumber(p.amount));
  }

  return Array.from(buckets.entries()).map(([date, revenue]) => ({
    label: new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

// ── Orders by status ────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
  PLACED: "var(--color-info)",
  CONFIRMED: "var(--color-success)",
  REJECTED: "var(--color-error)",
  PREPARING: "var(--color-pending)",
  SHIPPED: "var(--color-info)",
  DELIVERED: "var(--color-success)",
  CANCELLED: "var(--color-neutral)",
};

export async function getOrdersByStatus(): Promise<(OrderStatusCount & { color: string })[]> {
  const statuses = ["PLACED", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "REJECTED", "CANCELLED"] as const;

  const results = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.order.aggregate({ _count: true, where: { status } }).then((r) => r._count),
      color: ORDER_STATUS_COLORS[status] ?? "var(--color-neutral)",
    })),
  );

  return results;
}

// ── Orders over time ────────────────────────────────────────────────────────

export interface OrderTimePoint {
  label: string;
  date: string;
  placed: number;
  confirmed: number;
  delivered: number;
}

export async function getOrdersOverTime(days: number = 30): Promise<OrderTimePoint[]> {
  const since = daysAgo(days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, createdAt: true },
  });

  const buckets = new Map<string, { placed: number; confirmed: number; delivered: number }>();
  for (let i = 0; i < days; i++) {
    const d = daysAgo(days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { placed: 0, confirmed: 0, delivered: 0 });
  }

  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (o.status === "PLACED") bucket.placed++;
    else if (o.status === "CONFIRMED" || o.status === "PREPARING") bucket.confirmed++;
    else if (o.status === "DELIVERED" || o.status === "SHIPPED") bucket.delivered++;
  }

  return Array.from(buckets.entries()).map(([date, data]) => ({
    label: new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    date,
    ...data,
  }));
}

// ── Category sales ──────────────────────────────────────────────────────────

export async function getCategorySales(): Promise<CategorySales[]> {
  // Get all categories with their books' order items
  const categories = await prisma.category.findMany({
    include: {
      books: {
        include: {
          book: {
            include: {
              orderItems: {
                select: { subtotal: true, quantity: true, orderId: true },
              },
            },
          },
        },
      },
    },
  });

  const result: CategorySales[] = [];

  for (const cat of categories) {
    let totalRevenue = 0;
    const orderIds = new Set<string>();

    for (const cb of cat.books) {
      for (const item of cb.book.orderItems) {
        totalRevenue += toNumber(item.subtotal);
        orderIds.add(item.orderId);
      }
    }

    if (orderIds.size > 0 || cat.books.length > 0) {
      result.push({
        name: cat.name,
        slug: cat.slug,
        orderCount: orderIds.size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      });
    }
  }

  // Sort by revenue descending, take top 8
  return result.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 8);
}

// ── Payment stats ───────────────────────────────────────────────────────────

export async function getPaymentStats(): Promise<PaymentStats> {
  const [verified, pending, rejected, byMethodRaw] = await Promise.all([
    prisma.payment.aggregate({
      _count: true,
      _sum: { amount: true },
      where: { status: "VERIFIED" },
    }),
    prisma.payment.aggregate({
      _count: true,
      _sum: { amount: true },
      where: { status: "PENDING" },
    }),
    prisma.payment.aggregate({
      _count: true,
      _sum: { amount: true },
      where: { status: "REJECTED" },
    }),
    prisma.payment.groupBy({
      by: ["method", "status"],
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const methodMap = new Map<string, { count: number; total: number }>();
  for (const row of byMethodRaw) {
    const key = row.method;
    const existing = methodMap.get(key) ?? { count: 0, total: 0 };
    existing.count += row._count;
    existing.total += toNumber(row._sum.amount);
    methodMap.set(key, existing);
  }

  return {
    totalAmount: toNumber(verified._sum.amount) + toNumber(pending._sum.amount),
    verified: verified._count,
    pending: pending._count,
    rejected: rejected._count,
    byMethod: Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: Math.round(data.total * 100) / 100,
    })),
  };
}

// ── Inventory alerts ────────────────────────────────────────────────────────

// ── Recent orders ─────────────────────────────────────────────────────────

export interface RecentOrder {
  id: string;
  bookPass: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      bookPass: true,
      customerName: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });

  return orders.map((o) => ({
    ...o,
    total: toNumber(o.total),
    createdAt: o.createdAt.toISOString(),
  }));
}

// ── Inventory alerts ────────────────────────────────────────────────────────

export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  const books = await prisma.book.findMany({
    where: {
      status: "PUBLISHED",
      stockQuantity: { lte: 10 },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      stockQuantity: true,
      coverImage: true,
      status: true,
      orderItems: { select: { orderId: true } },
    },
    orderBy: { stockQuantity: "asc" },
    take: 10,
  });

  return books.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    stockQuantity: b.stockQuantity,
    coverImage: b.coverImage,
    status: b.status,
    orderCount: b.orderItems.length,
  }));
}
