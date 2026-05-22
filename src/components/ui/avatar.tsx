import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  color?: "neon" | "cyan" | "pink" | "orange";
  bordered?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const colorBgs: Record<string, string> = {
  neon: "var(--neon-soft)",
  cyan: "var(--cyan-soft)",
  pink: "var(--pink-soft)",
  orange: "var(--orange-soft)",
};

const colorTexts: Record<string, string> = {
  neon: "var(--primary-neon)",
  cyan: "var(--secondary-cyan)",
  pink: "var(--accent-pink)",
  orange: "var(--warning-orange)",
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  color = "neon",
  bordered = false,
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full",
        sizeClasses[size],
        className,
      )}
      style={{
        backgroundColor: colorBgs[color],
        border: bordered ? `2px solid var(--border-strong)` : "none",
        fontFamily: "var(--font-display)",
        fontWeight: "var(--fw-black)",
        color: colorTexts[color],
      }}
      {...props}
    >
      {src ? (
        // biome-ignore lint/a11y/useAltText: alt is passed via props or default
        <img
          src={src}
          alt={name ?? "avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{name ? getInitial(name) : "?"}</span>
      )}
    </div>
  );
}

interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

const stackColors: Array<"neon" | "cyan" | "pink" | "orange"> = [
  "neon",
  "cyan",
  "pink",
  "orange",
];

export function AvatarStack({ names, max = 4, size = "sm" }: AvatarStackProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <div className="flex items-center">
      {visible.map((name, i) => (
        <Avatar
          key={name}
          name={name}
          size={size}
          color={stackColors[i % stackColors.length]}
          bordered
          className="-ml-2 first:ml-0"
          style={{ zIndex: visible.length - i }}
        />
      ))}
      {overflow > 0 && (
        <span
          className={clsx(
            "t-meta -ml-2 inline-flex items-center justify-center rounded-full border-2 border-[var(--border-strong)] bg-[var(--bg-surface)]",
            sizeClasses[size],
          )}
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
