"use client";

import { useEffect, useMemo, useState } from "react";
import { CrewCompass } from "@/components/crew/crew-compass";
import { QuickStatusBar } from "@/components/crew/quick-status-bar";
import { RallyPoint } from "@/components/crew/rally-point";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  countCrewAdmins,
  countCrewMembersActiveGeoloc,
  countCrewMembersWithGeoloc,
} from "@/lib/crew-stats";
import { useCrewStore } from "@/store/use-crew-store";
import type { CrewData, CrewMemberData, EventSummary, QuickStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrewSelection {
  eventId: string;
  eventTitle: string;
  startTime: string | null;
  endTime: string | null;
  memberNames: string[];
}

interface SharedMoment {
  start: string;
  end: string;
  durationMins: number;
}

interface CrewViewProps {
  festEventId: string;
  myUserId: string;
  myUserName: string | null;
  initialCrew: CrewData | null;
  mySelections: EventSummary[];
}

// ---------------------------------------------------------------------------
// Geoloc status icon
// ---------------------------------------------------------------------------

function GeolocIcon({ status }: { status: "off" | "active" | "background" }) {
  if (status === "active") {
    return (
      <span
        role="img"
        title="Géoloc active"
        style={{ color: "var(--primary-neon)", fontSize: 12 }}
        aria-label="Géoloc active"
      >
        ●
      </span>
    );
  }
  if (status === "background") {
    return (
      <span
        role="img"
        title="Géoloc en arrière-plan"
        style={{ color: "var(--warning-orange)", fontSize: 12 }}
        aria-label="Géoloc arrière-plan"
      >
        ◐
      </span>
    );
  }
  return (
    <span
      role="img"
      title="Géoloc désactivée"
      style={{ color: "var(--text-dim)", fontSize: 12 }}
      aria-label="Géoloc désactivée"
    >
      ○
    </span>
  );
}

// ---------------------------------------------------------------------------
// Quick status label
// ---------------------------------------------------------------------------

const STATUS_META: Record<QuickStatus, { icon: string; label: string }> = {
  fosse: { icon: "🎶", label: "En fosse" },
  nourriture: { icon: "🍔", label: "Cherche à manger" },
  ralliement: { icon: "📍", label: "Au point de ralliement" },
  rentre: { icon: "🏕️", label: "Rentre dormir" },
};

// ---------------------------------------------------------------------------
// Empty state (no crew)
// ---------------------------------------------------------------------------

function EmptyCrewState({
  festEventId,
  onCrewCreated,
}: {
  festEventId: string;
  onCrewCreated: (crew: CrewData) => void;
}) {
  const [view, setView] = useState<"idle" | "create" | "join">("idle");
  const [crewName, setCrewName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!crewName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/festevents/${festEventId}/crew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: crewName.trim() }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Erreur lors de la création");
      }
      const crew = (await res.json()) as CrewData;
      onCrewCreated(crew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crews/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          festEventId,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Code invalide");
      }
      const { crewId } = (await res.json()) as { crewId: string };
      // Fetch full crew data
      const crewRes = await fetch(`/api/crews/${crewId}`);
      if (!crewRes.ok) throw new Error("Impossible de charger le crew");
      const crew = (await crewRes.json()) as CrewData;
      onCrewCreated(crew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-xl)",
        paddingTop: "var(--space-2xl)",
        paddingBottom: "var(--space-2xl)",
        paddingLeft: "var(--space-md)",
        paddingRight: "var(--space-md)",
      }}
    >
      {/* Illustration neon */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--neon-soft)",
          border: "2px solid var(--primary-neon)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--glow-neon)",
          fontSize: 48,
        }}
        aria-hidden="true"
      >
        👥
      </div>

      <div style={{ textAlign: "center" }}>
        <h2 className="t-h2" style={{ color: "var(--text-main)", marginBottom: "var(--space-sm)" }}>
          Pas encore de crew
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            maxWidth: 280,
          }}
        >
          Crée un crew ou rejoins celui de tes amis pour coordonner en live.
        </p>
      </div>

      {view === "idle" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
            width: "100%",
            maxWidth: 320,
          }}
        >
          <Button variant="primary" fullWidth onClick={() => setView("create")}>
            Créer un crew
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setView("join")}>
            Rejoindre avec un code
          </Button>
        </div>
      )}

      {view === "create" && (
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <label
            htmlFor="crew-name-input"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            Nom du crew
          </label>
          <input
            id="crew-name-input"
            type="text"
            placeholder="Les Incroyables, Squad A, …"
            value={crewName}
            onChange={(e) => setCrewName(e.target.value)}
            maxLength={50}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-base)",
              padding: "var(--space-sm) var(--space-md)",
            }}
          />
          {error && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--danger-red)",
              }}
            >
              {error}
            </p>
          )}
          <Button variant="primary" fullWidth loading={loading} onClick={handleCreate}>
            Créer
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setView("idle");
              setError(null);
            }}
          >
            Annuler
          </Button>
        </div>
      )}

      {view === "join" && (
        <div
          style={{
            width: "100%",
            maxWidth: 320,
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <label
            htmlFor="invite-code-input"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
            }}
          >
            Code d&apos;invitation
          </label>
          <input
            id="invite-code-input"
            type="text"
            placeholder="Colle le code ici"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
              padding: "var(--space-sm) var(--space-md)",
              letterSpacing: "var(--tracking-wide)",
            }}
          />
          {error && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--danger-red)",
              }}
            >
              {error}
            </p>
          )}
          <Button variant="cyan" fullWidth loading={loading} onClick={handleJoin}>
            Rejoindre
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setView("idle");
              setError(null);
            }}
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// With-crew state
// ---------------------------------------------------------------------------

