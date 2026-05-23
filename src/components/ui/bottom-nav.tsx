"use client";

import { CalendarDays, CircleUser, House, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildContextualHref, extractFestEventId, isTabActive } from "@/lib/bottom-nav";

interface NavTab {
  href: (festEventId: string | null) => string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  activeColor: string;
  section?: string;
  dataTestid: string;
}

const TABS: NavTab[] = [
  {
    href: () => "/catalogue",
    label: "Accueil",
    icon: House,
    activeColor: "var(--primary-neon)",
    dataTestid: "nav-accueil",
  },
  {
    href: (id) => buildContextualHref("programme", id, "/catalogue"),
    label: "Programme",
    icon: CalendarDays,
    activeColor: "var(--accent-pink)",
    section: "programme",
    dataTestid: "nav-programme",
  },
  {
    href: (id) => buildContextualHref("carte", id, "/catalogue"),
    label: "Carte",
    icon: MapPin,
    activeColor: "var(--primary-neon)",
    section: "carte",
    dataTestid: "nav-carte",
  },
  {
    href: (id) => buildContextualHref("crew", id, "/profil"),
    label: "Crew",
    icon: Users,
    activeColor: "var(--secondary-cyan)",
    section: "crew",
    dataTestid: "nav-crew",
  },
  {
    href: () => "/profil",
    label: "Profil",
    icon: CircleUser,
    activeColor: "var(--warning-orange)",
    dataTestid: "nav-profil",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const festEventId = extractFestEventId(pathname);

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around"
      style={{
        height: "var(--nav-height)",
        paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
        background: "rgba(22, 24, 32, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      {TABS.map((tab) => {
        const href = tab.href(festEventId);
        const active = isTabActive(pathname, href, tab.section);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.dataTestid}
            href={href}
            data-testid={tab.dataTestid}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-1 px-3 pt-2 transition"
            style={{
              color: active ? tab.activeColor : "var(--text-dim)",
              filter: active ? `drop-shadow(0 0 6px ${tab.activeColor}80)` : "none",
              transition: "var(--transition-fast)",
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
