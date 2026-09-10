import type { ComponentProps, ReactNode } from "react";

interface AdminCardProps extends Omit<ComponentProps<"div">, "title"> {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function AdminCard({
  title,
  description,
  headerAction,
  children,
  className = "",
  ...props
}: AdminCardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-xs ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            {title && <h3 className="text-h4 text-text">{title}</h3>}
            {description && (
              <p className="text-caption mt-0.5 text-text-muted">{description}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
