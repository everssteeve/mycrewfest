import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import { formatFestivalTypeLabel } from "@/lib/trending-festivals";
import type { TrendingFestivalItem } from "@/lib/trending-festivals";

async function fetchTrending(): Promise<TrendingFestivalItem[]> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/festivals/trending?limit=3`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: TrendingFestivalItem[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function TrendingFestivals() {
  const festivals = await fetchTrending();
  if (festivals.length === 0) return null;

  return (
    <section
      data-testid="trending-festivals-section"
      style={{ marginBottom: "var(--space-md)" }}
    >
      <h2
        className="t-mono"
        style={{
          color: "var(--text-dim)",
          fontSize: "var(--fs-xs, 11px)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "var(--space-xs)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <TrendingUp size={12} aria-hidden="true" />
        Tendances
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {festivals.map((f) => (
          <Link
            key={f.id}
            href={`/festival/${f.slug}`}
            data-testid={`trending-festival-${f.slug}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              textDecoration: "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                className="t-body"
                style={{
                  color: "var(--text-main)",
                  fontWeight: 600,
                  fontSize: "var(--fs-sm)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {f.name}
              </p>
              <p
                className="t-caption"
                style={{ color: "var(--text-dim)", fontSize: "var(--fs-xs, 11px)" }}
              >
                {f.city} · {format(new Date(f.startDate), "d MMM yyyy", { locale: fr })}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span
                className="t-meta"
                style={{
                  color: "var(--secondary-cyan)",
                  fontSize: "var(--fs-xs, 10px)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {formatFestivalTypeLabel(f.festivalType)}
              </span>
              {f.followerCount > 0 && (
                <span
                  className="t-mono"
                  style={{
                    color: "var(--primary-neon)",
                    fontSize: "var(--fs-xs, 10px)",
                    fontWeight: 700,
                  }}
                >
                  {f.followerCount}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
