import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SoumettreForm } from "./_components/soumettre-form";

export const metadata: Metadata = {
  title: "Soumettre un festival",
};

export default function SoumettreePage() {
  return (
    <div className="flex flex-col gap-0 py-4">
      {/* Back nav */}
      <div style={{ paddingBottom: "var(--space-md)" }}>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-1 t-caption"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Catalogue
        </Link>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          padding: "var(--space-lg)",
        }}
      >
        <h1
          className="t-h2"
          style={{
            color: "var(--text-main)",
            marginBottom: "var(--space-sm)",
            fontSize: "var(--fs-xl)",
          }}
        >
          Festival manquant ?
        </h1>
        <p
          className="t-caption"
          style={{ color: "var(--text-muted)", marginBottom: "var(--space-lg)" }}
        >
          Dis-nous lequel et on s'en occupe.
        </p>

        <SoumettreForm />
      </div>
    </div>
  );
}