function computeSharedSelections(
  members: CrewMemberData[],
  memberSelectionsMap: Record<string, EventSummary[]>,
): CrewSelection[] {
  const eventMap = new Map<string, { event: EventSummary; memberNames: string[] }>();

  for (const member of members) {
    const sels = memberSelectionsMap[member.userId] ?? [];
    for (const ev of sels) {
      const existing = eventMap.get(ev.id);
      if (existing) {
        existing.memberNames.push(member.userName ?? "Membre");
      } else {
        eventMap.set(ev.id, {
          event: ev,
          memberNames: [member.userName ?? "Membre"],
        });
      }
    }
  }

  return [...eventMap.values()]
    .filter((e) => e.memberNames.length > 1)
    .map(({ event, memberNames }) => ({
      eventId: event.id,
      eventTitle: event.title,
      startTime: event.startTime ?? null,
      endTime: event.endTime ?? null,
      memberNames,
    }))
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
}

function computeFreeMoments(
  members: CrewMemberData[],
  memberSelectionsMap: Record<string, EventSummary[]>,
): SharedMoment[] {
  // Find time windows where ALL members have no event
  const allEvents = Object.values(memberSelectionsMap)
    .flat()
    .filter((e) => e.startTime && e.endTime);

  if (allEvents.length === 0) return [];

  const times = allEvents
    .flatMap((e) => [new Date(e.startTime!).getTime(), new Date(e.endTime!).getTime()])
    .sort((a, b) => a - b);

  if (times.length < 2) return [];

  const moments: SharedMoment[] = [];
  for (let i = 0; i < times.length - 1; i++) {
    const gapStart = times[i];
    const gapEnd = times[i + 1];
    if (gapEnd - gapStart < 15 * 60 * 1000) continue; // skip < 15 min gaps

    const allFree = members.every((m) => {
      const sels = memberSelectionsMap[m.userId] ?? [];
      return !sels.some((e) => {
        if (!e.startTime || !e.endTime) return false;
        const s = new Date(e.startTime).getTime();
        const en = new Date(e.endTime).getTime();
        return s < gapEnd && en > gapStart;
      });
    });

    if (allFree) {
      moments.push({
        start: new Date(gapStart).toISOString(),
        end: new Date(gapEnd).toISOString(),
        durationMins: Math.round((gapEnd - gapStart) / 60_000),
      });
    }
  }

  return moments.slice(0, 3); // top 3 moments
}

function formatTime(iso: string | null): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
}

