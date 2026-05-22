import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

type BadgeVariant = "ai" | "urgent" | "critical" | "info" | "success" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  ai: {
    bg: "var(--cyan-soft)",
    text: "var(--secondary-cyan)",
    border: "var(--secondary-cyan)",
  },
  urgent: {
    bg: "var(--orange-soft)",
    text: "var(--warning-orange)",
    border: "var(--warning-orange)",
  },
  critical: {
    bg: "rgba(255,51,85,0.14)",
    text: "var(--danger-red)",
    border: "var(--danger-red)",
  },
  info: {
    bg: "var(--cyan-soft)",
    text: "var(--secondary-cyan)",
  },
  success: {
    bg: "var(--neon-soft)",
    text: "var(--primary-neon)",
  },
  default: {
    bg: "rgba(255,255,255,0.08)",
    text: "var(--text-muted)",
  },
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        border: styles.border ? `1px solid ${styles.border}` : "none",
      }}
      {...props}
    >
      {variant === "ai" && (
        <span aria-hidden="true" style={{ fontSize: 8 }}>
          ✦
        </span>
      )}
      {children}
    </span>
  );
}
