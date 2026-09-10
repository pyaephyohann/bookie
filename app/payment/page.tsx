import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PaymentClient } from "./PaymentClient";

export const metadata: Metadata = {
  title: "Payment — Bookie",
  description: "Submit payment for your Bookie order.",
};

interface PaymentPageProps {
  searchParams: Promise<{ bookPass?: string }>;
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const { bookPass } = await searchParams;

  if (!bookPass) {
    redirect("/");
  }

  // Fetch order with items and payment state
  const order = await prisma.order.findUnique({
    where: { bookPass },
    select: {
      id: true,
      bookPass: true,
      customerName: true,
      email: true,
      status: true,
      total: true,
      items: {
        select: {
          bookTitle: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
        },
      },
      payments: {
        where: { status: { not: "REJECTED" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const hasPendingPayment = order.payments.some((p) => p.status === "PENDING");

  return (
    <PaymentClient
      order={{
        bookPass: order.bookPass,
        customerName: order.customerName,
        email: order.email,
        items: order.items.map((item) => ({
          bookTitle: item.bookTitle,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        })),
        total: Number(order.total),
        status: order.status,
        hasPendingPayment,
      }}
    />
  );
}
