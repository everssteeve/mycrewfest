"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminSearchResult } from "@/lib/admin-search";

const TYPE_LABELS: Record<string, string> = {
  festival: "Festival",
  user: "Utilisateur",
  submission: "Soumission",
};

const TYPE_COLORS: Record<string, string> = {
  festival: "var(--accent-pink)",
  user: "var(--secondary-cyan)",
  submission: "var(--warning-orange)",
};

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(result: AdminSearchResult) {
    setQuery("");
    setOpen(false);
    router.push(result.href);
  }

  return (
    <div
      data-testid="admin-global-search"
      style={{ position: "relative", width: "100%", maxWidth: 400 }}
    >
      <div style={{ position: "relative" }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: loading ? "var(--primary-neon)" : "var(--text-dim)",
            pointerEvents: "none",
          }}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Rechercher festivals, utilisateurs, soumissions…"
          data-testid="admin-global-search-input"
          style={{
            width: "100%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-main)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm)",
            padding: "8px 12px 8px 32px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          data-testid="admin-global-search-results"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            zIndex: 100,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              data-testid={`admin-search-result-${result.type}-${result.id}`}
              onMouseDown={() => handleSelect(result)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                width: "100%",
                padding: "10px var(--space-md)",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-color)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  padding: "2px 6px",
                  border: `1px solid ${TYPE_COLORS[result.type]}`,
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  color: TYPE_COLORS[result.type],
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}
              >
                {TYPE_LABELS[result.type]}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-main)", margin: 0, fontWeight: "var(--fw-bold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {result.label}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {result.sublabel}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            zIndex: 100,
          }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-sm)", color: "var(--text-dim)", margin: 0, textAlign: "center" }}>
            Aucun résultat pour &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
