"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function FestivalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Festival page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span aria-hidden="true" style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>
        ⚡
      </span>
      <p className="t-h3" style={{ color: "var(--text-main)", marginBottom: 8, fontSize: "var(--fs-base)" }}>
        Impossible de charger ce festival
      </p>
      <p className="t-caption" style={{ color: "var(--text-muted)", maxWidth: 240, marginBottom: 24 }}>
        Une erreur est survenue. Réessaie ou retourne au catalogue.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Réessayer
        </button>
        <Link href="/catalogue" className="btn btn-ghost btn-sm inline-flex items-center gap-1">
          <ArrowLeft size={14} aria-hidden="true" />
          Catalogue
        </Link>
      </div>
    </div>
  );
}
