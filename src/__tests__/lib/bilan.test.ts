import { describe, it, expect } from "vitest";
import { computeBilan, formatBilanDuration, type BilantableEvent } from "@/lib/bilan";

function ev(
  status: string | null,
  opts: { durationMins?: number; venueName?: string; title?: string; tags?: string[] } = {},
): BilantableEvent {
  return {
    title: opts.title ?? "Event",
    durationMins: opts.durationMins ?? null,
    selection: status ? { status } : null,
    venue: opts.venueName ? { name: opts.venueName } : null,
    tags: opts.tags ?? null,
  };
}

describe("computeBilan", () => {
  it("returns zeros for an empty event list", () => {
    const stats = computeBilan([]);
    expect(stats.totalSeen).toBe(0);
    expect(stats.totalDurationMins).toBe(0);
    expect(stats.mustSeePending).toBe(0);
    expect(stats.intéresséPending).toBe(0);
    expect(stats.topVenue).toBeNull();
    expect(stats.uniqueVenues).toBe(0);
  });

  it("counts only 'vu' events as seen", () => {
    const events = [
      ev("vu"),
      ev("vu"),
      ev("must-see"),
      ev("intéressé"),
      ev(null),
    ];
    expect(computeBilan(events).totalSeen).toBe(2);
  });

  it("counts must-see pending correctly", () => {
    const events = [ev("must-see"), ev("must-see"), ev("vu")];
    expect(computeBilan(events).mustSeePending).toBe(2);
  });

  it("counts intéressé pending correctly", () => {
    const events = [ev("intéressé"), ev("intéressé"), ev("intéressé"), ev("vu")];
    expect(computeBilan(events).intéresséPending).toBe(3);
  });

  it("sums durationMins only for vu events", () => {
    const events = [
      ev("vu", { durationMins: 60 }),
      ev("vu", { durationMins: 45 }),
      ev("must-see", { durationMins: 90 }),
    ];
    expect(computeBilan(events).totalDurationMins).toBe(105);
  });

  it("handles missing durationMins (counts as 0)", () => {
    const events = [ev("vu"), ev("vu", { durationMins: 30 })];
    expect(computeBilan(events).totalDurationMins).toBe(30);
  });

  it("returns the venue with the most vu events as topVenue", () => {
    const events = [
      ev("vu", { venueName: "Grande Scène" }),
      ev("vu", { venueName: "Grande Scène" }),
      ev("vu", { venueName: "Petite Scène" }),
      ev("must-see", { venueName: "Chapelle" }),
    ];
    const stats = computeBilan(events);
    expect(stats.topVenue).toBe("Grande Scène");
    expect(stats.uniqueVenues).toBe(2);
  });

  it("returns null topVenue when no seen events have a venue", () => {
    const events = [ev("vu"), ev("vu")];
    expect(computeBilan(events).topVenue).toBeNull();
    expect(computeBilan(events).uniqueVenues).toBe(0);
  });

  it("does not count venue from non-vu events", () => {
    const events = [
      ev("must-see", { venueName: "Scène A" }),
      ev("intéressé", { venueName: "Scène B" }),
      ev("vu", { venueName: "Scène C" }),
    ];
    const stats = computeBilan(events);
    expect(stats.topVenue).toBe("Scène C");
    expect(stats.uniqueVenues).toBe(1);
  });

  it("returns null topTag when no seen events have tags", () => {
    const events = [ev("vu"), ev("vu")];
    expect(computeBilan(events).topTag).toBeNull();
  });

  it("returns the most common tag among vu events as topTag", () => {
    const events = [
      ev("vu", { tags: ["Électro", "Techno"] }),
      ev("vu", { tags: ["Électro"] }),
      ev("vu", { tags: ["Jazz"] }),
      ev("must-see", { tags: ["Jazz", "Électro"] }),
    ];
    expect(computeBilan(events).topTag).toBe("Électro");
  });

  it("does not count tags from non-vu events", () => {
    const events = [
      ev("must-see", { tags: ["Jazz", "Jazz", "Jazz"] }),
      ev("vu", { tags: ["Électro"] }),
    ];
    expect(computeBilan(events).topTag).toBe("Électro");
  });

  it("handles events with null or empty tags gracefully", () => {
    const events = [
      ev("vu", { tags: [] }),
      ev("vu", { tags: null as unknown as string[] }),
      ev("vu", { tags: ["Rock"] }),
    ];
    expect(computeBilan(events).topTag).toBe("Rock");
  });
});

describe("formatBilanDuration", () => {
  it("returns 0min for zero or negative", () => {
    expect(formatBilanDuration(0)).toBe("0min");
    expect(formatBilanDuration(-10)).toBe("0min");
  });

  it("formats minutes only", () => {
    expect(formatBilanDuration(30)).toBe("30min");
    expect(formatBilanDuration(45)).toBe("45min");
  });

  it("formats whole hours", () => {
    expect(formatBilanDuration(60)).toBe("1h");
    expect(formatBilanDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatBilanDuration(90)).toBe("1h30");
    expect(formatBilanDuration(75)).toBe("1h15");
    expect(formatBilanDuration(150)).toBe("2h30");
  });
});
