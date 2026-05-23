import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeNewsStats } from "@/lib/news-stats";
import { CreateNewsForm } from "./_components/create-news-form";

async function getNewsItems() {
  return prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      festival: { select: { name: true, slug: true } },
    },
  });
}

async function getFestivals() {
  return prisma.festival.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  "line-up": "Line-up",
  logistique: "Logistique",
  "programme-change": "Changement programme",
  annulation: "Annulation",
  urgence: "Urgence",
  autre: "Autre",
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X / Twitter",
  site_officiel: "Site officiel",
};

function getCategoryColor(category: string): string {
  switch (category) {
    case "urgence":
    case "annulation":
      return "var(--danger-red)";
    case "logistique":
      return "var(--warning-orange)";
    case "line-up":
      return "var(--secondary-cyan)";
    case "programme-change":
      return "var(--pink-accent, #FF007A)";
    default:
      return "var(--text-muted)";
  }
}

export default async function AdminNewsPage() {
  const [newsItems, festivals] = await Promise.all([getNewsItems(), getFestivals()]);

  // computeNewsStats expects urgencyLevel typed as "normal" | "critique"
  const statsInput = newsItems.map((item) => ({
    urgencyLevel: (item.urgencyLevel === "critique" ? "critique" : "normal") as
      | "normal"
      | "critique",
    isPinned: item.isPinned,
  }));
  const stats = computeNewsStats(statsInput);

  // Count by festival
  const festivalMap = new Map<string, { name: string; count: number }>();
  for (const item of newsItems) {
    const existing = festivalMap.get(item.festivalId);
    if (existing) {
      existing.count++;
    } else {
      festivalMap.set(item.festivalId, { name: item.festival.name, count: 1 });
    }
  }
  const festivalsCount = festivalMap.size;

  const kpis = [
    {
      label: "Total news",
      value: stats.total,
      color: "var(--secondary-cyan)",
      testid: "admin-news-kpi-total",
    },
    {
      label: "Festivals couverts",
      value: festivalsCount,
      color: "var(--primary-neon)",
      testid: "admin-news-kpi-festivals",
    },
    {
      label: "Critiques",
      value: stats.critiques,
      color: "var(--danger-red)",
      testid: "admin-news-kpi-critiques",
    },
    {
      label: "Épinglées",
      value: stats.pinned,
      color: "var(--warning-orange)",
      testid: "admin-news-kpi-pinned",
    },
  ];

  return (
    <div>
      <h1
        data-testid="admin-news-title"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-lg)",
        }}
      >
        News &amp; Annonces
      </h1>

      <CreateNewsForm festivals={festivals} />

      {/* KPIs */}
      <div
        data-testid="admin-news-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            data-testid={kpi.testid}
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
                color: kpi.color,
                margin: 0,
                fontWeight: "var(--fw-bold)",
              }}
            >
              {kpi.value}
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
              {kpi.label}
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
        {newsItems.length > 0 ? (
          <table
            data-testid="admin-news-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                {["Résumé", "Festival", "Source", "Catégorie", "Urgence", "Date", "Actions"].map(
                  (h) => (
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {newsItems.map((item, i) => {
                const categoryColor = getCategoryColor(item.category);
                const isUrgent = item.urgencyLevel === "critique";

                return (
                  <tr
                    key={item.id}
                    data-testid={`admin-news-row-${item.id}`}
                    style={{
                      borderBottom:
                        i < newsItems.length - 1
                          ? "1px solid var(--border-color)"
                          : "none",
                    }}
                  >
                    {/* Résumé */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)", maxWidth: 300 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                        {item.isPinned && (
                          <span
                            title="Épinglée"
                            style={{
                              fontSize: "var(--fs-xs)",
                              color: "var(--warning-orange)",
                              flexShrink: 0,
                            }}
                          >
                            ★
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--fs-sm)",
                            color: "var(--text-main)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 260,
                            display: "block",
                          }}
                          title={item.summary}
                        >
                          {item.summary.length > 80
                            ? `${item.summary.slice(0, 80)}…`
                            : item.summary}
                        </span>
                      </div>
                    </td>

                    {/* Festival */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--fs-sm)",
                          color: "var(--secondary-cyan)",
                        }}
                      >
                        {item.festival.name}
                      </span>
                    </td>

                    {/* Source */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--fs-xs)",
                            color: "var(--text-muted)",
                            textDecoration: "none",
                          }}
                        >
                          {SOURCE_LABELS[item.source] ?? item.source}
                        </a>
                      ) : (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--fs-xs)",
                            color: "var(--text-dim)",
                          }}
                        >
                          {SOURCE_LABELS[item.source] ?? item.source}
                        </span>
                      )}
                    </td>

                    {/* Catégorie */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: `1px solid ${categoryColor}`,
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--fs-xs)",
                          color: categoryColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </td>

                    {/* Urgence */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                      {isUrgent ? (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--danger-red)",
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--fs-xs)",
                            color: "#fff",
                            fontWeight: "var(--fw-bold)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Critique
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--fs-xs)",
                            color: "var(--text-dim)",
                          }}
                        >
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--fs-xs)",
                          color: "var(--text-dim)",
                        }}
                      >
                        {new Date(item.publishedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                      <DeleteButton id={item.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div
            data-testid="admin-news-table"
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Aucune news enregistrée.
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  async function deleteNews() {
    "use server";
    await prisma.newsItem.delete({ where: { id } });
    revalidatePath("/admin/news");
  }

  return (
    <form action={deleteNews}>
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
