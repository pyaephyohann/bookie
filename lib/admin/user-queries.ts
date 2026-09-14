import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Server-only query functions for admin user management (A8.2).
 */

const PAGE_SIZE = 20;

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  createdAt: Date;
  verifiedPaymentCount: number;
  orderStatusLogCount: number;
}

export interface UserListResult {
  items: UserListItem[];
  page: number;
  pageCount: number;
  total: number;
}

/**
 * List admin/staff users with search, role filter, and pagination.
 */
export async function listUsers({
  q,
  role,
  page = 1,
}: {
  q?: string;
  role?: string;
  page?: number;
}): Promise<UserListResult> {
  const where: Prisma.UserWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role === "ADMIN" || role === "STAFF") {
    where.role = role;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            verifiedPayments: true,
            orderStatusLogs: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      verifiedPaymentCount: u._count.verifiedPayments,
      orderStatusLogCount: u._count.orderStatusLogs,
    })),
    page,
    pageCount,
    total,
  };
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get a single user for editing.
 */
export async function getUserForEdit(id: string): Promise<UserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Count users with a given role and active status.
 */
export async function countUsersByRoleAndStatus(
  role: "ADMIN" | "STAFF",
  isActive: boolean,
): Promise<number> {
  return prisma.user.count({
    where: { role, isActive },
  });
}

/**
 * Check if there is at least one active admin user.
 */
export async function hasActiveAdmin(): Promise<boolean> {
  const count = await prisma.user.count({
    where: { role: "ADMIN", isActive: true },
  });
  return count > 0;
}
