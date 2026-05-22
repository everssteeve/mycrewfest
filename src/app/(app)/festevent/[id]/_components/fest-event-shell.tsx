"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { differenceInDays, isWithinInterval, parseISO } from "date-fns";
import type { FestivalSummary } from "@/lib/api";

interface FestEventShellProps {
  festEventId: string;
  festival: FestivalSummary;
  presenceDates: string[];
  children: React.ReactNode;
}

const TABS = [
  { label: "Programme", path: "programme" },
  { label: "Planning", path: "planning" },
  { label: "Crew", path: "crew" },
  { label: "Journal", path: "journal" },
] as const;

function getDayBadge(startDate: string, endDate: string): string {
  const now = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isWithinInterval(now, { start, end })) {
    const dayN = differenceInDays(now, start) + 1;
    return `Jour ${dayN}`;
  }

  const daysUntil = differenceInDays(start, now);
  if (daysUntil > 0) {
    return `J-${daysUntil}`;
  }

  return "";
}

export function FestEventShell({
  festEventId,
  festival,
  children,
}: FestEventShellProps) {
  const pathname = usePathname();
  const badge = getDayBadge(festival.startDate, festival.endDate);
  const base = `/festevent/${festEventId}`;

  return (
    <>
      {/* Fixed header */}
      <header
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          zIndex: 40,
          background: "rgba(13, 14, 18, 0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border-color)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* Top row: festival name + badge */}
        <div
          style={{
            height: "var(--header-height)",
            display: "flex",
            alignItems: "center",
            paddingLeft: "var(--space-md)",
            paddingRight: "var(--space-md)",
            gap: "var(--space-sm)",
          }}
        >
          <span
            className="t-h3"
            style={{
              color: "var(--text-main)",
              fontSize: "var(--fs-md)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {festival.name}
          </span>
          {badge && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                color: "var(--accent-pink)",
                backgroundColor: "var(--pink-soft)",
                border: "1px solid var(--accent-pink)",
                borderRadius: "var(--radius-full)",
                padding: "2px 10px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Sub-navigation tabs */}
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--border-color)",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {TABS.map((tab) => {
            const href = `${base}/${tab.path}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={tab.path}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px var(--space-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: "var(--fw-bold)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  color: isActive ? "var(--primary-neon)" : "var(--text-muted)",
                  borderBottom: isActive
                    ? "2px solid var(--primary-neon)"
                    : "2px solid transparent",
                  transition: "var(--transition-fast)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Content — offset for double header (header + tabs) */}
      <div
        style={{
          paddingTop: "calc(var(--header-height) + 41px + env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))",
          minHeight: "100dvh",
          backgroundColor: "var(--bg-darker)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "var(--max-content)",
            margin: "0 auto",
            paddingLeft: "var(--space-md)",
            paddingRight: "var(--space-md)",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
