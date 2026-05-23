import { describe, expect, it } from "vitest";
import { computeTravelTimeMins, haversineDistanceKm } from "@/lib/travel-time";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistanceKm(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it("computes Paris-London distance (~341 km)", () => {
    const km = haversineDistanceKm(48.8566, 2.3522, 51.5074, -0.1278);
    expect(km).toBeGreaterThan(335);
    expect(km).toBeLessThan(345);
  });

  it("computes short festival-scale distance (< 1 km)", () => {
    // ~200 m apart
    const km = haversineDistanceKm(48.8566, 2.3522, 48.8584, 2.3522);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(0.5);
  });

  it("is symmetric", () => {
    const ab = haversineDistanceKm(48.8566, 2.3522, 51.5074, -0.1278);
    const ba = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });
});

describe("computeTravelTimeMins", () => {
  it("returns 0 for same location", () => {
    expect(computeTravelTimeMins(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0);
  });

  it("rounds result to nearest minute", () => {
    const result = computeTravelTimeMins(48.8566, 2.3522, 48.859, 2.3522);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("returns positive value for distinct venues", () => {
    expect(computeTravelTimeMins(48.8566, 2.3522, 48.8584, 2.3522)).toBeGreaterThan(0);
  });

  it("~500 m apart → ~6 min walk", () => {
    // 0.5 km at 5 km/h = 6 min
    const mins = computeTravelTimeMins(48.8566, 2.3522, 48.8611, 2.3522);
    expect(mins).toBeGreaterThanOrEqual(5);
    expect(mins).toBeLessThanOrEqual(8);
  });
});
