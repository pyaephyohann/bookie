import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout — Bookie",
  description: "Complete your order on Bookie.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
