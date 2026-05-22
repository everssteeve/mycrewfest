"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CrewMemberData, GeoPosition } from "@/types";
import { useCrewStore } from "@/store/use-crew-store";

interface CrewCompassProps {
  crewId: string;
  members: CrewMemberData[];
  myUserId: string;
}

const MEMBER_COLORS = [
  "var(--secondary-cyan)",
  "var(--accent-pink)",
  "var(--warning-orange)",
  "var(--primary-neon)",
];

function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

/**
 * CrewCompass — a minimal dot-map showing member positions and rally point.
 * Uses a <canvas>-free SVG approach for simplicity and CSS variable support.
 */
export function CrewCompass({ crewId, members, myUserId }: CrewCompassProps) {
  const {
    memberPositions,
    updateMemberPosition,
    myGeolocEnabled,
    setMyGeolocEnabled,
    rallyPoint,
  } = useCrewStore();

  const [polling, setPolling] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Post my position to the API
  const postMyPosition = useCallback(
    async (lat: number, lng: number) => {
      try {
        await fetch(`/api/crews/${crewId}/position`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng }),
        });
      } catch {
        // Silent fail — position is best-effort
      }
    },
    [crewId],
  );

  // Poll other members' positions
  const pollPositions = useCallback(async () => {
    try {
      const res = await fetch(`/api/crews/${crewId}/position`);
      if (!res.ok) return;
      const data = (await res.json()) as Record<
        string,
        { lat: number; lng: number; updatedAt: string }
      >;
      for (const [userId, pos] of Object.entries(data)) {
        updateMemberPosition(userId, pos);
      }
    } catch {
      // Silent fail
    }
  }, [crewId, updateMemberPosition]);

  // Enable geoloc
  function enableGeoloc() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyGeolocEnabled(true);
        postMyPosition(pos.coords.latitude, pos.coords.longitude);
        updateMemberPosition(myUserId, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updatedAt: new Date().toISOString(),
        });

        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            postMyPosition(p.coords.latitude, p.coords.longitude);
            updateMemberPosition(myUserId, {
              lat: p.coords.latitude,
              lng: p.coords.longitude,
              updatedAt: new Date().toISOString(),
            });
          },
          undefined,
          { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
        );
      },
      () => {
        // User denied or error — don't enable
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Disable geoloc
  function disableGeoloc() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setMyGeolocEnabled(false);
  }

  // Poll positions every 30s
  useEffect(() => {
    setPolling(true);
    pollPositions();
    pollTimerRef.current = setInterval(() => {
      pollPositions();
    }, 30_000);

    return () => {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
      }
      setPolling(false);
    };
  }, [pollPositions]);

  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Build positioned members for the dot map
  const positionedMembers = members.filter(
    (m) => m.userId !== myUserId && memberPositions[m.userId],
  );
  const myPos: GeoPosition | undefined = memberPositions[myUserId];
  const allPoints = [
    ...positionedMembers.map((m) => memberPositions[m.userId]),
    ...(myPos ? [myPos] : []),
    ...(rallyPoint
      ? [{ lat: rallyPoint.lat, lng: rallyPoint.lng, updatedAt: "" }]
      : []),
  ];

  // Compute bounding box for SVG projection
  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);
  const minLat = Math.min(...lats, 0);
  const maxLat = Math.max(...lats, 0);
  const minLng = Math.min(...lngs, 0);
  const maxLng = Math.max(...lngs, 0);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const SVG_SIZE = 240;
  const PADDING = 24;
  const usable = SVG_SIZE - PADDING * 2;

  function project(lat: number, lng: number): [number, number] {
    const x = PADDING + ((lng - minLng) / lngRange) * usable;
    const y = PADDING + ((maxLat - lat) / latRange) * usable;
    return [x, y];
  }

  const hasAnyPosition = allPoints.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      {/* Map canvas */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            padding: "var(--space-sm) var(--space-md)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-xs)",
              color: "var(--secondary-cyan)",
              textTransform: "uppercase",
              letterSpacing: "var(--tracking-wider)",
            }}
          >
            Positions
          </span>
          {polling && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
              }}
            >
              ● live
            </span>
          )}
        </div>

        {hasAnyPosition ? (
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            width="100%"
            style={{ display: "block", maxHeight: 260 }}
            aria-label="Carte des positions du crew"
          >
            {/* Grid lines */}
            {[...Array(5)].map((_, i) => (
              <line
                key={`h${i}`}
                x1={PADDING}
                y1={PADDING + (i * usable) / 4}
                x2={SVG_SIZE - PADDING}
                y2={PADDING + (i * usable) / 4}
                stroke="var(--border-color)"
                strokeWidth={0.5}
              />
            ))}
            {[...Array(5)].map((_, i) => (
              <line
                key={`v${i}`}
                x1={PADDING + (i * usable) / 4}
                y1={PADDING}
                x2={PADDING + (i * usable) / 4}
                y2={SVG_SIZE - PADDING}
                stroke="var(--border-color)"
                strokeWidth={0.5}
              />
            ))}

            {/* Rally point */}
            {rallyPoint && (() => {
              const [rx, ry] = project(rallyPoint.lat, rallyPoint.lng);
              return (
                <g key="rally">
                  <circle cx={rx} cy={ry} r={10} fill="var(--neon-soft)" />
                  <circle cx={rx} cy={ry} r={5} fill="var(--primary-neon)" />
                  <text
                    x={rx + 12}
                    y={ry + 4}
                    fill="var(--primary-neon)"
                    fontSize={8}
                    fontFamily="var(--font-mono)"
                  >
                    RDV
                  </text>
                </g>
              );
            })()}

            {/* Other members */}
            {positionedMembers.map((member, i) => {
              const pos = memberPositions[member.userId];
              if (!pos) return null;
              const [cx, cy] = project(pos.lat, pos.lng);
              const color = getMemberColor(i);
              const initial = (member.userName ?? "?").charAt(0).toUpperCase();
              return (
                <g key={member.userId}>
                  <circle cx={cx} cy={cy} r={12} fill="rgba(0,229,255,0.15)" />
                  <circle cx={cx} cy={cy} r={7} fill={color} />
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    fill="var(--bg-darker)"
                    fontSize={7}
                    fontFamily="var(--font-display)"
                    fontWeight="bold"
                  >
                    {initial}
                  </text>
                </g>
              );
            })}

            {/* My position */}
            {myPos && (() => {
              const [mx, my] = project(myPos.lat, myPos.lng);
              return (
                <g key="me">
                  <circle cx={mx} cy={my} r={14} fill="rgba(255,255,255,0.1)" />
                  <circle cx={mx} cy={my} r={7} fill="white" />
                  <text
                    x={mx + 10}
                    y={my + 4}
                    fill="var(--text-muted)"
                    fontSize={7}
                    fontFamily="var(--font-mono)"
                  >
                    Moi
                  </text>
                </g>
              );
            })()}
          </svg>
        ) : (
          <div
            style={{
              height: 160,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-md)",
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.3 }} aria-hidden="true">
              🗺️
            </span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-dim)",
                textAlign: "center",
              }}
            >
              Aucune position partagée pour l&apos;instant
            </p>
          </div>
        )}
      </div>

      {/* Geoloc toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--bg-surface)",
          border: `1px solid ${myGeolocEnabled ? "var(--secondary-cyan)" : "var(--border-color)"}`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md)",
          boxShadow: myGeolocEnabled ? "var(--glow-cyan)" : "var(--shadow-sm)",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-medium)",
              color: myGeolocEnabled ? "var(--secondary-cyan)" : "var(--text-main)",
              marginBottom: "var(--space-xs)",
            }}
          >
            {myGeolocEnabled ? "Géoloc active" : "Partager ma position"}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
            }}
          >
            {myGeolocEnabled
              ? "Ton crew te voit sur la carte"
              : "Opt-in — visible par ton crew uniquement"}
          </p>
        </div>

        {myGeolocEnabled ? (
          <button
            type="button"
            onClick={disableGeoloc}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0 }}
          >
            Désactiver
          </button>
        ) : (
          <button
            type="button"
            onClick={enableGeoloc}
            className="btn btn-cyan btn-sm"
            style={{ flexShrink: 0 }}
          >
            Activer
          </button>
        )}
      </div>

      {/* Legend */}
      {positionedMembers.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-sm)",
          }}
        >
          {positionedMembers.map((m, i) => (
            <div
              key={m.userId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: getMemberColor(i),
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                }}
              >
                {m.userName ?? "Membre"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
