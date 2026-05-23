import Link from "next/link";
import { Suspense } from "react";
import { Search, Sparkles, Trophy } from "lucide-react";
import { TopHeader } from "@/components/ui";
import { CatalogueContent } from "./_components/catalogue-content";
import { CatalogueSkeleton } from "./_components/catalogue-skeleton";

export const metadata = {
  title: "Festivals",
};

export default function CataloguePage() {
  return (
    <>
      <TopHeader
        title="FESTIVALS"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/palmares"
              aria-label="Palmarès des festivals"
              data-testid="catalogue-palmares-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-strong)",
                color: "var(--warning-orange)",
                textDecoration: "none",
              }}
            >
              <Trophy size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/recommandations"
              aria-label="Recommandations pour toi"
              data-testid="catalogue-recommendations-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-strong)",
                color: "var(--primary-neon)",
                textDecoration: "none",
              }}
            >
              <Sparkles size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/recherche"
              aria-label="Recherche globale"
              data-testid="catalogue-search-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              <Search size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/festival/soumettre"
              aria-label="Soumettre un festival manquant"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary-neon)",
                color: "var(--text-on-neon)",
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 900,
                lineHeight: 1,
                boxShadow: "var(--glow-neon)",
                textDecoration: "none",
              }}
            >
              +
            </Link>
          </div>
        }
      />

      <Suspense fallback={<CatalogueSkeleton />}>
        <CatalogueContent />
      </Suspense>
    </>
  );
}
