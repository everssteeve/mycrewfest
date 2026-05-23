import { describe, expect, it } from "vitest";
import { formatEventShareLine, generateProgrammeShareText } from "@/lib/programme-share";

describe("formatEventShareLine", () => {
  it("formats basic event with time and venue", () => {
    const event = {
      title: "DJ Set",
      startTime: "2026-07-15T21:00:00",
      venue: { name: "Grande Scène" },
      selection: { status: "must-see" },
    };
    const line = formatEventShareLine(event);
    expect(line).toContain("21h00");
    expect(line).toContain("DJ Set");
    expect(line).toContain("Grande Scène");
    expect(line).toContain("★");
  });

  it("shows ♥ for intéressé", () => {
    const event = {
      title: "Atelier",
      startTime: "2026-07-15T14:00:00",
      selection: { status: "intéressé" },
    };
    expect(formatEventShareLine(event)).toContain("♥");
  });

  it("shows ✓ for vu", () => {
    const event = {
      title: "Concert",
      startTime: "2026-07-15T20:00:00",
      selection: { status: "vu" },
    };
    expect(formatEventShareLine(event)).toContain("✓");
  });

  it("shows ? when no startTime", () => {
    const event = { title: "Atelier", selection: { status: "intéressé" } };
    expect(formatEventShareLine(event)).toContain("?");
  });

  it("omits venue section when no venue", () => {
    const event = {
      title: "Concert",
      startTime: "2026-07-15T20:00:00",
      selection: { status: "vu" },
    };
    const line = formatEventShareLine(event);
    expect(line).not.toContain("·");
  });
});

describe("generateProgrammeShareText", () => {
  const events = [
    {
      title: "Concert B",
      startTime: "2026-07-15T22:00:00",
      venue: { name: "Scène B" },
      selection: { status: "must-see" },
    },
    {
      title: "Concert A",
      startTime: "2026-07-15T20:00:00",
      venue: { name: "Scène A" },
      selection: { status: "intéressé" },
    },
    { title: "Itinérant", selection: { status: "intéressé" } },
    { title: "Unselected", startTime: "2026-07-15T18:00:00", selection: null },
  ];

  it("returns empty string when no selected events", () => {
    expect(generateProgrammeShareText([], "Fest")).toBe("");
    expect(generateProgrammeShareText([{ title: "X", selection: null }], "Fest")).toBe("");
  });

  it("includes festival name in header", () => {
    const text = generateProgrammeShareText(events, "MyFest");
    expect(text).toContain("MyFest");
  });

  it("sorts events by start time", () => {
    const text = generateProgrammeShareText(events, "Fest");
    const lines = text.split("\n");
    const concertAIdx = lines.findIndex((l) => l.includes("Concert A"));
    const concertBIdx = lines.findIndex((l) => l.includes("Concert B"));
    expect(concertAIdx).toBeLessThan(concertBIdx);
  });

  it("places events without startTime at the end", () => {
    const text = generateProgrammeShareText(events, "Fest");
    const lines = text.split("\n");
    const itinIdx = lines.findIndex((l) => l.includes("Itinérant"));
    const concertBIdx = lines.findIndex((l) => l.includes("Concert B"));
    expect(itinIdx).toBeGreaterThan(concertBIdx);
  });

  it("excludes unselected events", () => {
    const text = generateProgrammeShareText(events, "Fest");
    expect(text).not.toContain("Unselected");
  });
});
