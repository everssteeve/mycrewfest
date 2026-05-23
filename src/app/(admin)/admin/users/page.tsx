import { revalidatePath } from "next/cache";
import {
  type AdminUserRow,
  countAdminUsers,
  countRegularUsers,
  resolveUserDisplayName,
  sortAdminUsers,
} from "@/lib/admin-users";
import { prisma } from "@/lib/prisma";
import { UserSearchTable } from "./_components/user-search-table";

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

  async function toggleRole(userId: string) {
    "use server";
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) return;
    await prisma.user.update({
      where: { id: userId },
      data: { role: user.role === "admin" ? "user" : "admin" },
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin");
  }

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

      <UserSearchTable users={users} toggleRole={toggleRole} />
    </div>
  );
}
