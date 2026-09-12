"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

interface AdminConfirmSubmitProps {
  /** Idle button label. */
  children: string;
  /** Question shown in the confirmation step. */
  question: string;
  /** Confirm button label. */
  confirmLabel: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** Accessible name for the idle trigger when the label alone is ambiguous. */
  ariaLabel?: string;
}

function SubmittingButton({ confirmLabel }: { confirmLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" isLoading={pending} disabled={pending}>
      {confirmLabel}
    </Button>
  );
}

/**
 * Two-step destructive action button.
 *
 * Renders inside a `<form action={serverAction}>`: the first click reveals an
 * explicit confirmation, the second submits. Nothing destructive happens by
 * accident, and the pending state comes from the form itself.
 */
export function AdminConfirmSubmit({
  children,
  question,
  confirmLabel,
  variant = "outline",
  size = "sm",
  ariaLabel,
}: AdminConfirmSubmitProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        onClick={() => setConfirming(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <span
      role="group"
      aria-label={question}
      className="inline-flex flex-wrap items-center gap-2 rounded-control border border-error/30 bg-error-muted/40 px-2 py-1.5"
    >
      <span className="text-caption text-text">{question}</span>
      <SubmittingButton confirmLabel={confirmLabel} />
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </span>
  );
}
