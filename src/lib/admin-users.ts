/**
 * Pure helpers for admin user management display.
 * No DB access — fully unit-testable.
 */

export type UserRole = "user" | "admin";

export interface AdminUserRow {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  festEventsCount: number;
}

/**
 * Returns the display name for a user: pseudo > name > email.
 */
export function resolveUserDisplayName(
  pseudo: string | null | undefined,
  name: string | null | undefined,
  email: string,
): string {
  return pseudo ?? name ?? email;
}

/**
 * Returns a human-readable role label.
 */
export function formatUserRole(role: string): string {
  if (role === "admin") return "Admin";
  return "Utilisateur";
}

/**
 * Returns the color token for a given user role badge.
 */
export function getUserRoleColor(role: string): string {
  return role === "admin" ? "var(--warning-orange)" : "var(--text-dim)";
}

/**
 * Sorts an array of user rows: admins first, then by createdAt descending.
 */
export function sortAdminUsers(users: AdminUserRow[]): AdminUserRow[] {
  return [...users].sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (b.role === "admin" && a.role !== "admin") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Returns the count of users with role === "admin".
 */
export function countAdminUsers(users: Pick<AdminUserRow, "role">[]): number {
  return users.filter((u) => u.role === "admin").length;
}

/**
 * Returns the count of users with role !== "admin".
 */
export function countRegularUsers(users: Pick<AdminUserRow, "role">[]): number {
  return users.filter((u) => u.role !== "admin").length;
}
