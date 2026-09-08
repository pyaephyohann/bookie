import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";

/**
 * Bookie form foundation — shared tokens: radius, border, focus ring,
 * error state (via aria-invalid), disabled and placeholder styling.
 */

const fieldBase = [
  "w-full rounded-control border bg-surface text-body text-text",
  "placeholder:text-text-disabled",
  "transition-colors",
  "hover:border-border-strong",
  "focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  "aria-[invalid=true]:border-error aria-[invalid=true]:focus-visible:outline-error",
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-text-disabled",
].join(" ");

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={`${fieldBase} h-10 px-3 ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={`${fieldBase} px-3 py-2.5 ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`${fieldBase} h-10 px-3 ${className}`}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
