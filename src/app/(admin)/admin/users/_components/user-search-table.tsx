"use client";

import { useState, useMemo, useTransition } from "react";
import { Search } from "lucide-react";
import { filterAdminUsers, formatUserRole, getUserRoleColor, type AdminUserRow } from "@/lib/admin-users";

interface Props {
  users: AdminUserRow[];
  toggleRole: (userId: string) => Promise<void>;
}

export function UserSearchTable({ users, toggleRole }: Props) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => filterAdminUsers(users, query), [users, query]);

  function handleToggle(userId: string) {
    startTransition(async () => {
      await toggleRole(userId);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {/* Search bar */}
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={14}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-dim)",
              pointerEvents: "none",
            }}
          />
          <input
            data-testid="admin-users-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, email, rôle…"
            aria-label="Rechercher un utilisateur"
            style={{
              width: "100%",
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 8,
              paddingBottom: 8,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-main)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <span
          data-testid="admin-users-filtered-count"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-xs)",
            color: "var(--text-dim)",
            whiteSpace: "nowrap",
          }}
        >
          {filtered.length} / {users.length}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table
          data-testid="admin-users-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {["Utilisateur", "Email", "Rôle", "Festivals", "Inscrit le", "Actions"].map((h) => (
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
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => (
              <tr
                key={user.id}
                data-testid={`admin-user-row-${user.id}`}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border-color)" : "none",
                }}
              >
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-main)",
                      margin: 0,
                      fontWeight: "var(--fw-bold)",
                    }}
                  >
                    {user.displayName}
                  </p>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--text-dim)",
                    }}
                  >
                    {user.email}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      border: `1px solid ${getUserRoleColor(user.role)}`,
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: getUserRoleColor(user.role),
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {formatUserRole(user.role)}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--fs-sm)",
                      color: "var(--text-dim)",
                    }}
                  >
                    {user.festEventsCount}
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
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </td>
                <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                  <button
                    type="button"
                    data-testid={`admin-toggle-role-${user.id}`}
                    disabled={isPending}
                    onClick={() => handleToggle(user.id)}
                    style={{
                      padding: "4px 10px",
                      border: `1px solid ${user.role === "admin" ? "var(--danger-red)" : "var(--warning-orange)"}`,
                      borderRadius: "var(--radius-sm)",
                      background: "transparent",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-xs)",
                      color: user.role === "admin" ? "var(--danger-red)" : "var(--warning-orange)",
                      cursor: isPending ? "not-allowed" : "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    {user.role === "admin" ? "Rétrograder" : "Promouvoir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
            }}
          >
            {query ? "Aucun utilisateur correspondant." : "Aucun utilisateur."}
          </div>
        )}
      </div>
    </div>
  );
}
