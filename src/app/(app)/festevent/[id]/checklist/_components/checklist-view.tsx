"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckSquare, Square, Plus, Trash2, Package, X, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChecklistItemData {
  id: string;
  label: string;
  done: boolean;
  cost: number | null;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  items: string[];
}

interface ChecklistViewProps {
  festEventId: string;
  initialItems: ChecklistItemData[];
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatCost(cost: number): string {
  return `${cost.toFixed(0)} €`;
}

// ---------------------------------------------------------------------------
// Template Modal
// ---------------------------------------------------------------------------

function TemplateModal({
  templates,
  onClose,
  onApply,
}: {
  templates: ChecklistTemplate[];
  onClose: () => void;
  onApply: (items: string[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selected) ?? null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          width: "100%",
          maxWidth: "var(--max-content)",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-lg)",
          gap: "var(--space-md)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2
            className="t-h3"
            style={{ color: "var(--primary-neon)", textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Templates
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: "var(--text-dim)", fontSize: "var(--fs-sm)" }}>
          Sélectionne un template pour importer des items dans ta checklist.
        </p>

        {/* Template list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(selected === t.id ? null : t.id)}
              style={{
                background: selected === t.id ? "rgba(0,255,102,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selected === t.id ? "var(--primary-neon)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text-main)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>
                  {t.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-dim)", fontSize: "var(--fs-xs)" }}>
                  <span>{t.items.length} items</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: selected === t.id ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </div>
              </div>
              {selected === t.id && (
                <ul style={{ margin: "var(--space-xs) 0 0 0", padding: "0 0 0 var(--space-md)", color: "var(--text-dim)", fontSize: "var(--fs-xs)" }}>
                  {t.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>{item}</li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!selectedTemplate}
          onClick={() => {
            if (selectedTemplate) {
              onApply(selectedTemplate.items);
              onClose();
            }
          }}
          style={{
            background: selectedTemplate ? "var(--primary-neon)" : "rgba(255,255,255,0.08)",
            color: selectedTemplate ? "#000" : "var(--text-dim)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-sm)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: selectedTemplate ? "pointer" : "not-allowed",
            transition: "var(--transition-fast)",
          }}
        >
          Importer ce template
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChecklistView({ festEventId, initialItems }: ChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItemData[]>(initialItems);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const baseUrl = `/api/festevents/${festEventId}/checklist`;

  // Computed stats
  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const totalCost = items.reduce((sum, i) => sum + (i.cost ?? 0), 0);

  // Load templates on demand
  const loadTemplates = useCallback(async () => {
    if (templates.length > 0) return;
    try {
      const res = await fetch("/api/checklist-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data as ChecklistTemplate[]);
      }
    } catch {
      // silently ignore
    }
  }, [templates.length]);

  const handleToggle = useCallback(
    (item: ChecklistItemData) => {
      const optimistic = !item.done;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, done: optimistic } : i)),
      );

      startTransition(async () => {
        try {
          const res = await fetch(`${baseUrl}/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: optimistic }),
          });
          if (!res.ok) {
            // Revert
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)),
            );
          } else {
            const updated = await res.json() as ChecklistItemData;
            setItems((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i)),
            );
          }
        } catch {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)),
          );
        }
      });
    },
    [baseUrl],
  );

  const handleDelete = useCallback(
    (itemId: string) => {
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      startTransition(async () => {
        try {
          const res = await fetch(`${baseUrl}/${itemId}`, { method: "DELETE" });
          if (!res.ok) {
            // Re-fetch to restore
            const freshRes = await fetch(baseUrl);
            if (freshRes.ok) {
              const fresh = await freshRes.json();
              setItems(fresh as ChecklistItemData[]);
            }
          }
        } catch {
          // silently ignore
        }
      });
    },
    [baseUrl],
  );

  const handleAdd = useCallback(async () => {
    const label = newLabel.trim();
    if (!label) return;

    const cost = newCost ? parseFloat(newCost) : null;
    const assigneeName = newAssignee.trim() || null;

    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, cost, assigneeName }),
      });
      if (!res.ok) {
        const errData = await res.json() as { error: string };
        setError(errData.error ?? "Erreur lors de l'ajout.");
        return;
      }
      const created = await res.json() as ChecklistItemData;
      setItems((prev) => [...prev, created]);
      setNewLabel("");
      setNewCost("");
      setNewAssignee("");
      setShowAddForm(false);
      setError(null);
    } catch {
      setError("Erreur réseau lors de l'ajout.");
    }
  }, [baseUrl, newLabel, newCost, newAssignee]);

  const handleApplyTemplate = useCallback(
    async (templateItems: string[]) => {
      // Create all items in parallel
      const results = await Promise.allSettled(
        templateItems.map((label) =>
          fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label }),
          }).then((r) => r.json() as Promise<ChecklistItemData>),
        ),
      );

      const created: ChecklistItemData[] = results
        .filter((r): r is PromiseFulfilledResult<ChecklistItemData> => r.status === "fulfilled")
        .map((r) => r.value);

      setItems((prev) => [...prev, ...created]);
    },
    [baseUrl],
  );

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ paddingTop: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Header stats */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-main)", fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>
            {completedCount} / {totalCount} complétés
          </span>
          {totalCost > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: "var(--primary-neon)",
                background: "rgba(0,255,102,0.08)",
                border: "1px solid var(--primary-neon)",
                borderRadius: "var(--radius-full)",
                padding: "2px 10px",
              }}
            >
              {formatCost(totalCost)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressPct === 100 ? "var(--primary-neon)" : "var(--secondary-cyan)",
              borderRadius: 2,
              transition: "width 0.3s ease",
              boxShadow: progressPct === 100 ? "var(--glow-neon)" : "none",
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-xs)",
            background: "var(--primary-neon)",
            color: "#000",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          Ajouter
        </button>
        <button
          type="button"
          onClick={async () => {
            await loadTemplates();
            setShowTemplateModal(true);
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-xs)",
            background: "rgba(0,229,255,0.08)",
            color: "var(--secondary-cyan)",
            border: "1px solid var(--secondary-cyan)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          <Package size={16} />
          Template
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Nom de l'item *"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAdd();
              if (e.key === "Escape") setShowAddForm(false);
            }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-sm) var(--space-md)",
              color: "var(--text-main)",
              fontSize: "var(--fs-sm)",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <input
              type="number"
              placeholder="Coût (€)"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              min={0}
              step={0.01}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-sm) var(--space-md)",
                color: "var(--text-main)",
                fontSize: "var(--fs-sm)",
                outline: "none",
              }}
            />
            <input
              type="text"
              placeholder="Assigné à"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              style={{
                flex: 2,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-sm) var(--space-md)",
                color: "var(--text-main)",
                fontSize: "var(--fs-sm)",
                outline: "none",
              }}
            />
          </div>
          {error && (
            <p style={{ color: "var(--accent-red)", fontSize: "var(--fs-xs)" }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setError(null); }}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-sm)",
                color: "var(--text-dim)",
                fontSize: "var(--fs-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!newLabel.trim()}
              style={{
                flex: 2,
                background: newLabel.trim() ? "var(--primary-neon)" : "rgba(255,255,255,0.08)",
                color: newLabel.trim() ? "#000" : "var(--text-dim)",
                border: "none",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-sm)",
                fontWeight: "var(--fw-bold)",
                fontSize: "var(--fs-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                cursor: newLabel.trim() ? "pointer" : "not-allowed",
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 && !showAddForm ? (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-xl) var(--space-md)",
            color: "var(--text-dim)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <CheckSquare size={40} style={{ opacity: 0.3, margin: "0 auto var(--space-sm)" }} />
          <p>Ta checklist est vide.</p>
          <p style={{ fontSize: "var(--fs-xs)", marginTop: 4 }}>
            Ajoute des items ou utilise un template.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {/* Pending items */}
          {items.filter((i) => !i.done).map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              disabled={isPending}
            />
          ))}

          {/* Separator if mixed */}
          {items.some((i) => i.done) && items.some((i) => !i.done) && (
            <div style={{ borderTop: "1px solid var(--border-color)", margin: "var(--space-xs) 0" }} />
          )}

          {/* Done items */}
          {items.filter((i) => i.done).map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* Template modal */}
      {showTemplateModal && (
        <TemplateModal
          templates={templates}
          onClose={() => setShowTemplateModal(false)}
          onApply={(templateItems) => void handleApplyTemplate(templateItems)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row sub-component
// ---------------------------------------------------------------------------

function ChecklistItemRow({
  item,
  onToggle,
  onDelete,
  disabled,
}: {
  item: ChecklistItemData;
  onToggle: (item: ChecklistItemData) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        background: item.done ? "rgba(255,255,255,0.02)" : "var(--bg-card)",
        border: `1px solid ${item.done ? "rgba(255,255,255,0.06)" : "var(--border-color)"}`,
        borderRadius: "var(--radius-md)",
        padding: "var(--space-sm) var(--space-md)",
        opacity: item.done ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        disabled={disabled}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: item.done ? "var(--primary-neon)" : "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
      >
        {item.done ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            color: item.done ? "var(--text-dim)" : "var(--text-main)",
            fontSize: "var(--fs-sm)",
            textDecoration: item.done ? "line-through" : "none",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.label}
        </span>
        {(item.assigneeName || item.cost !== null) && (
          <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: 2 }}>
            {item.assigneeName && (
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--secondary-cyan)" }}>
                → {item.assigneeName}
              </span>
            )}
            {item.cost !== null && item.cost > 0 && (
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                {formatCost(item.cost)}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          padding: 0,
          opacity: 0.5,
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