function WithCrewView({
  crew,
  myUserId,
  festEventId,
  mySelections,
  onLeave,
}: {
  crew: CrewData;
  myUserId: string;
  festEventId: string;
  mySelections: EventSummary[];
  onLeave: () => void;
}) {
  const { quickStatus, setQuickStatus, setCrew, setRallyPoint } = useCrewStore();
  const [copied, setCopied] = useState(false);
  const [memberSelectionsMap, _setMemberSelectionsMap] = useState<Record<string, EventSummary[]>>({
    [myUserId]: mySelections,
  });
  const [localCrew, setLocalCrew] = useState<CrewData>(crew);

  const myMember = localCrew.members.find((m) => m.userId === myUserId);
  const isAdmin = myMember?.role === "admin";
  const inviteLink = `https://mycrewfest.app/join/${localCrew.inviteCode}`;

  const adminCount = useMemo(() => countCrewAdmins(localCrew.members), [localCrew.members]);
  const geolocCount = useMemo(
    () => countCrewMembersWithGeoloc(localCrew.members),
    [localCrew.members],
  );
  const activeGeolocCount = useMemo(
    () => countCrewMembersActiveGeoloc(localCrew.members),
    [localCrew.members],
  );

  // Copy invite link
  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  // Web Share API
  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: `Rejoins mon crew "${localCrew.name}"`,
        text: `Code : ${localCrew.inviteCode}`,
        url: inviteLink,
      });
    } else {
      await handleCopyCode();
    }
  }

  // Update store on load
  useEffect(() => {
    setCrew(localCrew);
    if (localCrew.rallyLatitude != null && localCrew.rallyLongitude != null) {
      setRallyPoint({
        lat: localCrew.rallyLatitude,
        lng: localCrew.rallyLongitude,
        description: localCrew.rallyDescription ?? undefined,
      });
    }
  }, [localCrew, setCrew, setRallyPoint]);

  // Handle rally point update
  function handleRallyUpdated(point: { lat: number; lng: number; description?: string }) {
    setRallyPoint(point);
    setLocalCrew((prev) => ({
      ...prev,
      rallyLatitude: point.lat,
      rallyLongitude: point.lng,
      rallyDescription: point.description,
    }));
  }

  // Handle quick status change
  function handleStatusChange(status: QuickStatus | null) {
    setQuickStatus(status);
  }

  // Compute shared planning data
  const sharedSelections = computeSharedSelections(localCrew.members, memberSelectionsMap);
  const freeMoments = computeFreeMoments(localCrew.members, memberSelectionsMap);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        paddingBottom: "var(--space-2xl)",
      }}
    >
      {/* ── Header crew ───────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "var(--space-sm)",
          }}
        >
          <div>
            <h2
              className="t-h2"
              style={{ color: "var(--text-main)", marginBottom: "var(--space-xs)" }}
            >
              {localCrew.name ?? "Mon Crew"}
            </h2>
            <AvatarStack
              names={localCrew.members.map((m) => m.userName ?? "?")}
              max={5}
              size="sm"
            />
          </div>

          <Button variant="ghost" size="sm" onClick={handleShare}>
            Partager
          </Button>
        </div>

        {/* Invite code */}
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-sm) var(--space-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                marginBottom: 2,
              }}
            >
              Code d&apos;invitation
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-sm)",
                color: "var(--primary-neon)",
                letterSpacing: "var(--tracking-wide)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {localCrew.inviteCode}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-ghost btn-sm"
            style={{
              color: copied ? "var(--primary-neon)" : "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      </div>

      {/* ── Rally point ───────────────────────────────────────────────────── */}
      <RallyPoint
        crewId={localCrew.id}
        lat={localCrew.rallyLatitude}
        lng={localCrew.rallyLongitude}
        description={localCrew.rallyDescription}
        isAdmin={isAdmin}
        onUpdated={handleRallyUpdated}
      />

      {/* ── Quick status ──────────────────────────────────────────────────── */}
      <QuickStatusBar
        crewId={localCrew.id}
        currentStatus={quickStatus}
        onStatusChange={handleStatusChange}
      />

      {/* ── Members list ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wider)",
          }}
        >
          Membres ({localCrew.members.length})
        </h3>

        {/* Crew stats strip */}
        {localCrew.members.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
              flexWrap: "wrap",
              marginBottom: "var(--space-xs)",
            }}
          >
            {geolocCount > 0 && (
              <span
                data-testid="crew-geoloc-count"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--primary-neon)",
                }}
                title="Membres partageant leur position (actif + arrière-plan)"
              >
                ◉ {geolocCount} en ligne
              </span>
            )}
            {activeGeolocCount > 0 && activeGeolocCount < geolocCount && (
              <>
                <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
                <span
                  data-testid="crew-active-geoloc-count"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--secondary-cyan)",
                  }}
                  title="Membres en partage temps réel (premier plan)"
                >
                  ⬤ {activeGeolocCount} en direct
                </span>
              </>
            )}
            {geolocCount > 0 && adminCount > 0 && (
              <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            )}
            {adminCount > 0 && (
              <span
                data-testid="crew-admin-count"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                }}
                title="Administrateurs du crew"
              >
                {adminCount} admin{adminCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {localCrew.members.map((member, i) => {
          const memberColors: Array<"neon" | "cyan" | "pink" | "orange"> = [
            "neon",
            "cyan",
            "pink",
            "orange",
          ];
          const color = memberColors[i % memberColors.length];
          const isMe = member.userId === myUserId;

          return (
            <div
              key={member.id}
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-sm) var(--space-md)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-md)",
              }}
            >
              <Avatar
                name={member.userName ?? "?"}
                src={member.userImage}
                size="md"
                color={color}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      fontWeight: "var(--fw-medium)",
                      color: "var(--text-main)",
                    }}
                  >
                    {member.userName ?? "Membre"}
                  </span>
                  {isMe && (
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                      }}
                    >
                      (moi)
                    </span>
                  )}
                  {member.role === "admin" && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--primary-neon)",
                        backgroundColor: "var(--neon-soft)",
                        borderRadius: "var(--radius-sm)",
                        padding: "1px 4px",
                        textTransform: "uppercase",
                      }}
                    >
                      admin
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-xs)",
                  }}
                >
                  <GeolocIcon status={member.geolocStatus} />
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {member.geolocStatus === "active"
                      ? "Position partagée"
                      : member.geolocStatus === "background"
                        ? "Position arrière-plan"
                        : "Position masquée"}
                  </span>
                </div>
              </div>

              {/* Quick status badge for each member */}
              {isMe && quickStatus && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: "var(--neon-soft)",
                    borderRadius: "var(--radius-full)",
                    padding: "2px 8px",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 12 }}>{STATUS_META[quickStatus].icon}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--primary-neon)",
                    }}
                  >
                    {STATUS_META[quickStatus].label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Crew Compass ──────────────────────────────────────────────────── */}
      <CrewCompass crewId={localCrew.id} members={localCrew.members} myUserId={myUserId} />

      {/* ── Plannings en commun ───────────────────────────────────────────── */}
      {sharedSelections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--accent-pink)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            Ce qu&apos;on a en commun
          </h3>

          {sharedSelections.map((s) => (
            <Card key={s.eventId} accent="pink" padding="sm">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "var(--space-sm)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      fontWeight: "var(--fw-medium)",
                      color: "var(--text-main)",
                      marginBottom: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.eventTitle}
                  </p>
                  {s.startTime && (
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatTime(s.startTime)}
                      {s.endTime ? ` – ${formatTime(s.endTime)}` : ""}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    justifyContent: "flex-end",
                    flexShrink: 0,
                    maxWidth: 120,
                  }}
                >
                  {s.memberNames.map((name) => (
                    <span
                      key={name}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 10,
                        backgroundColor: "var(--pink-soft)",
                        color: "var(--accent-pink)",
                        borderRadius: "var(--radius-full)",
                        padding: "2px 6px",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Moments libres ────────────────────────────────────────────────── */}
      {freeMoments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--secondary-cyan)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            Moments libres
          </h3>

          {freeMoments.map((m) => (
            <Card key={m.start} accent="cyan" padding="sm">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--secondary-cyan)",
                    }}
                  >
                    {formatTime(m.start)} – {formatTime(m.end)}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Tout le monde est libre
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-dim)",
                    backgroundColor: "var(--cyan-soft)",
                    borderRadius: "var(--radius-full)",
                    padding: "4px 10px",
                  }}
                >
                  {m.durationMins >= 60
                    ? `${Math.floor(m.durationMins / 60)}h${
                        m.durationMins % 60 > 0 ? `${m.durationMins % 60}m` : ""
                      }`
                    : `${m.durationMins}m`}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Leave crew ────────────────────────────────────────────────────── */}
      <div
        style={{
          paddingTop: "var(--space-md)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <Button variant="ghost" size="sm" onClick={onLeave} style={{ color: "var(--danger-red)" }}>
          Quitter le crew
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function CrewView({
  festEventId,
  myUserId,
  myUserName,
  initialCrew,
  mySelections,
}: CrewViewProps) {
  const { crew, setCrew } = useCrewStore();
  const [localCrew, setLocalCrew] = useState<CrewData | null>(crew ?? initialCrew);

  // Sync store → local
  useEffect(() => {
    if (crew) setLocalCrew(crew);
  }, [crew]);

  function handleCrewCreated(newCrew: CrewData) {
    setCrew(newCrew);
    setLocalCrew(newCrew);
  }

  async function handleLeave() {
    if (!localCrew) return;
    try {
      await fetch(`/api/crews/${localCrew.id}/members/${myUserId}`, {
        method: "DELETE",
      });
      setCrew(null);
      setLocalCrew(null);
    } catch {
      // Silent fail
    }
  }

  if (!localCrew) {
    return <EmptyCrewState festEventId={festEventId} onCrewCreated={handleCrewCreated} />;
  }

  return (
    <WithCrewView
      crew={localCrew}
      myUserId={myUserId}
      festEventId={festEventId}
      mySelections={mySelections}
      onLeave={handleLeave}
    />
  );
}
