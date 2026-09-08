import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * Bookie button foundation.
 * Tokens (colors, radius, typography) come from app/globals.css —
 * do not hard-code raw values here.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "rounded-control text-button border",
    "transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-brand text-ink shadow-xs hover:bg-brand-hover active:bg-brand-active",
        secondary:
          "border-transparent bg-ink text-text-inverse hover:bg-neutral-800 active:bg-neutral-900",
        outline:
          "border-border-strong bg-surface text-text hover:bg-surface-muted active:bg-border-subtle",
        ghost:
          "border-transparent bg-transparent text-text hover:bg-surface-muted active:bg-border-subtle",
        danger:
          "border-transparent bg-error text-white hover:bg-error-strong active:brightness-90",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
        icon: "size-10",
      },
      block: {
        true: "w-full",
        false: "",
      },
      loading: {
        true: "cursor-progress",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
      loading: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner, sets aria-busy and disables the button. */
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      isLoading = false,
      type = "button",
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonVariants({ variant, size, block, loading: isLoading, className })}
      {...props}
    >
      {isLoading && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-4 shrink-0 animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="3"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
