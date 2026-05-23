"use client";

import Link from "next/link";
import { MapPin, CalendarDays, Heart, Users, Share2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useTransition } from "react";
import type { FestivalSummary, FestivalType, ProgramStatus } from "@/lib/types";
import { getFestivalTemporalStatus, getDaysUntilStart } from "@/lib/festival-temporal";
import { getFestivalCountdown } from "@/lib/festival-countdown";
import { formatFestivalStats } from "@/lib/format-count";
import { formatFollowerCount, getFollowerTier, getFollowerTierColor, getFollowerTierBg } from "@/lib/festival-community";
import { buildFollowApiUrl, getFollowToggleAriaLabel, getFollowToggleMethod } from "@/lib/catalogue-quick-follow";
import { getCapacityTier, getCapacityTierColor, getCapacityTierBg, formatCapacityLabel, buildCapacityAriaLabel } from "@/lib/festival-capacity";
import { computeNewsStatus, getNewsBadgeLabel, getNewsBadgeColor } from "@/lib/news-badge";
import { shareOrCopy, buildFestivalSharePayload } from "@/lib/share";

interface FestivalCardProps {
  festival: FestivalSummary;
}

const TYPE_LABELS: Record<FestivalType, string> = {
  musique: "Musique",
  "théâtre_rue": "Théâtre de rue",
  cirque: "Cirque",
  world: "World",
  multidisciplinaire: "Multidisciplinaire",
  autre: "Autre",
};

const PROGRAM_STATUS_CONFIG: Record<
  ProgramStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  complet: {
    label: "Programme complet",
    color: "var(--primary-neon)",
    bg: "var(--neon-soft)",
    border: "var(--primary-neon)",
  },
  partiel: {
    label: "Programme partiel",
    color: "var(--warning-orange)",
    bg: "var(--orange-soft)",
    border: "var(--warning-orange)",
  },
  "bientôt_disponible": {
    label: "Bientôt disponible",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.06)",
    border: "var(--border-color)",
  },
};

