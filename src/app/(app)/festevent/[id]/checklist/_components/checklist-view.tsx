"use client";

import {
  Check,
  CheckSquare,
  ChevronDown,
  Copy,
  Package,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  computeAvgDaysToComplete,
  computeChecklistBudget,
  computeCompletionRate,
  getOldestPendingItemAgeDays,
} from "@/lib/checklist-budget";
import { filterPendingItems, getDoneItemIds } from "@/lib/checklist-clear";
import {
  computeAssigneeStats,
  countUnassignedPendingItems,
  filterByAssignee,
  getMostLoadedAssignee,
  getUniqueAssignees,
} from "@/lib/checklist-filter";
import { filterChecklistByQuery } from "@/lib/checklist-search";
import { generateChecklistText } from "@/lib/checklist-text";
import { isEscapeKey } from "@/lib/keyboard-search";

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
  festivalName: string;
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
      role="presentation"
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
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
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
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2
            className="t-h3"
            style={{
              color: "var(--primary-neon)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Templates
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
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
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ fontWeight: "var(--fw-bold)", fontSize: "var(--fs-sm)" }}>
                  {t.name}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "var(--text-dim)",
                    fontSize: "var(--fs-xs)",
                  }}
                >
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
                <ul
                  style={{
                    margin: "var(--space-xs) 0 0 0",
                    padding: "0 0 0 var(--space-md)",
                    color: "var(--text-dim)",
                    fontSize: "var(--fs-xs)",
                  }}
                >
                  {t.items.map((item) => (
                    <li key={item} style={{ marginBottom: 2 }}>
                      {item}
                    </li>
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

export function ChecklistView({ festEventId, initialItems, festivalName }: ChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItemData[]>(initialItems);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeAssignee, setActiveAssignee] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const baseUrl = `/api/festevents/${festEventId}/checklist`;

  // Computed stats
  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const allAssignees = useMemo(() => getUniqueAssignees(items), [items]);
  const assigneeStats = useMemo(() => computeAssigneeStats(items), [items]);
  const unassignedPendingCount = useMemo(() => countUnassignedPendingItems(items), [items]);
  const mostLoaded = useMemo(() => getMostLoadedAssignee(items), [items]);
  const completionRate = useMemo(() => computeCompletionRate(items), [items]);
  const oldestPendingDays = useMemo(() => getOldestPendingItemAgeDays(items), [items]);
  const avgCompletionDays = useMemo(() => computeAvgDaysToComplete(items), [items]);
  const displayedItems = useMemo(
    () => filterChecklistByQuery(filterByAssignee(items, activeAssignee), searchQuery),
    [items, activeAssignee, searchQuery],
  );
  const {
    total: totalCost,
    spent: spentCost,
    remaining: remainingCost,
  } = computeChecklistBudget(items);

  const copyChecklist = useCallback(async () => {
    const text = generateChecklistText(
      items.map((i) => ({
        label: i.label,
        done: i.done,
        cost: i.cost,
        assigneeName: i.assigneeName,
      })),
      festivalName,
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [items, festivalName]);

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
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: optimistic } : i)));

      startTransition(async () => {
        try {
          const res = await fetch(`${baseUrl}/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: optimistic }),
          });
          if (!res.ok) {
            // Revert
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)));
          } else {
            const updated = (await res.json()) as ChecklistItemData;
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          }
        } catch {
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)));
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

  const clearDoneItems = useCallback(() => {
    const doneIds = getDoneItemIds(items);
    if (doneIds.length === 0) return;

    // Optimistic update
    setItems((prev) => filterPendingItems(prev));

    // Parallel deletes
    startTransition(async () => {
      try {
        await Promise.all(doneIds.map((id) => fetch(`${baseUrl}/${id}`, { method: "DELETE" })));
      } catch {
        // silently ignore; items already removed from UI
      }
    });
  }, [items, baseUrl]);

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
        const errData = (await res.json()) as { error: string };
        setError(errData.error ?? "Erreur lors de l'ajout.");
        return;
      }
      const created = (await res.json()) as ChecklistItemData;
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
    <div
      style={{
        paddingTop: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <span
              style={{
                color: "var(--text-main)",
                fontWeight: "var(--fw-bold)",
                fontSize: "var(--fs-sm)",
              }}
            >
              {completedCount} / {totalCount} complétés
            </span>
            {unassignedPendingCount > 0 && (
              <span
                data-testid="checklist-unassigned-count"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--warning-orange)",
                  background: "rgba(255,153,0,0.1)",
                  border: "1px solid rgba(255,153,0,0.4)",
                  borderRadius: "var(--radius-full)",
                  padding: "1px 8px",
                }}
              >
                {unassignedPendingCount} sans assigné
              </span>
            )}
            {mostLoaded && mostLoaded.pendingCount > 1 && (
              <span
                data-testid="checklist-most-loaded"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--accent-pink)",
                }}
                title="Membre de la crew avec le plus de tâches restantes"
              >
                {mostLoaded.assigneeName}: {mostLoaded.pendingCount}
              </span>
            )}
            {totalCount > 0 && (
              <span
                data-testid="checklist-completion-rate"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color:
                    completionRate === 100
                      ? "var(--primary-neon)"
                      : completionRate >= 50
                        ? "var(--secondary-cyan)"
                        : "var(--text-muted)",
                }}
                title="Taux de complétion global"
              >
                {completionRate}%
              </span>
            )}
            {oldestPendingDays !== null && oldestPendingDays > 0 && completionRate < 100 && (
              <span
                data-testid="checklist-oldest-pending"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: oldestPendingDays >= 7 ? "var(--warning-orange)" : "var(--text-muted)",
                }}
                title={`La tâche en attente la plus ancienne date d'il y a ${oldestPendingDays}j`}
              >
                ⏰ {oldestPendingDays}j
              </span>
            )}
            {avgCompletionDays !== null && (
              <span
                data-testid="checklist-avg-completion-days"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                }}
                title="Nombre de jours moyen pour terminer une tâche"
              >
                moy. {avgCompletionDays}j
              </span>
            )}
          </div>
          {totalCost > 0 && (
            <div
              data-testid="checklist-budget"
              style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-full)",
                  padding: "2px 10px",
                }}
              >
                Total {formatCost(totalCost)}
              </span>
              {spentCost > 0 && (
                <span
                  data-testid="checklist-budget-spent"
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
                  Dépensé {formatCost(spentCost)}
                </span>
              )}
              {remainingCost > 0 && (
                <span
                  data-testid="checklist-budget-remaining"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--warning-orange)",
                    background: "rgba(255,153,0,0.08)",
                    border: "1px solid var(--warning-orange)",
                    borderRadius: "var(--radius-full)",
                    padding: "2px 10px",
                  }}
                >
                  Restant {formatCost(remainingCost)}
                </span>
              )}
            </div>
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
        <button
          type="button"
          onClick={() => void copyChecklist()}
          data-testid="copy-checklist-btn"
          aria-label={copied ? "Liste copiée" : "Copier la liste"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-xs)",
            background: copied ? "var(--neon-soft)" : "transparent",
            color: copied ? "var(--primary-neon)" : "var(--text-muted)",
            border: copied ? "1px solid var(--primary-neon)" : "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-sm) var(--space-md)",
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--fs-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s, background 0.2s",
          }}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
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
          {error && <p style={{ color: "var(--accent-red)", fontSize: "var(--fs-xs)" }}>{error}</p>}
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
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

      {/* Search input */}
      {items.length >= 6 && (
        <div style={{ position: "relative" }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (isEscapeKey(e)) setSearchQuery("");
            }}
            placeholder="Chercher un item…"
            aria-label="Rechercher dans la checklist"
            data-testid="checklist-search"
            style={{
              width: "100%",
              padding: "8px 12px",
              paddingRight: searchQuery ? 34 : 12,
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-main)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Assignee filter chips */}
      {allAssignees.length >= 2 && (
        <div
          role="group"
          style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}
          aria-label="Filtrer par assigné"
          data-testid="assignee-filter"
        >
          <button
            type="button"
            onClick={() => setActiveAssignee(null)}
            aria-pressed={activeAssignee === null}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              border:
                activeAssignee === null
                  ? "1px solid var(--primary-neon)"
                  : "1px solid var(--border-color)",
              backgroundColor: activeAssignee === null ? "var(--neon-soft)" : "transparent",
              color: activeAssignee === null ? "var(--primary-neon)" : "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              cursor: "pointer",
              transition: "var(--transition-fast)",
            }}
          >
            Tous
          </button>
          {allAssignees.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setActiveAssignee(a)}
              aria-pressed={activeAssignee === a}
              data-testid={`assignee-filter-${a}`}
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                border:
                  activeAssignee === a
                    ? "1px solid var(--secondary-cyan)"
                    : "1px solid var(--border-color)",
                backgroundColor: activeAssignee === a ? "var(--cyan-soft)" : "transparent",
                color: activeAssignee === a ? "var(--secondary-cyan)" : "var(--text-dim)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-xs)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Assignee stats */}
      {allAssignees.length >= 2 && (
        <div
          data-testid="checklist-assignee-stats"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-xs)",
          }}
        >
          {assigneeStats.map((s) => (
            <span
              key={s.assigneeName}
              data-testid={`assignee-stat-${s.assigneeName}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-xs)",
                color: s.percent === 100 ? "var(--primary-neon)" : "var(--text-dim)",
                background: "var(--bg-surface-elevated)",
                border: `1px solid ${s.percent === 100 ? "var(--primary-neon)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "2px 8px",
              }}
            >
              {s.assigneeName} {s.done}/{s.total}
            </span>
          ))}
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
          {displayedItems
            .filter((i) => !i.done)
            .map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                disabled={isPending}
              />
            ))}

          {/* Separator + clear done button */}
          {displayedItems.some((i) => i.done) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                margin: "var(--space-xs) 0",
              }}
            >
              <div style={{ flex: 1, borderTop: "1px solid var(--border-color)" }} />
              <button
                type="button"
                onClick={clearDoneItems}
                data-testid="clear-done-btn"
                aria-label="Supprimer les items cochés"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--danger-red)";
                  (e.currentTarget as HTMLElement).style.color = "var(--danger-red)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
                }}
              >
                <Trash2 size={11} aria-hidden="true" />
                Effacer les cochés
              </button>
              <div style={{ flex: 1, borderTop: "1px solid var(--border-color)" }} />
            </div>
          )}

          {/* Done items */}
          {displayedItems
            .filter((i) => i.done)
            .map((item) => (
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
              <span
                style={{
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono)",
                }}
              >
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
