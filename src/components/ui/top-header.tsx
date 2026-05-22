import { type ReactNode } from "react";
import { clsx } from "clsx";

interface TopHeaderProps {
  title: string;
  meta?: string;
  right?: ReactNode;
  className?: string;
}

export function TopHeader({ title, meta, right, className }: TopHeaderProps) {
  return (
    <header
      className={clsx("fixed left-0 right-0 top-0 z-40 flex items-center px-4", className)}
      style={{
        height: "var(--header-height)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        background: "rgba(13, 14, 18, 0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div className="flex flex-1 flex-col justify-center gap-0.5">
        {meta && <span className="t-meta leading-none">{meta}</span>}
        <span
          className="t-h3 leading-none text-[var(--text-main)]"
          style={{ fontSize: "var(--fs-md)" }}
        >
          {title}
        </span>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
