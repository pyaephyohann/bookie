import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderCompleteClient } from "./OrderCompleteClient";

export const metadata: Metadata = {
  title: "Order Complete — Bookie",
  description: "Your order has been submitted. Track your order with your BookPass.",
};

interface OrderCompletePageProps {
  searchParams: Promise<{ bookPass?: string }>;
}

export default async function OrderCompletePage({ searchParams }: OrderCompletePageProps) {
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
      phone: true,
      email: true,
      shippingAddress: true,
      note: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
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
    },
  });

  if (!order) {
    notFound();
  }

  const payment = order.payments[0] ?? null;

  return (
    <OrderCompleteClient
      order={{
        bookPass: order.bookPass,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        shippingAddress: order.shippingAddress,
        note: order.note,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          bookTitle: item.bookTitle,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        })),
      }}
      payment={payment ? {
        method: payment.method,
        amount: Number(payment.amount),
        status: payment.status,
        submittedAt: payment.createdAt.toISOString(),
      } : null}
    />
  );
}
