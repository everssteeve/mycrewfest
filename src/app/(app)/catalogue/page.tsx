import Link from "next/link";
import { Suspense } from "react";
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
        }
      />

      <Suspense fallback={<CatalogueSkeleton />}>
        <CatalogueContent />
      </Suspense>
    </>
  );
}
