import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getAdminFestivals() {
  const [festivals, stats] = await Promise.all([
    prisma.festival.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        festivalType: true,
        startDate: true,
        endDate: true,
        ingestionStatus: true,
        confidenceLevel: true,
        city: true,
        country: true,
      },
    }),
    prisma.festival.groupBy({
      by: ["ingestionStatus"],
      _count: { id: true },
    }),
  ]);

  const statMap = new Map(stats.map((s) => [s.ingestionStatus, s._count.id]));

  return {
    festivals,
    total: festivals.length,
    détecté: statMap.get("détecté") ?? 0,
    vérifié: statMap.get("vérifié") ?? 0,
    enrichi: statMap.get("enrichi") ?? 0,
  };
}

export default async function AdminFestivalsPage() {
  const { festivals, total, détecté, vérifié, enrichi } = await getAdminFestivals();

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Festivals
        </h1>
        <Link
          href="/admin/festivals/new"
          style={{
            padding: "10px 20px",
            background: "var(--primary-neon)",
            color: "var(--text-on-neon)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textDecoration: "none",
          }}
        >
          + Nouveau
        </Link>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {[
          { label: "Total", value: total, color: "var(--text-main)" },
          { label: "Détectés", value: détecté, color: "var(--text-dim)" },
          { label: "Vérifiés", value: vérifié, color: "var(--primary-cyan)" },
          { label: "Enrichis", value: enrichi, color: "var(--primary-neon)" },
        ].map((s) => (
          <div
            key={s.label}
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
                fontSize: "var(--fs-2xl)",
                color: s.color,
                margin: 0,
                fontWeight: "var(--fw-bold)",
              }}
            >
              {s.value}
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
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-color)",
              }}
            >
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
                style={{
                  borderBottom:
                    i < festivals.length - 1 ? "1px solid var(--border-color)" : "none",
                }}
              >
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-main)",
                      margin: 0,
                      fontWeight: "var(--fw-bold)",
                    }}
                  >
                    {f.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                      margin: "2px 0 0",
                    }}
                  >
                    {f.slug}
                  </p>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {f.festivalType}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                    }}
                  >
                    {new Date(f.startDate).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(f.endDate).toLocaleDateString("fr-FR")}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <StatusBadge status={f.ingestionStatus} />
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color:
                        f.confidenceLevel === "vérifié_humain"
                          ? "var(--primary-neon)"
                          : "var(--text-dim)",
                    }}
                  >
                    {f.confidenceLevel}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
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
                    <VerifyButton slug={f.slug} currentStatus={f.ingestionStatus} />
                    <DeleteButton slug={f.slug} />
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
            Aucun festival dans la base.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    détecté: "var(--text-dim)",
    vérifié: "var(--primary-cyan)",
    enrichi: "var(--primary-neon)",
  };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${colors[status] ?? "var(--border-color)"}`,
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-xs)",
        color: colors[status] ?? "var(--text-dim)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {status}
    </span>
  );
}

function VerifyButton({ slug, currentStatus }: { slug: string; currentStatus: string }) {
  if (currentStatus === "vérifié" || currentStatus === "enrichi") return null;
  return (
    <form
      action={async () => {
        "use server";
        await prisma.festival.update({
          where: { slug },
          data: { ingestionStatus: "vérifié" },
        });
      }}
    >
      <button
        type="submit"
        style={{
          padding: "4px 10px",
          border: "1px solid var(--primary-cyan)",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          color: "var(--primary-cyan)",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Vérifier
      </button>
    </form>
  );
}

function DeleteButton({ slug }: { slug: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await prisma.festival.delete({ where: { slug } });
      }}
    >
      <button
        type="submit"
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
  );
}
