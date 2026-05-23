import { describe, it, expect } from "vitest";
import {
  formatFestivalDateRange,
  buildFestivalOgDescription,
  buildArtistOgDescription,
  truncateOgTitle,
} from "@/lib/og-metadata";

describe("formatFestivalDateRange", () => {
  it("formats same-month range (day–day month year)", () => {
    const result = formatFestivalDateRange("2026-06-18T00:00:00Z", "2026-06-21T00:00:00Z");
    expect(result).toContain("juin");
    expect(result).toContain("2026");
  });

  it("formats cross-month range", () => {
    const result = formatFestivalDateRange("2026-08-27T00:00:00Z", "2026-09-01T00:00:00Z");
    expect(result).toContain("août");
    expect(result).toContain("septembre");
  });

  it("returns a non-empty string", () => {
    expect(formatFestivalDateRange("2026-07-01T00:00:00Z", "2026-07-05T00:00:00Z").length).toBeGreaterThan(0);
  });
});

describe("buildFestivalOgDescription", () => {
  const base = { city: "Clisson", country: "France", startDate: "2026-06-18T00:00:00Z", endDate: "2026-06-21T00:00:00Z" };

  it("includes city and country", () => {
    const result = buildFestivalOgDescription(base);
    expect(result).toContain("Clisson");
    expect(result).toContain("France");
  });

  it("includes date range", () => {
    const result = buildFestivalOgDescription(base);
    expect(result).toContain("juin");
  });

  it("appends truncated description when provided", () => {
    const result = buildFestivalOgDescription({ ...base, description: "Festival de métal extrême." });
    expect(result).toContain("Festival de métal");
  });

  it("truncates long description at 120 chars", () => {
    const longDesc = "a".repeat(200);
    const result = buildFestivalOgDescription({ ...base, description: longDesc });
    expect(result).toContain("…");
  });

  it("works without description", () => {
    const result = buildFestivalOgDescription(base);
    expect(result).not.toContain("undefined");
  });
});

describe("buildArtistOgDescription", () => {
  it("includes disciplines", () => {
    const result = buildArtistOgDescription({ disciplines: ["Heavy Metal", "Live"] });
    expect(result).toContain("Heavy Metal");
    expect(result).toContain("Live");
  });

  it("includes countryCode when provided", () => {
    const result = buildArtistOgDescription({ disciplines: ["Rock"], countryCode: "GB" });
    expect(result).toContain("GB");
  });

  it("returns fallback for empty fields", () => {
    const result = buildArtistOgDescription({ disciplines: [] });
    expect(result).toBe("Artiste sur MyCrewFest");
  });

  it("appends description excerpt", () => {
    const result = buildArtistOgDescription({ disciplines: ["Metal"], description: "Groupe légendaire de NWOBHM." });
    expect(result).toContain("Groupe légendaire");
  });

  it("truncates description at 140 chars", () => {
    const result = buildArtistOgDescription({ disciplines: [], description: "x".repeat(200) });
    expect(result).toContain("…");
  });
});

describe("truncateOgTitle", () => {
  it("returns full title when short enough", () => {
    expect(truncateOgTitle("Hellfest 2026")).toBe("Hellfest 2026 — MyCrewFest");
  });

  it("truncates long title with ellipsis", () => {
    const result = truncateOgTitle("A".repeat(60));
    expect(result).toContain("…");
    expect(result.length).toBeLessThanOrEqual(65);
  });

  it("preserves suffix in truncated version", () => {
    const result = truncateOgTitle("A".repeat(60));
    expect(result).toContain("MyCrewFest");
  });
});
