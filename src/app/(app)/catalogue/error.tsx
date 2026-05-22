"use client";

import { useEffect } from "react";
import { TopHeader } from "@/components/ui";

export default function CatalogueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Catalogue error:", error);
  }, [error]);

  return (
    <>
      <TopHeader title="FESTIVALS" />
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span
          aria-hidden="true"
          style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}
        >
          ⚡
        </span>
        <p
          className="t-h3"
          style={{
            color: "var(--text-main)",
            marginBottom: 8,
            fontSize: "var(--fs-base)",
          }}
        >
          Erreur de chargement
        </p>
        <p
          className="t-caption"
          style={{ color: "var(--text-muted)", maxWidth: 240, marginBottom: 24 }}
        >
          Impossible de charger les festivals. Vérifie ta connexion et réessaie.
        </p>
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Réessayer
        </button>
      </div>
    </>
  );
}