export function FestivalCard({ festival }: FestivalCardProps) {
  const [followed, setFollowed] = useState(festival.isFollowed ?? false);
  const [isPending, startTransition] = useTransition();
  const [shareFeedback, setShareFeedback] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    shareOrCopy(buildFestivalSharePayload(festival.name, festival.slug)).then((result) => {
      if (result === "copied") {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 1500);
      }
    });
  };

  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !followed;
    setFollowed(next);
    startTransition(async () => {
      try {
        const res = await fetch(buildFollowApiUrl(festival.slug), {
          method: getFollowToggleMethod(followed),
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) setFollowed(followed);
      } catch {
        setFollowed(followed);
      }
    });
  };

  const programStatusCfg =
    PROGRAM_STATUS_CONFIG[festival.programStatus] ??
    PROGRAM_STATUS_CONFIG["bientôt_disponible"];

  const startDate = new Date(festival.startDate);
  const endDate = new Date(festival.endDate);

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  const dateLabel = sameMonth
    ? `${format(startDate, "d", { locale: fr })}–${format(endDate, "d MMM yyyy", { locale: fr })}`
    : `${format(startDate, "d MMM", { locale: fr })} – ${format(endDate, "d MMM yyyy", { locale: fr })}`;

  const typeLabel = TYPE_LABELS[festival.festivalType] ?? "Autre";
  const temporalStatus = getFestivalTemporalStatus(festival.startDate, festival.endDate);
  const daysUntil = temporalStatus === "imminent" ? getDaysUntilStart(festival.startDate) : null;
  const countdown = getFestivalCountdown(startDate, endDate);
  const newsBadge = computeNewsStatus(
    festival.recentNewsCount ?? 0,
    festival.hasUrgentNews ?? false,
  );

  return (
    <Link
      href={`/festival/${festival.slug}`}
      className="block"
      style={{ textDecoration: "none" }}
    >
      <article
        className="festival-card group"
        data-temporal={temporalStatus}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: temporalStatus === "en_cours"
            ? "1px solid rgba(0,255,102,0.3)"
            : "1px solid var(--border-color)",
          padding: "var(--space-md)",
          transition: "var(--transition-fast)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          opacity: temporalStatus === "past" ? 0.55 : 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--glow-neon)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,102,0.4)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1.005)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        {/* Header row: name + badges */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="t-h3 flex-1"
            style={{
              color: temporalStatus === "past" ? "var(--text-muted)" : "var(--text-main)",
              fontSize: "var(--fs-base)",
              lineHeight: "var(--lh-snug)",
            }}
          >
            {festival.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {temporalStatus === "en_cours" && (
              <span
                aria-label="Festival en cours"
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--neon-soft)",
                  color: "var(--primary-neon)",
                  border: "1px solid var(--primary-neon)",
                  boxShadow: "0 0 6px rgba(0,255,102,0.4)",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 7 }}>●</span>
                En cours
              </span>
            )}
            {temporalStatus === "imminent" && daysUntil !== null && (
              <span
                aria-label={`Festival dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}`}
                className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--cyan-soft)",
                  color: "var(--secondary-cyan)",
                  border: "1px solid rgba(0,229,255,0.5)",
                }}
              >
                {daysUntil === 0 ? "Demain" : `Dans ${daysUntil} j`}
              </span>
            )}
            {newsBadge && (
              <span
                data-testid={`festival-news-badge-${festival.slug}`}
                aria-label={getNewsBadgeLabel(newsBadge)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${getNewsBadgeColor(newsBadge)}22`,
                  color: getNewsBadgeColor(newsBadge),
                  border: `1px solid ${getNewsBadgeColor(newsBadge)}66`,
                }}
              >
                {getNewsBadgeLabel(newsBadge)}
              </span>
            )}
            <button
              type="button"
              data-testid={`festival-quick-follow-${festival.slug}`}
              aria-label={getFollowToggleAriaLabel(followed, festival.name)}
              aria-pressed={followed}
              onClick={toggleFollow}
              disabled={isPending}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: followed ? "rgba(255,0,122,0.1)" : "transparent",
                color: followed ? "var(--accent-pink)" : "var(--text-dim)",
                border: followed ? "1px solid rgba(255,0,122,0.3)" : "1px solid transparent",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.6 : 1,
                transition: "var(--transition-fast)",
              }}
            >
              <Heart size={10} aria-hidden="true" fill={followed ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              data-testid={`festival-share-${festival.slug}`}
              aria-label={`Partager ${festival.name}`}
              onClick={handleShare}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: shareFeedback ? "rgba(0,229,255,0.1)" : "transparent",
                color: shareFeedback ? "var(--secondary-cyan)" : "var(--text-dim)",
                border: shareFeedback ? "1px solid rgba(0,229,255,0.3)" : "1px solid transparent",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
              title={shareFeedback ? "Lien copié !" : "Partager ce festival"}
            >
              <Share2 size={10} aria-hidden="true" />
            </button>
            {festival.confidenceLevel === "auto" && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--cyan-soft)",
                  color: "var(--secondary-cyan)",
                  border: "1px solid var(--secondary-cyan)",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 8 }}>✦</span>
                IA
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <p
          className="t-mono text-sm"
          style={{ color: "var(--accent-pink)", fontSize: "var(--fs-sm)" }}
        >
          <CalendarDays
            size={12}
            className="inline mr-1 -mt-0.5"
            aria-hidden="true"
          />
          {dateLabel}
        </p>

        {/* Location */}
        <p
          className="t-caption flex items-center gap-1"
          style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}
        >
          <MapPin size={12} aria-hidden="true" />
          {festival.city}, {festival.country}
        </p>

        {/* Stats */}
        {festival._count && (festival._count.events > 0 || festival._count.followers > 0) && (
          <p
            className="t-caption"
            style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}
            data-testid="festival-event-count"
          >
            {formatFestivalStats(festival._count)}
          </p>
        )}

        {/* Followers badge */}
        {festival._count && festival._count.followers > 0 && (() => {
          const tier = getFollowerTier(festival._count.followers);
          return (
            <span
              data-testid="festival-follower-badge"
              aria-label={`${festival._count.followers} personnes suivent ce festival`}
              className="inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{
                backgroundColor: getFollowerTierBg(tier),
                color: getFollowerTierColor(tier),
                border: `1px solid ${getFollowerTierColor(tier)}40`,
              }}
            >
              <Users size={10} aria-hidden="true" />
              {formatFollowerCount(festival._count.followers)}
            </span>
          );
        })()}

        {/* Chips row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Festival type chip */}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(0,229,255,0.1)",
              color: "var(--secondary-cyan)",
              border: "1px solid rgba(0,229,255,0.3)",
            }}
          >
            {typeLabel}
          </span>

          {/* Program status chip */}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: programStatusCfg.bg,
              color: programStatusCfg.color,
              border: `1px solid ${programStatusCfg.border}`,
            }}
          >
            {programStatusCfg.label}
          </span>

          {/* Capacity tier chip */}
          {festival.capacity && festival.capacity > 0 && (() => {
            const tier = getCapacityTier(festival.capacity);
            return (
              <span
                data-testid="festival-capacity-badge"
                aria-label={buildCapacityAriaLabel(festival.capacity, tier)}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: getCapacityTierBg(tier),
                  color: getCapacityTierColor(tier),
                  border: `1px solid ${getCapacityTierColor(tier)}30`,
                }}
              >
                {formatCapacityLabel(festival.capacity)} · {tier}
              </span>
            );
          })()}

          {/* Countdown badge */}
          <span
            data-testid="festival-countdown"
            aria-label={countdown.ariaLabel}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-mono)",
              color:
                countdown.state === "upcoming"
                  ? "var(--primary-neon)"
                  : countdown.state === "ongoing"
                    ? "var(--secondary-cyan)"
                    : "var(--text-dim)",
              backgroundColor:
                countdown.state === "upcoming"
                  ? "rgba(0,255,102,0.08)"
                  : countdown.state === "ongoing"
                    ? "rgba(0,229,255,0.08)"
                    : "rgba(255,255,255,0.04)",
              border:
                countdown.state === "upcoming"
                  ? "1px solid rgba(0,255,102,0.25)"
                  : countdown.state === "ongoing"
                    ? "1px solid rgba(0,229,255,0.25)"
                    : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {countdown.label}
          </span>
        </div>
      </article>
    </Link>
  );
}
