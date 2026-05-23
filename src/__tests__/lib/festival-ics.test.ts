import { describe, expect, it } from "vitest";
import { buildFestivalIcs, type FestivalIcsInput, festivalIcsFilename } from "@/lib/festival-ics";

const FESTIVAL: FestivalIcsInput = {
  name: "Hellfest Open Air 2026",
  slug: "hellfest-2026",
  startDate: "2026-06-18T10:00:00.000Z",
  endDate: "2026-06-21T23:59:00.000Z",
  city: "Clisson",
  country: "France",
  description: "Le plus grand festival de metal en France.",
  siteUrl: "https://www.hellfest.fr",
};

describe("buildFestivalIcs", () => {
  it("produces valid VCALENDAR wrapper", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes correct DTSTART as all-day date", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260618");
  });

  it("DTEND is the day after endDate (exclusive)", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    // endDate is June 21, so DTEND should be June 22
    expect(ics).toContain("DTEND;VALUE=DATE:20260622");
  });

  it("includes festival name in SUMMARY", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("SUMMARY:Hellfest Open Air 2026");
  });

  it("includes location with city and country", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("LOCATION:Clisson, France");
  });

  it("includes URL with baseUrl", () => {
    const ics = buildFestivalIcs(FESTIVAL, "https://app.mycrewfest.com");
    expect(ics).toContain("URL:https://app.mycrewfest.com/festival/hellfest-2026");
  });

  it("includes relative URL without baseUrl", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("URL:/festival/hellfest-2026");
  });

  it("includes UID based on slug", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("UID:hellfest-2026@mycrewfest.com");
  });

  it("escapes commas in description", () => {
    const festWithComma: FestivalIcsInput = {
      ...FESTIVAL,
      description: "Musique, metal, culture.",
    };
    const ics = buildFestivalIcs(festWithComma);
    expect(ics).toContain("Musique\\, metal\\, culture.");
  });

  it("uses CRLF line endings (RFC 5545)", () => {
    const ics = buildFestivalIcs(FESTIVAL);
    expect(ics).toContain("\r\n");
  });

  it("works without description", () => {
    const { description: _, ...noDesc } = FESTIVAL;
    const ics = buildFestivalIcs(noDesc);
    expect(ics).toContain("DESCRIPTION:");
    expect(ics).toContain("Clisson, France"); // fallback
  });
});

describe("festivalIcsFilename", () => {
  it("returns slug.ics", () => {
    expect(festivalIcsFilename("hellfest-2026")).toBe("hellfest-2026.ics");
  });
});
