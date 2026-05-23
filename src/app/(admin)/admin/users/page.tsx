import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  resolveUserDisplayName,
  formatUserRole,
  getUserRoleColor,
  sortAdminUsers,
  countAdminUsers,
  countRegularUsers,
  type AdminUserRow,
} from "@/lib/admin-users";

async function getUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      pseudo: true,
      role: true,
      createdAt: true,
      _count: { select: { festEvents: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    displayName: resolveUserDisplayName(u.pseudo, u.name, u.email),
    email: u.email,
    role: u.role as "user" | "admin",
    createdAt: u.createdAt.toISOString(),
    festEventsCount: u._count.festEvents,
  }));
}

export default async function AdminUsersPage() {
  const rawUsers = await getUsers();
  const users = sortAdminUsers(rawUsers);
  const adminCount = countAdminUsers(users);
  const regularCount = countRegularUsers(users);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-lg)",
        }}
      >
        <h1
          data-testid="admin-users-title"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            color: "var(--text-main)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Utilisateurs
        </h1>
        <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
          <a
            href="/api/admin/export/users"
            download
            data-testid="admin-users-export-csv"
            style={{
              padding: "6px 14px",
              border: "1px solid var(--border-color)",
              color: "var(--text-muted)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            ↓ CSV
          </a>
          <span
            data-testid="admin-users-admin-count"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
              color: "var(--warning-orange)",
            }}
          >
            {adminCount} admin{adminCount > 1 ? "s" : ""}
          </span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span
            data-testid="admin-users-regular-count"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-sm)",
              color: "var(--text-dim)",
            }}
          >
            {regularCount} utilisateur{regularCount > 1 ? "s" : ""}
          </span>
        </div>
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
              {["Utilisateur", "Email", "Rôle", "Festivals", "Inscrit le", "Actions"].map(
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
            {users.map((user, i) => (
              <tr
                key={user.id}
                data-testid={`admin-user-row-${user.id}`}
                style={{
                  borderBottom:
                    i < users.length - 1 ? "1px solid var(--border-color)" : "none",
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
                  <ToggleRoleButton userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Aucun utilisateur.
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRoleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const isAdmin = currentRole === "admin";

  async function toggleRole() {
    "use server";
    await prisma.user.update({
      where: { id: userId },
      data: { role: isAdmin ? "user" : "admin" },
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
  }

  return (
    <form action={toggleRole}>
      <button
        type="submit"
        data-testid={`admin-toggle-role-${userId}`}
        style={{
          padding: "4px 10px",
          border: `1px solid ${isAdmin ? "var(--danger-red)" : "var(--warning-orange)"}`,
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          color: isAdmin ? "var(--danger-red)" : "var(--warning-orange)",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {isAdmin ? "Rétrograder" : "Promouvoir admin"}
      </button>
    </form>
  );
}
