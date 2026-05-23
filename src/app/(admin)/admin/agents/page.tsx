"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Generic agent form
// ---------------------------------------------------------------------------

interface AgentResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

function AgentCard({
  title,
  description,
  endpoint,
  fields,
  accentColor,
}: {
  title: string;
  description: string;
  endpoint: string;
  fields: { name: string; label: string; placeholder?: string }[];
  accentColor: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setResult({ ok: res.ok, data });
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${accentColor}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-xl)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-lg)",
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 var(--space-xs)",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm)",
          color: "var(--text-muted)",
          margin: "0 0 var(--space-lg)",
        }}
      >
        {description}
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}
      >
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              {field.label}
            </label>
            <input
              id={field.name}
              type="text"
              value={values[field.name] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.placeholder}
              style={{
                width: "100%",
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-main)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-base)",
                padding: "8px 12px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "var(--space-sm)",
            padding: "10px 24px",
            background: loading ? "var(--bg-surface-elevated)" : accentColor,
            border: "none",
            borderRadius: "var(--radius-md)",
            color: loading ? "var(--text-muted)" : "#000",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "En cours..." : "Simuler"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "var(--space-md)",
            padding: "var(--space-md)",
            background: "var(--bg-darker)",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${result.ok ? accentColor : "var(--danger-red)"}`,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: result.ok ? accentColor : "var(--danger-red)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 var(--space-xs)",
            }}
          >
            {result.ok ? "Succès" : "Erreur"}
          </p>
          <pre
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {JSON.stringify(result.data ?? result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminAgentsPage() {
  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-xl)",
        }}
      >
        Agents IA — Simulation SYS-01
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
        <AgentCard
          title="Agent 1 — Détection"
          description="Simule l'extraction automatique d'un site festival. Fournit une URL et l'agent retourne les données structurées extraites."
          endpoint="/api/admin/agents/detect"
          accentColor="var(--primary-cyan)"
          fields={[
            {
              name: "url",
              label: "URL du site festival",
              placeholder: "https://www.exemple-festival.fr",
            },
          ]}
        />

        <AgentCard
          title="Agent 2 — Ingestion programme"
          description="Simule le parsing du programme d'un festival. Lance la création d'événements mock en base pour permettre les tests."
          endpoint="/api/admin/agents/ingest"
          accentColor="var(--primary-pink)"
          fields={[
            {
              name: "festivalId",
              label: "Festival ID",
              placeholder: "cuid du festival",
            },
          ]}
        />

        <AgentCard
          title="Agent 3 — Monitoring social"
          description="Simule la surveillance des réseaux sociaux. Crée une NewsItem avec source 'x' et catégorie 'line-up' pour le festival ciblé."
          endpoint="/api/admin/agents/monitor"
          accentColor="var(--warning-orange)"
          fields={[
            {
              name: "festivalId",
              label: "Festival ID",
              placeholder: "cuid du festival",
            },
          ]}
        />
      </div>
    </div>
  );
}
