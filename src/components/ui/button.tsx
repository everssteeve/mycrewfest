import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "pink" | "cyan" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  pink: "btn btn-pink",
  cyan: "btn btn-cyan",
  ghost: "btn btn-ghost",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx={8}
        cy={8}
        r={6}
        stroke="currentColor"
        strokeWidth={2}
        strokeOpacity={0.3}
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
