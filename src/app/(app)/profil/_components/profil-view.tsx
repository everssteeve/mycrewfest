"use client";

import { useCallback, useState, useTransition } from "react";
import { Edit3, LogOut, Trash2, Download, Bell } from "lucide-react";
import { signOut } from "next-auth/react";
import { useAppStore } from "@/store/use-app-store";
import Link from "next/link";
import { PushToggle } from "@/components/notifications/push-toggle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FestivalRef {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
}

interface FestEventRef {
  id: string;
  mode: string;
  createdAt: string;
  festival: FestivalRef;
}

export interface ProfilData {
  id: string;
  email: string;
  name: string | null;
  pseudo: string | null;
  photo: string | null;
  createdAt: string;
  stats: {
    festEventsCount: number;
    followedFestivalsCount: number;
    souvenirsCount: number;
    vuCount: number;
  };
  festEvents: FestEventRef[];
  followedFestivals: FestivalRef[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFestDate(startDate: string, endDate: string): string {
  try {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${s.toLocaleDateString("fr-FR", opts)} – ${e.toLocaleDateString("fr-FR", opts)} ${e.getFullYear()}`;
  } catch {
    return "";
  }
}

function isPast(endDate: string): boolean {
  try {
    return new Date(endDate) < new Date();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Inline edit form
// ---------------------------------------------------------------------------

interface InlineEditProps {
  initialName: string;
  initialPseudo: string;
  onSave: (name: string, pseudo: string) => void;
  onCancel: () => void;
}

function InlineEditForm({ initialName, initialPseudo, onSave, onCancel }: InlineEditProps) {
  const [name, setName] = useState(initialName);
  const [pseudo, setPseudo] = useState(initialPseudo);
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, pseudo }),
        });
        if (!res.ok) throw new Error("Erreur serveur");
        onSave(name, pseudo);
      } catch {
        alert("Impossible de sauvegarder les modifications.");
      } finally {
        setSaving(false);
      }
    },
    [name, pseudo, onSave],
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div>
        <label
          htmlFor="profile-name"
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          Nom
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          style={{
            width: "100%",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
            padding: "8px 12px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="profile-pseudo"
          style={{
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          Pseudo
        </label>
        <input
          id="profile-pseudo"
          type="text"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          maxLength={50}
          style={{
            width: "100%",
            background: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-base)",
            padding: "8px 12px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--primary-neon)",
            color: "var(--text-on-neon)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving ? "..." : "Sauvegarder"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ProfilView
// ---------------------------------------------------------------------------

export function ProfilView({ data }: { data: ProfilData }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.name ?? "");
  const [pseudo, setPseudo] = useState(data.pseudo ?? "");
  const [isPending, startTransition] = useTransition();

  const festivalMode = useAppStore((s) => s.festivalMode);
  const setFestivalMode = useAppStore((s) => s.setFestivalMode);

  const handleSave = useCallback((newName: string, newPseudo: string) => {
    setName(newName);
    setPseudo(newPseudo);
    setEditing(false);
  }, []);

  const handleUnfollow = useCallback((slug: string) => {
    startTransition(async () => {
      try {
        await fetch(`/api/festivals/${slug}/follow`, { method: "DELETE" });
        // Reload to reflect change
        window.location.reload();
      } catch {
        // Silently fail
      }
    });
  }, []);

  const handleDeleteAccount = useCallback(() => {
    const confirmed = confirm(
      "Supprimer définitivement ton compte ? Cette action est irréversible. Toutes tes données seront effacées.",
    );
    if (!confirmed) return;

    const doubleConfirm = confirm("Dernière confirmation : supprimer le compte ?");
    if (!doubleConfirm) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/user", { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur serveur");
        await signOut({ callbackUrl: "/" });
      } catch {
        alert("Impossible de supprimer le compte. Réessaie plus tard.");
      }
    });
  }, []);

  const displayName = pseudo || name || data.email;
  const initiale = (pseudo || name || data.email).charAt(0).toUpperCase();

  const upcomingFestEvents = data.festEvents.filter(
    (fe) => !isPast(fe.festival.endDate),
  );
  const pastFestEvents = data.festEvents.filter((fe) =>
    isPast(fe.festival.endDate),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-3xl)",
      }}
    >
      {/* === Avatar + nom === */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-md)",
          paddingTop: "var(--space-lg)",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius-full)",
            background: "var(--neon-soft)",
            border: "2px solid var(--primary-neon)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {data.photo ? (
            // biome-ignore lint/performance/noImgElement: avatar doesn't need next/image
            <img
              src={data.photo}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-2xl)",
                color: "var(--primary-neon)",
                textTransform: "uppercase",
              }}
            >
              {initiale}
            </span>
          )}
        </div>

        {/* Name + email */}
        {!editing && (
          <>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-lg)",
                  color: "var(--text-main)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                {displayName}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-dim)",
                  margin: "4px 0 0",
                }}
              >
                {data.email}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                fontWeight: "var(--fw-bold)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              <Edit3 size={14} />
              Modifier le profil
            </button>
          </>
        )}

        {editing && (
          <div style={{ width: "100%", maxWidth: 340 }}>
            <InlineEditForm
              initialName={name}
              initialPseudo={pseudo}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}
      </section>

      {/* === Stats === */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "var(--space-sm)",
        }}
        data-testid="profil-stats"
      >
        {[
          { label: "Festivals", value: data.stats.festEventsCount },
          { label: "Événements vus", value: data.stats.vuCount },
          { label: "Festivals suivis", value: data.stats.followedFestivalsCount },
          { label: "Souvenirs", value: data.stats.souvenirsCount },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xl)",
                color: "var(--primary-neon)",
                margin: 0,
                fontWeight: "var(--fw-bold)",
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "4px 0 0",
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* === Mes festivals === */}
      {data.festEvents.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 var(--space-sm)",
            }}
          >
            Mes festivals
          </h2>

          {upcomingFestEvents.length > 0 && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 var(--space-sm)",
                }}
              >
                À venir
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-xs)",
                  marginBottom: "var(--space-md)",
                }}
              >
                {upcomingFestEvents.map((fe) => (
                  <Link
                    key={fe.id}
                    href={`/festevent/${fe.id}/programme`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-sm) var(--space-md)",
                      textDecoration: "none",
                      transition: "var(--transition-fast)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-main)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {fe.festival.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                      }}
                    >
                      {fe.festival.city} ·{" "}
                      {formatFestDate(fe.festival.startDate, fe.festival.endDate)}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {pastFestEvents.length > 0 && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "0 0 var(--space-sm)",
                }}
              >
                Passés
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                {pastFestEvents.map((fe) => (
                  <Link
                    key={fe.id}
                    href={`/festevent/${fe.id}/journal`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-sm) var(--space-md)",
                      textDecoration: "none",
                      opacity: 0.7,
                      transition: "var(--transition-fast)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {fe.festival.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                      }}
                    >
                      {fe.festival.city} ·{" "}
                      {formatFestDate(fe.festival.startDate, fe.festival.endDate)}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* === Festivals suivis === */}
      {data.followedFestivals.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 var(--space-sm)",
            }}
          >
            Festivals suivis
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {data.followedFestivals.map((fest) => (
              <div
                key={fest.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-sm) var(--space-md)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-main)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}
                  >
                    {fest.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                      margin: "2px 0 0",
                    }}
                  >
                    {fest.city} · {formatFestDate(fest.startDate, fest.endDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnfollow(fest.slug)}
                  disabled={isPending}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    cursor: "pointer",
                    padding: "4px 10px",
                    flexShrink: 0,
                  }}
                >
                  Se désabonner
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === Paramètres === */}
      <section>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "0 0 var(--space-sm)",
          }}
        >
          Paramètres
        </h2>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {/* Push notifications toggle */}
          <PushToggle />

          {/* Festival Mode toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-md)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <Bell size={16} style={{ color: "var(--text-muted)" }} />
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-main)",
                    margin: 0,
                    fontWeight: "var(--fw-bold)",
                  }}
                >
                  Festival Mode
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-dim)",
                    margin: "2px 0 0",
                  }}
                >
                  Regroupe les notifications
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={festivalMode}
              onClick={() => setFestivalMode(!festivalMode)}
              style={{
                width: 44,
                height: 24,
                borderRadius: "var(--radius-full)",
                border: "none",
                background: festivalMode ? "var(--primary-neon)" : "var(--border-color)",
                position: "relative",
                cursor: "pointer",
                transition: "var(--transition-fast)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: festivalMode ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "var(--radius-full)",
                  background: festivalMode ? "var(--text-on-neon)" : "var(--text-dim)",
                  transition: "var(--transition-fast)",
                }}
              />
            </button>
          </div>

          {/* Export data */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-md)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <Download size={16} style={{ color: "var(--text-muted)" }} />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-main)",
                  margin: 0,
                }}
              >
                Export de données
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert("Export en cours de développement.")}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                cursor: "pointer",
                padding: "4px 10px",
              }}
            >
              Exporter ZIP
            </button>
          </div>

          {/* Sign out */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-md)",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <LogOut size={16} style={{ color: "var(--text-muted)" }} />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--text-main)",
                  margin: 0,
                }}
              >
                Se déconnecter
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                cursor: "pointer",
                padding: "4px 10px",
              }}
            >
              Déconnexion
            </button>
          </div>

          {/* Delete account */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <Trash2 size={16} style={{ color: "var(--danger-red)" }} />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-sm)",
                  color: "var(--danger-red)",
                  margin: 0,
                }}
              >
                Supprimer mon compte
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isPending}
              style={{
                background: "none",
                border: "1px solid var(--danger-red)",
                borderRadius: "var(--radius-sm)",
                color: "var(--danger-red)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                fontWeight: "var(--fw-bold)",
                cursor: isPending ? "wait" : "pointer",
                padding: "4px 10px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
