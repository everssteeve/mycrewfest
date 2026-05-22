import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ChipColor = "neon" | "cyan" | "pink" | "orange";
type ChipState = "inactive" | "soft" | "active";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ChipColor;
  state?: ChipState;
  asDiv?: boolean;
}

const colorTokens: Record<
  ChipColor,
  { border: string; soft: string; active: string; activeText: string }
> = {
  neon: {
    border: "border-[var(--primary-neon)] text-[var(--primary-neon)]",
    soft: "bg-[var(--neon-soft)] border-[var(--primary-neon)] text-[var(--primary-neon)]",
    active: "bg-[var(--primary-neon)] border-[var(--primary-neon)] text-[var(--text-on-neon)]",
    activeText: "var(--text-on-neon)",
  },
  cyan: {
    border: "border-[var(--secondary-cyan)] text-[var(--secondary-cyan)]",
    soft: "bg-[var(--cyan-soft)] border-[var(--secondary-cyan)] text-[var(--secondary-cyan)]",
    active: "bg-[var(--secondary-cyan)] border-[var(--secondary-cyan)] text-[var(--bg-darker)]",
    activeText: "var(--bg-darker)",
  },
  pink: {
    border: "border-[var(--accent-pink)] text-[var(--accent-pink)]",
    soft: "bg-[var(--pink-soft)] border-[var(--accent-pink)] text-[var(--accent-pink)]",
    active: "bg-[var(--accent-pink)] border-[var(--accent-pink)] text-white",
    activeText: "white",
  },
  orange: {
    border: "border-[var(--warning-orange)] text-[var(--warning-orange)]",
    soft: "bg-[var(--orange-soft)] border-[var(--warning-orange)] text-[var(--warning-orange)]",
    active: "bg-[var(--warning-orange)] border-[var(--warning-orange)] text-[var(--bg-darker)]",
    activeText: "var(--bg-darker)",
  },
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    { color = "neon", state = "inactive", className, children, ...props },
    ref,
  ) => {
    const tokens = colorTokens[color];
    const stateClass =
      state === "active"
        ? tokens.active
        : state === "soft"
          ? tokens.soft
          : `bg-transparent border ${tokens.border}`;

    return (
      <button
        ref={ref}
        type="button"
        className={clsx(
          "inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition",
          stateClass,
          "cursor-pointer select-none",
          className,
        )}
        style={{ transition: "var(--transition-fast)" }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Chip.displayName = "Chip";
