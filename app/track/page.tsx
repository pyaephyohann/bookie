import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  TrackOrderClient,
  type TrackOrderData,
} from "./TrackOrderClient";

export const metadata: Metadata = {
  title: "Track Your Order — Bookie",
  description:
    "Enter your BookPass to track the current status of your Bookie order.",
};

interface TrackPageProps {
  searchParams: Promise<{ pass?: string }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const { pass } = await searchParams;
  const bookPass = pass?.trim().toUpperCase() ?? "";

  let orderData: TrackOrderData | null = null;
  let notFound = false;

  if (bookPass) {
    try {
      const order = await prisma.order.findUnique({
        where: { bookPass },
        select: {
          bookPass: true,
          status: true,
          subtotal: true,
          shippingFee: true,
          total: true,
          createdAt: true,
          items: {
            orderBy: { createdAt: "asc" },
            select: {
              bookTitle: true,
              unitPrice: true,
              quantity: true,
              subtotal: true,
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              method: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: "asc" },
            select: {
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (order) {
        orderData = {
          bookPass: order.bookPass,
          status: order.status,
          subtotal: Number(order.subtotal),
          shippingFee: Number(order.shippingFee),
          total: Number(order.total),
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            bookTitle: item.bookTitle,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
          })),
          payment: order.payments[0]
            ? {
                method: order.payments[0].method,
                amount: Number(order.payments[0].amount),
                status: order.payments[0].status,
                submittedAt: order.payments[0].createdAt.toISOString(),
              }
            : null,
          statusHistory: order.statusHistory.map((entry) => ({
            status: entry.status,
            at: entry.createdAt.toISOString(),
          })),
        };
      } else {
        notFound = true;
      }
    } catch {
      // Never leak database errors — show the friendly not-found state.
      notFound = true;
    }
  }

  // key=bookPass remounts the client component after every lookup navigation,
  // so transient state (e.g. the "Searching…" flag) never persists across
  // BookPass lookups.
  return (
    <TrackOrderClient
      key={bookPass}
      initialPass={bookPass}
      order={orderData}
      notFound={notFound}
    />
  );
}