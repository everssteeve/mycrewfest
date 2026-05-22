"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { CalendarDays, Map, Users, Home } from "lucide-react";

interface NavTab {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  activeColor: string;
  activeGlow: string;
}

const TABS: NavTab[] = [
  {
    href: "/lineup",
    label: "Line-up",
    icon: CalendarDays,
    activeColor: "var(--accent-pink)",
    activeGlow: "var(--glow-pink)",
  },
  {
    href: "/map",
    label: "La Carte",
    icon: Map,
    activeColor: "var(--primary-neon)",
    activeGlow: "var(--glow-neon)",
  },
  {
    href: "/crew",
    label: "Mon Crew",
    icon: Users,
    activeColor: "var(--secondary-cyan)",
    activeGlow: "var(--glow-cyan)",
  },
  {
    href: "/hq",
    label: "Le QG",
    icon: Home,
    activeColor: "var(--text-main)",
    activeGlow: "none",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
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
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-col items-center gap-1 px-4 pt-2 transition",
              "text-[var(--text-dim)]",
            )}
            style={{
              color: isActive ? tab.activeColor : "var(--text-dim)",
              filter: isActive && tab.activeGlow !== "none"
                ? `drop-shadow(0 0 6px ${tab.activeColor}80)`
                : "none",
              transition: "var(--transition-fast)",
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
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
