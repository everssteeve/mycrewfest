import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

type AccentColor = "neon" | "cyan" | "pink" | "orange" | "red";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  clash?: boolean;
  accent?: AccentColor;
  padding?: "none" | "sm" | "md" | "lg";
}

const accentBorders: Record<AccentColor, string> = {
  neon: "border-[var(--primary-neon)]",
  cyan: "border-[var(--secondary-cyan)]",
  pink: "border-[var(--accent-pink)]",
  orange: "border-[var(--warning-orange)]",
  red: "border-[var(--danger-red)]",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ clash = false, accent, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "relative rounded-[var(--radius-md)] border bg-[var(--bg-surface)]",
          clash
            ? "border-[var(--warning-orange)]"
            : accent
              ? accentBorders[accent]
              : "border-[var(--border-color)]",
          paddingClasses[padding],
          className,
        )}
        style={{ boxShadow: "var(--shadow-sm)" }}
        {...props}
      >
        {clash && (
          <span
            className="t-meta absolute -top-2.5 left-3 rounded-[var(--radius-sm)] px-2 py-0.5"
            style={{
              backgroundColor: "var(--warning-orange)",
              color: "var(--bg-darker)",
              fontSize: "10px",
            }}
          >
            CLASH
          </span>
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
