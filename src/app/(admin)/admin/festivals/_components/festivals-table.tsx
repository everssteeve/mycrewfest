"use client";

import Link from "next/link";
import { verifyFestival, deleteFestival } from "../actions";
import { FeaturedToggle } from "./featured-toggle";

interface Festival {
  id: string;
  name: string;
  slug: string;
  festivalType: string;
  startDate: string | Date;
  endDate: string | Date;
  ingestionStatus: string;
  confidenceLevel: string;
  isFeatured: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  détecté: "var(--text-dim)",
  vérifié: "var(--secondary-cyan)",
  enrichi: "var(--primary-neon)",
};

export function FestivalsTable({ festivals }: { festivals: Festival[] }) {
  return (
    <div
      data-testid="admin-festivals-table"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
            {["Nom", "Type", "Dates", "Statut ingestion", "Confidence", "Actions"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "var(--space-sm) var(--space-md)",
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {festivals.map((f, i) => (
            <tr
              key={f.id}
              data-testid={`admin-festival-row-${f.id}`}
              style={{
                borderBottom: i < festivals.length - 1 ? "1px solid var(--border-color)" : "none",
              }}
            >
              <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-main)", margin: 0, fontWeight: "var(--fw-bold)" }}>
                  {f.name}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-dim)", margin: "2px 0 0" }}>
                  {f.slug}
                </p>
              </td>
              <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {f.festivalType}
                </span>
              </td>
              <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
                  {new Date(f.startDate).toLocaleDateString("fr-FR")} →{" "}
                  {new Date(f.endDate).toLocaleDateString("fr-FR")}
                </span>
              </td>
              <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${STATUS_COLORS[f.ingestionStatus] ?? "var(--border-color)"}`,
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: STATUS_COLORS[f.ingestionStatus] ?? "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {f.ingestionStatus}
                </span>
              </td>
              <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: f.confidenceLevel === "vérifié_humain" ? "var(--primary-neon)" : "var(--text-dim)",
                  }}
                >
                  {f.confidenceLevel}
                </span>
              </td>
              <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                  <FeaturedToggle festivalId={f.id} isFeatured={f.isFeatured} />
                  <Link
                    href={`/admin/festivals/${f.slug}/edit`}
                    style={{
                      padding: "4px 10px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Éditer
                  </Link>
                  {f.ingestionStatus !== "vérifié" && f.ingestionStatus !== "enrichi" && (
                    <form action={verifyFestival.bind(null, f.slug)}>
                      <button
                        type="submit"
                        data-testid={`admin-festival-verify-${f.id}`}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid var(--secondary-cyan)",
                          borderRadius: "var(--radius-sm)",
                          background: "transparent",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--fs-xs)",
                          color: "var(--secondary-cyan)",
                          cursor: "pointer",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Vérifier
                      </button>
                    </form>
                  )}
                  <form action={deleteFestival.bind(null, f.slug)}>
                    <button
                      type="submit"
                      data-testid={`admin-festival-delete-${f.id}`}
                      style={{
                        padding: "4px 10px",
                        border: "1px solid var(--danger-red)",
                        borderRadius: "var(--radius-sm)",
                        background: "transparent",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--danger-red)",
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {festivals.length === 0 && (
        <div
          style={{
            padding: "var(--space-2xl)",
            textAlign: "center",
            color: "var(--text-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
          }}
        >
          Aucun festival ne correspond aux filtres.
        </div>
      )}
    </div>
  );
}
