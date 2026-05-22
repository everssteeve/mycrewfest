"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export function SoumettreForm() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/festival-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, officialUrl: url }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Erreur réseau. Vérifie ta connexion et réessaie.");
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle
          size={48}
          aria-hidden="true"
          style={{ color: "var(--primary-neon)", marginBottom: 16 }}
        />
        <p
          className="t-h3"
          style={{
            color: "var(--primary-neon)",
            marginBottom: 8,
            fontSize: "var(--fs-base)",
          }}
        >
          Soumission envoyée !
        </p>
        <p
          className="t-caption"
          style={{ color: "var(--text-muted)", maxWidth: 260 }}
        >
          Merci ! On va vérifier ça et l'ajouter au catalogue prochainement.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "var(--bg-darker)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-main)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--fs-sm)",
    outline: "none",
    transition: "var(--transition-fast)",
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="festival-name"
          className="t-meta"
          style={{ color: "var(--text-muted)" }}
        >
          Nom du festival
        </label>
        <input
          id="festival-name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Les Tombées de la Nuit"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary-neon)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,255,102,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="festival-url"
          className="t-meta"
          style={{ color: "var(--text-muted)" }}
        >
          URL officielle
        </label>
        <input
          id="festival-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary-neon)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,255,102,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {error && (
        <p
          className="t-caption"
          role="alert"
          style={{ color: "var(--danger-red)" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary mt-2"
        style={{ width: "100%" }}
      >
        {loading ? "Envoi en cours…" : "Soumettre le festival"}
      </button>
    </form>
  );
}
