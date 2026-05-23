import { describe, it, expect } from "vitest";
import {
  resolveUserDisplayName,
  formatUserRole,
  getUserRoleColor,
  sortAdminUsers,
  countAdminUsers,
  countRegularUsers,
  type AdminUserRow,
} from "@/lib/admin-users";

function makeUser(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: "u1",
    displayName: "Alice",
    email: "alice@example.com",
    role: "user",
    createdAt: "2024-01-01T00:00:00Z",
    festEventsCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// resolveUserDisplayName
// ---------------------------------------------------------------------------

describe("resolveUserDisplayName", () => {
  it("returns pseudo when all are provided", () => {
    expect(resolveUserDisplayName("punk", "Alice", "alice@example.com")).toBe("punk");
  });

  it("returns name when pseudo is null", () => {
    expect(resolveUserDisplayName(null, "Alice", "alice@example.com")).toBe("Alice");
  });

  it("returns email when pseudo and name are null", () => {
    expect(resolveUserDisplayName(null, null, "alice@example.com")).toBe("alice@example.com");
  });

  it("returns email when pseudo and name are undefined", () => {
    expect(resolveUserDisplayName(undefined, undefined, "alice@example.com")).toBe("alice@example.com");
  });
});

// ---------------------------------------------------------------------------
// formatUserRole
// ---------------------------------------------------------------------------

describe("formatUserRole", () => {
  it("returns Admin for admin role", () => {
    expect(formatUserRole("admin")).toBe("Admin");
  });

  it("returns Utilisateur for user role", () => {
    expect(formatUserRole("user")).toBe("Utilisateur");
  });

  it("returns Utilisateur for unknown roles", () => {
    expect(formatUserRole("moderator")).toBe("Utilisateur");
  });
});

// ---------------------------------------------------------------------------
// getUserRoleColor
// ---------------------------------------------------------------------------

describe("getUserRoleColor", () => {
  it("returns orange for admin", () => {
    expect(getUserRoleColor("admin")).toBe("var(--warning-orange)");
  });

  it("returns dim for user", () => {
    expect(getUserRoleColor("user")).toBe("var(--text-dim)");
  });
});

// ---------------------------------------------------------------------------
// sortAdminUsers
// ---------------------------------------------------------------------------

describe("sortAdminUsers", () => {
  it("returns empty array for empty input", () => {
    expect(sortAdminUsers([])).toHaveLength(0);
  });

  it("puts admins first", () => {
    const users = [
      makeUser({ id: "u1", role: "user", createdAt: "2024-01-02T00:00:00Z" }),
      makeUser({ id: "u2", role: "admin", createdAt: "2024-01-01T00:00:00Z" }),
    ];
    const sorted = sortAdminUsers(users);
    expect(sorted[0].id).toBe("u2");
  });

  it("sorts by createdAt descending within same role", () => {
    const users = [
      makeUser({ id: "u1", role: "user", createdAt: "2024-01-01T00:00:00Z" }),
      makeUser({ id: "u2", role: "user", createdAt: "2024-03-01T00:00:00Z" }),
    ];
    const sorted = sortAdminUsers(users);
    expect(sorted[0].id).toBe("u2");
  });

  it("does not mutate original array", () => {
    const users = [
      makeUser({ id: "u1", role: "user" }),
      makeUser({ id: "u2", role: "admin" }),
    ];
    const copy = [...users];
    sortAdminUsers(users);
    expect(users).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// countAdminUsers
// ---------------------------------------------------------------------------

describe("countAdminUsers", () => {
  it("returns 0 for empty list", () => {
    expect(countAdminUsers([])).toBe(0);
  });

  it("counts admin users only", () => {
    expect(countAdminUsers([{ role: "admin" }, { role: "user" }, { role: "admin" }])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countRegularUsers
// ---------------------------------------------------------------------------

describe("countRegularUsers", () => {
  it("returns 0 for empty list", () => {
    expect(countRegularUsers([])).toBe(0);
  });

  it("counts non-admin users", () => {
    expect(countRegularUsers([{ role: "admin" }, { role: "user" }, { role: "user" }])).toBe(2);
  });
});
