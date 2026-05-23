"use client";

import { ChevronDown, MapPin, Navigation, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countEventsOnMap, countMappedVenues, countVisibleCrewMembers } from "@/lib/carte-stats";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VenueWithEvents {
  id: string;
  name: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  events: Array<{
    id: string;
    title: string;
    startTime: string | null;
    endTime: string | null;
    artist: string | null;
  }>;
}

export interface CrewMemberPosition {
  userId: string;
  userName: string;
  userImage: string | null;
  lat: number;
  lng: number;
  lastSeenAt: string;
}

interface CarteViewProps {
  festivalName: string;
  mapImageUrl: string | null;
  venues: VenueWithEvents[];
  crewPositions: CrewMemberPosition[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}h${m}`;
}

/** Normalize a lat/lng array to [0, 100] percentage coords within bounding box */
function normalizePositions(venues: VenueWithEvents[]): Map<string, { x: number; y: number }> {
  const withCoords = venues.filter((v) => v.latitude != null && v.longitude != null);
  if (withCoords.length === 0) return new Map();

  const lats = withCoords.map((v) => v.latitude as number);
  const lngs = withCoords.map((v) => v.longitude as number);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const map = new Map<string, { x: number; y: number }>();
  for (const v of withCoords) {
    // lat increases upward → invert Y; lng increases rightward → X
    const x = (((v.longitude as number) - minLng) / lngRange) * 80 + 10;
    const y = 100 - (((v.latitude as number) - minLat) / latRange) * 80 - 10;
    map.set(v.id, { x, y });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Venue pin (SVG map mode)
// ---------------------------------------------------------------------------

function VenuePin({
  x,
  y,
  venue,
  isSelected,
  onSelect,
}: {
  x: number;
  y: number;
  venue: VenueWithEvents;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const accentColor = isSelected ? "var(--primary-neon)" : "var(--secondary-cyan)";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -100%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: isSelected ? 20 : 10,
      }}
    >
      <div
        style={{
          background: isSelected ? "var(--primary-neon)" : "var(--bg-card)",
          border: `2px solid ${accentColor}`,
          borderRadius: "var(--radius-sm)",
          padding: "3px 6px",
          fontSize: 10,
          fontWeight: "var(--fw-bold)",
          color: isSelected ? "#000" : accentColor,
          whiteSpace: "nowrap",
          boxShadow: isSelected ? "var(--glow-neon)" : "none",
          transition: "var(--transition-fast)",
          maxWidth: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {venue.name}
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `6px solid ${accentColor}`,
          marginTop: -1,
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Crew member pin
// ---------------------------------------------------------------------------

function CrewPin({ x, y, member }: { x: number; y: number; member: CrewMemberPosition }) {
  const initials = member.userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--secondary-cyan)",
          border: "2px solid var(--bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: "var(--fw-bold)",
          color: "#000",
          boxShadow: "var(--glow-cyan)",
        }}
      >
        {member.userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.userImage}
            alt={member.userName}
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Venue bottom sheet
// ---------------------------------------------------------------------------

function VenueSheet({ venue, onClose }: { venue: VenueWithEvents; onClose: () => void }) {
  const today = new Date().toLocaleDateString("sv-SE");

  const todaysEvents = venue.events.filter((e) => {
    if (!e.startTime) return false;
    const d = new Date(e.startTime).toLocaleDateString("sv-SE");
    return d === today;
  });

  const typeLabel: Record<string, string> = {
    scène: "Scène",
    espace: "Espace",
    rue: "Rue",
    salle: "Salle",
    plein_air: "Plein air",
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="presentation"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          width: "100%",
          maxWidth: "var(--max-content)",
          maxHeight: "60dvh",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-lg)",
          gap: "var(--space-md)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2
              style={{
                color: "var(--primary-neon)",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "var(--fs-md)",
                margin: 0,
              }}
            >
              {venue.name}
            </h2>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
              {typeLabel[venue.type] ?? venue.type}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Today's events */}
        {todaysEvents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <p
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: "var(--fw-bold)",
                margin: 0,
              }}
            >
              Aujourd'hui
            </p>
            {todaysEvents.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-sm) var(--space-md)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "var(--text-main)",
                      fontSize: "var(--fs-sm)",
                      margin: 0,
                      fontWeight: "var(--fw-bold)",
                    }}
                  >
                    {e.title}
                  </p>
                  {e.artist && (
                    <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs)", margin: 0 }}>
                      {e.artist}
                    </p>
                  )}
                </div>
                {e.startTime && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--accent-pink)",
                      background: "rgba(255,0,122,0.08)",
                      borderRadius: "var(--radius-full)",
                      padding: "2px 8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatTime(e.startTime)}
                    {e.endTime ? ` → ${formatTime(e.endTime)}` : ""}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)", textAlign: "center" }}>
            Aucun événement aujourd'hui à cet emplacement.
          </p>
        )}

        {/* All events if no today's */}
        {todaysEvents.length === 0 && venue.events.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <p
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: "var(--fw-bold)",
                margin: 0,
              }}
            >
              Programme
            </p>
            {venue.events.slice(0, 5).map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-sm) var(--space-md)",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span style={{ color: "var(--text-main)", fontSize: "var(--fs-sm)" }}>
                  {e.title}
                </span>
                {e.startTime && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                    }}
                  >
                    {formatTime(e.startTime)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GPS Map (relative positions)
// ---------------------------------------------------------------------------

function GpsMap({
  venues,
  crewPositions,
  normalizedVenues,
  selectedVenueId,
  onSelectVenue,
  myPosition,
}: {
  venues: VenueWithEvents[];
  crewPositions: CrewMemberPosition[];
  normalizedVenues: Map<string, { x: number; y: number }>;
  selectedVenueId: string | null;
  onSelectVenue: (id: string) => void;
  myPosition: { lat: number; lng: number } | null;
}) {
  // Normalize crew positions using same bounding box
  const withCoords = venues.filter((v) => v.latitude != null && v.longitude != null);
  const lats = withCoords.map((v) => v.latitude as number);
  const lngs = withCoords.map((v) => v.longitude as number);
  const minLat = lats.length > 0 ? Math.min(...lats) : 0;
  const maxLat = lats.length > 0 ? Math.max(...lats) : 1;
  const minLng = lngs.length > 0 ? Math.min(...lngs) : 0;
  const maxLng = lngs.length > 0 ? Math.max(...lngs) : 1;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  function toXY(lat: number, lng: number) {
    return {
      x: ((lng - minLng) / lngRange) * 80 + 10,
      y: 100 - ((lat - minLat) / latRange) * 80 - 10,
    };
  }

  const myCoords = myPosition ? toXY(myPosition.lat, myPosition.lng) : null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: "80%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Grid lines (decorative) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}
        aria-hidden="true"
      >
        {[20, 40, 60, 80].map((pct) => (
          <g key={pct}>
            <line x1={`${pct}%`} y1="0" x2={`${pct}%`} y2="100%" stroke="white" strokeWidth="1" />
            <line x1="0" y1={`${pct}%`} x2="100%" y2={`${pct}%`} stroke="white" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* Venue pins */}
      {venues.map((v) => {
        const pos = normalizedVenues.get(v.id);
        if (!pos) return null;
        return (
          <VenuePin
            key={v.id}
            x={pos.x}
            y={pos.y}
            venue={v}
            isSelected={selectedVenueId === v.id}
            onSelect={() => onSelectVenue(v.id)}
          />
        );
      })}

      {/* Crew member pins */}
      {crewPositions.map((m) => {
        const pos = toXY(m.lat, m.lng);
        return <CrewPin key={m.userId} x={pos.x} y={pos.y} member={m} />;
      })}

      {/* My position */}
      {myCoords && (
        <div
          style={{
            position: "absolute",
            left: `${myCoords.x}%`,
            top: `${myCoords.y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 25,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--primary-neon)",
              border: "2px solid #fff",
              boxShadow: "var(--glow-neon)",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text list (fallback for venues without coords)
// ---------------------------------------------------------------------------

function TextList({
  venues,
  onSelectVenue,
  selectedVenueId,
}: {
  venues: VenueWithEvents[];
  onSelectVenue: (id: string) => void;
  selectedVenueId: string | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
      {venues.map((v) => {
        const isSelected = selectedVenueId === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelectVenue(v.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: isSelected ? "rgba(0,255,102,0.08)" : "var(--bg-card)",
              border: `1px solid ${isSelected ? "var(--primary-neon)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              cursor: "pointer",
              textAlign: "left",
              color: "var(--text-main)",
              transition: "var(--transition-fast)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <MapPin
                size={16}
                style={{
                  color: isSelected ? "var(--primary-neon)" : "var(--text-dim)",
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{ margin: 0, fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>
                  {v.name}
                </p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
                  {v.events.length} événement{v.events.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <ChevronDown size={16} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CarteView({ festivalName, mapImageUrl, venues, crewPositions }: CarteViewProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingMe, setTrackingMe] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) ?? null;

  // Normalize GPS positions for map
  const normalizedVenues = normalizePositions(venues);
  const hasGpsVenues = venues.some((v) => v.latitude != null && v.longitude != null);

  const mappedVenueCount = useMemo(() => countMappedVenues(venues), [venues]);
  const eventsOnMapCount = useMemo(() => countEventsOnMap(venues), [venues]);
  const visibleCrewCount = useMemo(() => countVisibleCrewMembers(crewPositions), [crewPositions]);

  const handleTogglePosition = useCallback(() => {
    if (trackingMe) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingMe(false);
      setMyPosition(null);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non disponible sur cet appareil.");
      return;
    }

    setTrackingMe(true);
    setGeoError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setMyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      () => {
        setGeoError("Impossible d'obtenir la position.");
        setTrackingMe(false);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }, [trackingMe]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        paddingTop: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      {/* Stats strip */}
      <div
        style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}
      >
        {mappedVenueCount > 0 && (
          <span
            data-testid="carte-mapped-venue-count"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
            }}
            title="Lieux avec coordonnées GPS sur la carte"
          >
            {mappedVenueCount} lieu{mappedVenueCount !== 1 ? "x" : ""} cartographié
            {mappedVenueCount !== 1 ? "s" : ""}
          </span>
        )}
        {eventsOnMapCount > 0 && (
          <>
            {mappedVenueCount > 0 && (
              <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            )}
            <span
              data-testid="carte-events-on-map"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
              }}
              title="Événements localisés sur la carte"
            >
              {eventsOnMapCount} événement{eventsOnMapCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
        {visibleCrewCount > 0 && (
          <>
            {(mappedVenueCount > 0 || eventsOnMapCount > 0) && (
              <span style={{ color: "var(--border-strong)", fontSize: "var(--fs-xs)" }}>·</span>
            )}
            <span
              data-testid="carte-visible-crew-count"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
              }}
              title="Membres du crew avec position partagée"
            >
              {visibleCrewCount} crew visible{visibleCrewCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* Header controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            color: "var(--text-main)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-sm)",
          }}
        >
          {venues.length} lieu{venues.length !== 1 ? "x" : ""}
        </span>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          {crewPositions.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "var(--fs-xs)",
                color: "var(--secondary-cyan)",
                background: "rgba(0,229,255,0.08)",
                border: "1px solid rgba(0,229,255,0.3)",
                borderRadius: "var(--radius-full)",
                padding: "3px 8px",
              }}
            >
              <Users size={12} />
              {crewPositions.length} crew
            </div>
          )}
          <button
            type="button"
            onClick={handleTogglePosition}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--fs-xs)",
              color: trackingMe ? "#000" : "var(--text-dim)",
              background: trackingMe ? "var(--primary-neon)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${trackingMe ? "var(--primary-neon)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-full)",
              padding: "3px 8px",
              cursor: "pointer",
              fontWeight: trackingMe ? "var(--fw-bold)" : "normal",
              transition: "var(--transition-fast)",
              boxShadow: trackingMe ? "var(--glow-neon)" : "none",
            }}
          >
            <Navigation size={12} />
            {trackingMe ? "Ma position ON" : "Ma position"}
          </button>
        </div>
      </div>

      {geoError && (
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--accent-orange)", margin: 0 }}>
          {geoError}
        </p>
      )}

      {/* Map area */}
      {mapImageUrl ? (
        // Image map with overlay pins
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapImageUrl}
            alt={`Plan de ${festivalName}`}
            style={{ width: "100%", display: "block" }}
          />
          {/* Overlay pins using GPS or skip if no coords */}
          {hasGpsVenues &&
            venues.map((v) => {
              const pos = normalizedVenues.get(v.id);
              if (!pos) return null;
              return (
                <VenuePin
                  key={v.id}
                  x={pos.x}
                  y={pos.y}
                  venue={v}
                  isSelected={selectedVenueId === v.id}
                  onSelect={() => setSelectedVenueId(v.id)}
                />
              );
            })}
        </div>
      ) : hasGpsVenues ? (
        // GPS dot map
        <GpsMap
          venues={venues}
          crewPositions={crewPositions}
          normalizedVenues={normalizedVenues}
          selectedVenueId={selectedVenueId}
          onSelectVenue={setSelectedVenueId}
          myPosition={myPosition}
        />
      ) : (
        // No coords: text list only
        <div
          style={{
            background: "rgba(255,153,0,0.06)",
            border: "1px solid rgba(255,153,0,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            fontSize: "var(--fs-xs)",
            color: "var(--accent-orange)",
          }}
        >
          Aucune coordonnée GPS disponible pour ce festival. La carte n'est pas encore disponible.
        </div>
      )}

      {/* Venue list */}
      {venues.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: "var(--fw-bold)",
              margin: 0,
            }}
          >
            Lieux
          </p>
          <TextList
            venues={venues}
            onSelectVenue={setSelectedVenueId}
            selectedVenueId={selectedVenueId}
          />
        </div>
      )}

      {venues.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl) var(--space-md)",
            color: "var(--text-dim)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <MapPin size={40} style={{ opacity: 0.3, margin: "0 auto var(--space-sm)" }} />
          <p>Aucun lieu disponible pour ce festival.</p>
        </div>
      )}

      {/* Venue bottom sheet */}
      {selectedVenue && (
        <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenueId(null)} />
      )}
    </div>
  );
}
