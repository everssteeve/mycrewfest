"use client";

import { Download } from "lucide-react";
import { useCallback, useState } from "react";

interface ExportButtonProps {
  apiPath: string;
  filename: string;
  testId: string;
}

export function ExportButton({ apiPath, filename, testId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath);
      if (!res.ok) {
        setError("Erreur lors de l'export");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [apiPath, filename]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        data-testid={testId}
        aria-label={`Télécharger ${filename}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: loading ? "transparent" : "var(--primary-neon, #00FF66)",
          color: loading ? "var(--primary-neon, #00FF66)" : "#000",
          border: "1px solid var(--primary-neon, #00FF66)",
          borderRadius: 8,
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          transition: "opacity 0.15s",
          opacity: loading ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        <Download size={14} />
        {loading ? "Génération…" : "CSV"}
      </button>
      {error && (
        <span style={{ fontSize: "0.7rem", color: "var(--danger-red, #FF3355)" }}>{error}</span>
      )}
    </div>
  );
}
