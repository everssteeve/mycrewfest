import { describe, it, expect } from "vitest";
import {
  distanceToFestivalKm,
  formatDistanceKm,
  sortByDistance,
  filterWithinRadius,
} from "@/lib/geo-festival";

// Paris (48.8566, 2.3522) → Lyon (45.7640, 4.8357) ≈ 392 km
const PARIS = { latitude: 48.8566, longitude: 2.3522 };
const LYON = { latitude: 45.764, longitude: 4.8357 };
const CLISSON = { latitude: 47.0881, longitude: -1.2819 }; // Hellfest

describe("distanceToFestivalKm", () => {
  it("returns null when festival has no coordinates", () => {
    expect(distanceToFestivalKm(48.8566, 2.3522, { latitude: null, longitude: null })).toBeNull();
    expect(distanceToFestivalKm(48.8566, 2.3522, { latitude: 45.76, longitude: null })).toBeNull();
  });

  it("returns ~0 for same coordinates", () => {
    const d = distanceToFestivalKm(48.8566, 2.3522, PARIS);
    expect(d).not.toBeNull();
    expect(d!).toBeLessThan(1);
  });

  it("Paris → Lyon ≈ 392 km", () => {
    const d = distanceToFestivalKm(PARIS.latitude!, PARIS.longitude!, LYON);
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThan(350);
    expect(d!).toBeLessThan(430);
  });

  it("Paris → Clisson ≈ 350 km", () => {
    const d = distanceToFestivalKm(PARIS.latitude!, PARIS.longitude!, CLISSON);
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThan(300);
    expect(d!).toBeLessThan(400);
  });
});

describe("formatDistanceKm", () => {
  it("returns '< 1 km' for distances < 1", () => {
    expect(formatDistanceKm(0.5)).toBe("< 1 km");
  });

  it("formats with one decimal for < 10 km", () => {
    expect(formatDistanceKm(5.5)).toBe("5.5 km");
    expect(formatDistanceKm(5.0)).toBe("5 km");
  });

  it("rounds for ≥ 10 km", () => {
    expect(formatDistanceKm(392.4)).toBe("392 km");
    expect(formatDistanceKm(10.6)).toBe("11 km");
  });
});

describe("sortByDistance", () => {
  const festivals = [
    { id: "lyon", ...LYON },
    { id: "paris", ...PARIS },
    { id: "clisson", ...CLISSON },
    { id: "no-coords", latitude: null, longitude: null },
  ];

  it("sorts nearest first", () => {
    const sorted = sortByDistance(festivals, PARIS.latitude!, PARIS.longitude!);
    expect(sorted[0].id).toBe("paris"); // ~0 km
    expect(sorted[1].id).toBe("clisson"); // ~350 km
    expect(sorted[2].id).toBe("lyon"); // ~392 km
    expect(sorted[3].id).toBe("no-coords"); // last
  });

  it("places null-coord festivals last", () => {
    const sorted = sortByDistance(festivals, 48, 2);
    expect(sorted[sorted.length - 1].distanceKm).toBeNull();
  });

  it("attaches distanceKm to each entry", () => {
    const sorted = sortByDistance([{ id: "paris", ...PARIS }], PARIS.latitude!, PARIS.longitude!);
    expect(sorted[0].distanceKm).not.toBeNull();
    expect(sorted[0].distanceKm!).toBeLessThan(1);
  });

  it("does not mutate input array", () => {
    const input = [{ ...PARIS, id: "paris" }, { ...LYON, id: "lyon" }];
    const copy = [...input];
    sortByDistance(input, LYON.latitude!, LYON.longitude!);
    expect(input).toEqual(copy);
  });
});

describe("filterWithinRadius", () => {
  const festivals = [
    { id: "paris", ...PARIS },
    { id: "lyon", ...LYON },
    { id: "no-coords", latitude: null, longitude: null },
  ];

  it("includes only festivals within the radius", () => {
    const result = filterWithinRadius(festivals, PARIS.latitude!, PARIS.longitude!, 100);
    expect(result.map((f) => f.id)).toContain("paris");
    expect(result.map((f) => f.id)).not.toContain("lyon");
  });

  it("excludes festivals with no coordinates", () => {
    const result = filterWithinRadius(festivals, PARIS.latitude!, PARIS.longitude!, 9999);
    expect(result.map((f) => f.id)).not.toContain("no-coords");
  });

  it("attaches distanceKm to returned entries", () => {
    const result = filterWithinRadius(festivals, PARIS.latitude!, PARIS.longitude!, 1000);
    const paris = result.find((f) => f.id === "paris");
    expect(paris?.distanceKm).toBeDefined();
    expect(paris?.distanceKm).toBeLessThan(1);
  });

  it("returns empty when radius excludes all festivals", () => {
    // user is far from all seeded festivals
    const result = filterWithinRadius(festivals, 0, 0, 1);
    expect(result.length).toBe(0);
  });
});
