"use client";

import { useTransition } from "react";
import {
  type AdminSignalRow,
  formatSignalExpiry,
  formatSignalScope,
  getSignalScopeColor,
  isSignalExpired,
  resolveSignalAuthorName,
  resolveSignalLabel,
} from "@/lib/admin-signals";

interface Props {
  signals: AdminSignalRow[];
}

export function SignalsTable({ signals }: Props) {
  const now = new Date();

  if (signals.length === 0) {
    return (
      <div
        style={{
          padding: "var(--space-2xl)",
          textAlign: "center",
          color: "var(--text-dim)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm)",
        }}
      >
        Aucun signal communautaire actif.
      </div>
    );
  }

  return (
    <table data-testid="admin-signals-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
          {["Portée", "Signal", "Auteur", "Festival", "Crédibilité", "Expiration", "Actions"].map(
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
        {signals.map((signal, i) => (
          <SignalRow key={signal.id} signal={signal} now={now} isLast={i === signals.length - 1} />
        ))}
      </tbody>
    </table>
  );
}

function SignalRow({
  signal,
  now,
  isLast,
}: {
  signal: AdminSignalRow;
  now: Date;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const expired = isSignalExpired(signal.expiresAt, now);
  const scopeColor = getSignalScopeColor(signal.scope);
  const label = resolveSignalLabel(signal);
  const authorName = resolveSignalAuthorName(signal.author);
  const expiryLabel = formatSignalExpiry(signal.expiresAt, now);

  function handleDelete() {
    if (!confirm(`Supprimer ce signal ? "${label}"`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/signals/${signal.id}`, { method: "DELETE" });
      window.location.reload();
    });
  }

  return (
    <tr
      data-testid={`admin-signal-row-${signal.id}`}
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--border-color)",
        opacity: expired ? 0.5 : 1,
      }}
    >
      <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            border: `1px solid ${scopeColor}`,
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: scopeColor,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {formatSignalScope(signal.scope)}
        </span>
      </td>
      <td style={{ padding: "var(--space-sm) var(--space-md)", maxWidth: 240 }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-main)",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </td>
      <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
          }}
        >
          {authorName}
        </span>
      </td>
      <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
          }}
        >
          {signal.festival?.name ?? "—"}
        </span>
      </td>
      <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ color: "var(--primary-neon)" }}>+{signal.confirmations}</span>
          {" / "}
          <span style={{ color: "var(--danger-red)" }}>-{signal.infirmations}</span>
        </span>
      </td>
      <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: expired ? "var(--danger-red)" : "var(--text-muted)",
          }}
        >
          {expiryLabel}
        </span>
      </td>
      <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
        <button
          type="button"
          data-testid={`admin-signal-delete-${signal.id}`}
          onClick={handleDelete}
          disabled={isPending}
          style={{
            padding: "4px 10px",
            border: "1px solid var(--danger-red)",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-xs)",
            color: "var(--danger-red)",
            cursor: isPending ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "…" : "Supprimer"}
        </button>
      </td>
    </tr>
  );
}
