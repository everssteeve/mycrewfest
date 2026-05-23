import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  buildLeaderboard,
  filterTopN,
  getUserPosition,
  POSITION_MEDALS,
  RANK_COLORS,
  RANK_LABELS,
} from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Classement Festivaliers",
};

const TOP_N = 50;

async function fetchLeaderboardData() {
  const [users, allFestEvents, vuSelections] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        pseudo: true,
        _count: {
          select: {
            festEvents: true,
            followedFestivals: true,
            souvenirs: true,
          },
        },
      },
    }),
    prisma.festEvent.findMany({ select: { id: true, userId: true } }),
    prisma.selection.findMany({
      where: { status: "vu" },
      select: { festEventId: true },
    }),
  ]);

  const festEventUserMap = new Map<string, string>();
  for (const fe of allFestEvents) {
    festEventUserMap.set(fe.id, fe.userId);
  }

  const vuCountByUser: Record<string, number> = {};
  for (const sel of vuSelections) {
    const userId = festEventUserMap.get(sel.festEventId);
    if (userId) {
      vuCountByUser[userId] = (vuCountByUser[userId] ?? 0) + 1;
    }
  }

  const rawUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    pseudo: u.pseudo,
    festEventsCount: u._count.festEvents,
    followedFestivalsCount: u._count.followedFestivals,
    souvenirsCount: u._count.souvenirs,
  }));

  return { rawUsers, vuCountByUser };
}

export default async function ClassementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { rawUsers, vuCountByUser } = await fetchLeaderboardData();
  const userId = session.user.id;
  const allEntries = buildLeaderboard(rawUsers, vuCountByUser);
  const topEntries = filterTopN(allEntries, TOP_N);
  const currentUserPosition = getUserPosition(allEntries, userId);
  const currentUserEntry = allEntries.find((e) => e.userId === userId);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg-darker, #0D0E12)",
        color: "var(--text-primary, #F0F0F0)",
        padding: "24px 16px 80px",
        maxWidth: 640,
        margin: "0 auto",
        fontFamily: "var(--font-body, sans-serif)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          data-testid="classement-title"
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontSize: "1.5rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Classement
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--text-dim, #666)" }}>
          Top {TOP_N} festivaliers par score
        </p>
      </div>

      {/* Current user position (if outside top N) */}
      {currentUserEntry && currentUserPosition > TOP_N && (
        <div
          data-testid="classement-my-rank"
          style={{
            background: "var(--bg-card, #141519)",
            border: "1px solid var(--primary-neon, #00FF66)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim, #666)" }}>Votre position</span>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--primary-neon, #00FF66)",
            }}
          >
            #{currentUserPosition}
          </span>
        </div>
      )}

      {/* Leaderboard list */}
      {topEntries.length === 0 ? (
        <div
          data-testid="classement-empty"
          style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim, #666)" }}
        >
          <p>Aucun festivalier encore. Sois le premier !</p>
          <Link
            href="/catalogue"
            style={{
              marginTop: 16,
              display: "inline-block",
              color: "var(--primary-neon, #00FF66)",
              border: "1px solid var(--primary-neon, #00FF66)",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explorer les festivals
          </Link>
        </div>
      ) : (
        <ol
          data-testid="classement-list"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {topEntries.map((entry, index) => {
            const position = index + 1;
            const isMe = entry.userId === userId;
            const medal = POSITION_MEDALS[position];
            return (
              <li
                key={entry.userId}
                data-testid={`classement-entry-${position}`}
                style={{
                  background: isMe ? "rgba(0,255,102,0.06)" : "var(--bg-card, #141519)",
                  border: isMe
                    ? "1px solid rgba(0,255,102,0.3)"
                    : "1px solid var(--border-subtle, #1E1F26)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Position */}
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: medal ? "inherit" : "var(--text-dim, #666)",
                    flexShrink: 0,
                    minWidth: 28,
                    textAlign: "right",
                  }}
                >
                  {medal ?? `#${position}`}
                </span>

                {/* Name + rank */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: isMe ? "var(--primary-neon, #00FF66)" : "var(--text-primary, #F0F0F0)",
                    }}
                  >
                    {entry.displayName}
                    {isMe && (
                      <span style={{ fontSize: "0.7rem", marginLeft: 6, opacity: 0.7 }}>(moi)</span>
                    )}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: RANK_COLORS[entry.rank],
                    }}
                  >
                    {RANK_LABELS[entry.rank]}
                  </p>
                </div>

                {/* Score */}
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: RANK_COLORS[entry.rank],
                    flexShrink: 0,
                  }}
                >
                  {entry.score} pts
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Back to profil */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link
          href="/profil"
          style={{
            fontSize: "0.8rem",
            color: "var(--text-dim, #666)",
            textDecoration: "none",
          }}
        >
          ← Retour au profil
        </Link>
      </div>
    </main>
  );
}
