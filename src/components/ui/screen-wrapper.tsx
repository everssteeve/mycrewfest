import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

interface ScreenWrapperProps extends HTMLAttributes<HTMLDivElement> {
  withHeader?: boolean;
  withNav?: boolean;
  maxWidth?: boolean;
}

export function ScreenWrapper({
  withHeader = true,
  withNav = true,
  maxWidth = false,
  className,
  children,
  ...props
}: ScreenWrapperProps) {
  return (
    <div
      className={clsx(
        "min-h-dvh bg-[var(--bg-darker)] overflow-y-auto overflow-x-hidden",
        withHeader && "pt-[var(--header-height)]",
        withNav && "pb-[var(--nav-height)]",
        className,
      )}
      style={{
        paddingTop: withHeader
          ? `calc(var(--header-height) + env(safe-area-inset-top, 0px))`
          : `env(safe-area-inset-top, 0px)`,
        paddingBottom: withNav
          ? `calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))`
          : `env(safe-area-inset-bottom, 0px)`,
        WebkitOverflowScrolling: "touch",
      }}
      {...props}
    >
      <div
        className={clsx(
          "w-full px-4",
          maxWidth && "mx-auto max-w-[var(--max-content)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
