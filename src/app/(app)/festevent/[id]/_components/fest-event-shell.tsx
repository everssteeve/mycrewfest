"use client";

import { isWithinInterval, parseISO } from "date-fns";
import { Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { EventCountdown } from "@/components/festevent/event-countdown";
import { NowPlayingBar } from "@/components/festevent/now-playing-bar";
import { QuickLogFab } from "@/components/festevent/quick-log-fab";
import { SelectionProgressBar } from "@/components/festevent/selection-progress-bar";
import type { FestivalSummary } from "@/lib/api";
import { FestEventSettingsSheet } from "./festevent-settings-sheet";

interface FestEventShellProps {
  festEventId: string;
  festival: FestivalSummary;
  presenceDates: string[];
  children: React.ReactNode;
}

function buildTabs(base: string, programType: string): Array<{ label: string; href: string }> {
  const tabs: Array<{ label: string; href: string }> = [
    { label: "Programme", href: `${base}/programme` },
    { label: "Planning", href: `${base}/planning` },
    { label: "Crew", href: `${base}/crew` },
    { label: "Journal", href: `${base}/journal` },
    { label: "Checklist", href: `${base}/checklist` },
    { label: "Signaux", href: `${base}/signaux` },
    { label: "Carte", href: `${base}/carte` },
    { label: "News", href: `${base}/news` },
  ];

  if (programType === "déambulatoire" || programType === "hybride") {
    tabs.splice(1, 0, {
      label: "Déambulation",
      href: `${base}/mode-deambuloire`,
    });
  }

  return tabs;
}

function isFestivalDuring(startDate: string, endDate: string): boolean {
  const now = new Date();
  return isWithinInterval(now, { start: parseISO(startDate), end: parseISO(endDate) });
}

function isFestivalPast(endDate: string): boolean {
  return new Date() > parseISO(endDate);
}

export function FestEventShell({
  festEventId,
  festival,
  presenceDates,
  children,
}: FestEventShellProps) {
  const pathname = usePathname();
  const base = `/festevent/${festEventId}`;
  const tabs = buildTabs(base, festival.programType);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const during = isFestivalDuring(festival.startDate, festival.endDate);
  const past = isFestivalPast(festival.endDate);

  if (past) {
    tabs.push({ label: "Bilan", href: `${base}/bilan` });
  }

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
        {/* Top row: festival name + contextual badge */}
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
          {!past && <EventCountdown startDate={festival.startDate} endDate={festival.endDate} />}
          {past && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                color: "var(--text-dim)",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-full)",
                padding: "2px 10px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              FESTIVAL TERMINÉ
            </span>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Paramètres du FestEvent"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Settings size={18} aria-hidden="true" />
          </button>
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
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
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

        {/* Progress bar — visible only during festival */}
        {during && <SelectionProgressBar festEventId={festEventId} />}
      </header>

      {/* Content — offset for double header (header + tabs + progress bar when during) */}
      <div
        style={{
          paddingTop: `calc(var(--header-height) + 41px + ${during ? "50px" : "0px"} + env(safe-area-inset-top, 0px))`,
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

      {/* F07 — NowPlayingBar: visible only during festival */}
      {during && <NowPlayingBar festEventId={festEventId} />}

      {/* F12 — QuickLogFab: visible on all pages */}
      <QuickLogFab festEventId={festEventId} />

      {/* Settings sheet */}
      {settingsOpen && (
        <FestEventSettingsSheet
          festEventId={festEventId}
          festivalName={festival.name}
          startDate={festival.startDate}
          endDate={festival.endDate}
          currentPresenceDates={presenceDates}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
