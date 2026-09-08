import { Badge, OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/client";

// Temporary internal smoke-test page for the design system.
// TODO(bookie): remove when the first real pages are built.
const ORDER_STATUSES: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "REJECTED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "VERIFIED", "REJECTED"];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-12">
      <header className="space-y-2">
        <p className="text-fun text-2xl text-ink-soft">Bookie</p>
        <h1 className="text-display">Design system</h1>
        <p className="text-body text-text-secondary">
          Smoke test for tokens, fonts and UI primitives.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h2">Typography</h2>
        <p className="text-display">Display — Scoutie Sans 800</p>
        <p className="text-h1">Heading 1 — 700</p>
        <p className="text-h2">Heading 2 — 700</p>
        <p className="text-h3">Heading 3 — 600</p>
        <p className="text-h4">Heading 4 — 600</p>
        <p className="text-body-lg">Body large — regular 400</p>
        <p className="text-body">Body — regular 400</p>
        <p className="text-body-sm">Body small — regular 400</p>
        <p className="text-caption">Caption — extra small</p>
        <p className="text-label">Label — semibold</p>
        <p className="text-fun text-3xl text-ink-soft">
          Decorative fun text — Caveat
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-h2">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h2">Forms</h2>
        <div className="grid gap-4">
          <Input placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input type="tel" placeholder="Phone input" />
          <Input type="search" placeholder="Search books…" />
          <Textarea placeholder="Textarea" />
          <Select defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            <option>KPay</option>
            <option>AYA Pay</option>
          </Select>
          <Input aria-invalid placeholder="Error state" />
          <Input disabled placeholder="Disabled" />
          <Input type="file" />
          <label className="flex items-center gap-2 text-body-sm">
            <input type="checkbox" /> Checkbox
          </label>
          <label className="flex items-center gap-2 text-body-sm">
            <input type="radio" name="ds-radio" /> Radio
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h2">Semantic badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge semantic="success">Success</Badge>
          <Badge semantic="pending">Pending</Badge>
          <Badge semantic="warning">Warning</Badge>
          <Badge semantic="error">Error</Badge>
          <Badge semantic="info">Info</Badge>
          <Badge semantic="neutral">Neutral</Badge>
        </div>
        <h3 className="text-h3">Order statuses</h3>
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUSES.map((status) => (
            <OrderStatusBadge key={status} status={status} />
          ))}
        </div>
        <h3 className="text-h3">Payment statuses</h3>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((status) => (
            <PaymentStatusBadge key={status} status={status} />
          ))}
        </div>
      </section>
    </main>
  );
}
