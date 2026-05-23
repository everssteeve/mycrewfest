import { describe, expect, it } from "vitest";
import {
  type AdminSignalRow,
  countActiveSignals,
  countSignalsByScope,
  filterSignalsByScope,
  formatSignalExpiry,
  formatSignalScope,
  getSignalScopeColor,
  isSignalExpired,
  resolveSignalAuthorName,
  resolveSignalLabel,
  sortSignalsByRecency,
} from "@/lib/admin-signals";

const now = new Date("2024-06-15T12:00:00Z");

const makeSignal = (overrides: Partial<AdminSignalRow> = {}): AdminSignalRow => ({
  id: "sig-1",
  scope: "communauté",
  description: null,
  predefinedPhrase: null,
  confirmations: 0,
  infirmations: 0,
  createdAt: new Date("2024-06-15T10:00:00Z"),
  expiresAt: new Date("2024-06-15T14:00:00Z"),
  author: { name: "Jean Dupont", pseudo: null, email: "jean@test.dev" },
  festival: null,
  ...overrides,
});

describe("formatSignalScope", () => {
  it("formats communauté", () => {
    expect(formatSignalScope("communauté")).toBe("Communauté");
  });
  it("formats crew", () => {
    expect(formatSignalScope("crew")).toBe("Crew");
  });
  it("returns unknown scope as-is", () => {
    expect(formatSignalScope("autre")).toBe("autre");
  });
});

describe("getSignalScopeColor", () => {
  it("returns neon for communauté", () => {
    expect(getSignalScopeColor("communauté")).toBe("var(--primary-neon)");
  });
  it("returns cyan for crew", () => {
    expect(getSignalScopeColor("crew")).toBe("var(--secondary-cyan)");
  });
  it("returns dim for unknown", () => {
    expect(getSignalScopeColor("autre")).toBe("var(--text-dim)");
  });
});

describe("isSignalExpired", () => {
  it("returns false when expiry is in the future", () => {
    const expires = new Date(now.getTime() + 60_000);
    expect(isSignalExpired(expires, now)).toBe(false);
  });
  it("returns true when expiry is in the past", () => {
    const expires = new Date(now.getTime() - 1);
    expect(isSignalExpired(expires, now)).toBe(true);
  });
  it("returns true when exactly equal (not strictly future)", () => {
    expect(isSignalExpired(now, now)).toBe(false);
  });
});

describe("formatSignalExpiry", () => {
  it("returns 'Expiré' for past expiry", () => {
    const expires = new Date(now.getTime() - 60_000);
    expect(formatSignalExpiry(expires, now)).toBe("Expiré");
  });
  it("returns minutes for < 1h", () => {
    const expires = new Date(now.getTime() + 30 * 60_000);
    expect(formatSignalExpiry(expires, now)).toBe("30min");
  });
  it("returns hours for >= 1h", () => {
    const expires = new Date(now.getTime() + 3 * 60 * 60_000);
    expect(formatSignalExpiry(expires, now)).toBe("3h");
  });
});

describe("resolveSignalLabel", () => {
  it("prefers predefinedPhrase", () => {
    expect(resolveSignalLabel({ predefinedPhrase: "Bouchon entrée", description: "desc" })).toBe(
      "Bouchon entrée",
    );
  });
  it("falls back to description", () => {
    expect(resolveSignalLabel({ predefinedPhrase: null, description: "File d'attente" })).toBe(
      "File d'attente",
    );
  });
  it("falls back to default label", () => {
    expect(resolveSignalLabel({ predefinedPhrase: null, description: null })).toBe(
      "Signal sans description",
    );
  });
});

describe("resolveSignalAuthorName", () => {
  it("prefers pseudo", () => {
    expect(resolveSignalAuthorName({ name: "Jean", pseudo: "JDup", email: "j@test.dev" })).toBe(
      "JDup",
    );
  });
  it("falls back to name", () => {
    expect(resolveSignalAuthorName({ name: "Jean", pseudo: null, email: "j@test.dev" })).toBe(
      "Jean",
    );
  });
  it("falls back to email", () => {
    expect(resolveSignalAuthorName({ name: null, pseudo: null, email: "j@test.dev" })).toBe(
      "j@test.dev",
    );
  });
});

describe("countSignalsByScope", () => {
  it("counts correctly", () => {
    const signals = [
      makeSignal({ scope: "communauté" }),
      makeSignal({ scope: "crew" }),
      makeSignal({ scope: "communauté" }),
    ];
    const counts = countSignalsByScope(signals);
    expect(counts.communauté).toBe(2);
    expect(counts.crew).toBe(1);
  });
  it("returns empty object for no signals", () => {
    expect(countSignalsByScope([])).toEqual({});
  });
});

describe("countActiveSignals", () => {
  it("counts only non-expired signals", () => {
    const signals = [
      makeSignal({ expiresAt: new Date(now.getTime() + 60_000) }),
      makeSignal({ expiresAt: new Date(now.getTime() - 60_000) }),
      makeSignal({ expiresAt: new Date(now.getTime() + 120_000) }),
    ];
    expect(countActiveSignals(signals, now)).toBe(2);
  });
  it("returns 0 when all expired", () => {
    const signals = [makeSignal({ expiresAt: new Date(now.getTime() - 1) })];
    expect(countActiveSignals(signals, now)).toBe(0);
  });
});

describe("filterSignalsByScope", () => {
  const signals = [
    makeSignal({ id: "s1", scope: "communauté" }),
    makeSignal({ id: "s2", scope: "crew" }),
    makeSignal({ id: "s3", scope: "communauté" }),
  ];

  it("returns all signals for 'tous'", () => {
    expect(filterSignalsByScope(signals, "tous")).toHaveLength(3);
  });

  it("returns only communauté signals", () => {
    const result = filterSignalsByScope(signals, "communauté");
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.scope === "communauté")).toBe(true);
  });

  it("returns only crew signals", () => {
    const result = filterSignalsByScope(signals, "crew");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
  });

  it("returns empty array when no match", () => {
    expect(filterSignalsByScope([], "communauté")).toHaveLength(0);
  });
});

describe("sortSignalsByRecency", () => {
  it("sorts most recent first", () => {
    const signals = [
      makeSignal({ id: "a", createdAt: new Date("2024-06-15T08:00:00Z") }),
      makeSignal({ id: "b", createdAt: new Date("2024-06-15T11:00:00Z") }),
      makeSignal({ id: "c", createdAt: new Date("2024-06-15T09:00:00Z") }),
    ];
    const sorted = sortSignalsByRecency(signals);
    expect(sorted.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });
  it("does not mutate the original array", () => {
    const signals = [
      makeSignal({ id: "a", createdAt: new Date("2024-06-15T08:00:00Z") }),
      makeSignal({ id: "b", createdAt: new Date("2024-06-15T11:00:00Z") }),
    ];
    const copy = [...signals];
    sortSignalsByRecency(signals);
    expect(signals).toEqual(copy);
  });
});
