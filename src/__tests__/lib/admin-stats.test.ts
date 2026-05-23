import { describe, it, expect } from "vitest";
import {
  buildAdminKpis,
  hasPendingAlert,
  formatKpiValue,
} from "@/lib/admin-stats";

// ---------------------------------------------------------------------------
// buildAdminKpis
// ---------------------------------------------------------------------------

describe("buildAdminKpis", () => {
  const raw = {
    totalUsers: 42,
    totalFestivals: 15,
    pendingSubmissions: 3,
    todaySignals: 8,
    totalFestEvents: 200,
  };

  it("returns 5 KPI items", () => {
    expect(buildAdminKpis(raw)).toHaveLength(5);
  });

  it("assigns correct values", () => {
    const kpis = buildAdminKpis(raw);
    expect(kpis[0].value).toBe(42);
    expect(kpis[1].value).toBe(15);
    expect(kpis[2].value).toBe(3);
    expect(kpis[3].value).toBe(8);
    expect(kpis[4].value).toBe(200);
  });

  it("assigns unique data-testid for each KPI", () => {
    const kpis = buildAdminKpis(raw);
    const testids = kpis.map((k) => k.dataTestid);
    expect(new Set(testids).size).toBe(5);
  });

  it("uses warning-orange color for pending submissions > 0", () => {
    const kpis = buildAdminKpis(raw);
    const sub = kpis.find((k) => k.dataTestid === "admin-kpi-pending-submissions");
    expect(sub?.color).toBe("var(--warning-orange)");
  });

  it("uses dim color for pending submissions === 0", () => {
    const kpis = buildAdminKpis({ ...raw, pendingSubmissions: 0 });
    const sub = kpis.find((k) => k.dataTestid === "admin-kpi-pending-submissions");
    expect(sub?.color).toBe("var(--text-dim)");
  });

  it("uses accent-pink for today signals > 0", () => {
    const kpis = buildAdminKpis(raw);
    const sig = kpis.find((k) => k.dataTestid === "admin-kpi-today-signals");
    expect(sig?.color).toBe("var(--accent-pink)");
  });

  it("uses dim color for today signals === 0", () => {
    const kpis = buildAdminKpis({ ...raw, todaySignals: 0 });
    const sig = kpis.find((k) => k.dataTestid === "admin-kpi-today-signals");
    expect(sig?.color).toBe("var(--text-dim)");
  });
});

// ---------------------------------------------------------------------------
// hasPendingAlert
// ---------------------------------------------------------------------------

describe("hasPendingAlert", () => {
  it("returns false for 0 pending", () => {
    expect(hasPendingAlert(0)).toBe(false);
  });

  it("returns true for 1 pending", () => {
    expect(hasPendingAlert(1)).toBe(true);
  });

  it("returns true for many pending", () => {
    expect(hasPendingAlert(99)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatKpiValue
// ---------------------------------------------------------------------------

describe("formatKpiValue", () => {
  it("returns raw number as string for values < 1000", () => {
    expect(formatKpiValue(0)).toBe("0");
    expect(formatKpiValue(42)).toBe("42");
    expect(formatKpiValue(999)).toBe("999");
  });

  it("formats thousands as Xk", () => {
    expect(formatKpiValue(1000)).toBe("1.0k");
    expect(formatKpiValue(1500)).toBe("1.5k");
    expect(formatKpiValue(12_345)).toBe("12.3k");
  });

  it("formats millions as XM", () => {
    expect(formatKpiValue(1_000_000)).toBe("1.0M");
    expect(formatKpiValue(2_500_000)).toBe("2.5M");
  });
});
