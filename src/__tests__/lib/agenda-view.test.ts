import { describe, it, expect } from "vitest";
import {
  formatAgendaDayLabel,
  getDateKey,
  groupEventsByDay,
  countByStatus,
  buildAgendaFestival,
  sortFestivalsByStartDate,
  getTotalEventCount,
  type AgendaEvent,
} from "@/lib/agenda-view";

const makeEvent = (
  id: string,
  startTime: string | null,
  status: AgendaEvent["status"] = "must-see"
): AgendaEvent => ({
  id,
  title: `Event ${id}`,
  startTime,
  endTime: null,
  status,
  venue: null,
  artist: null,
});

describe("formatAgendaDayLabel", () => {
  it("formats a date key correctly", () => {
    // 2026-07-16 is a Thursday (jeudi)
    expect(formatAgendaDayLabel("2026-07-16")).toBe("jeudi 16 juillet");
  });

  it("formats another date correctly", () => {
    // 2026-08-29 is a Saturday (samedi)
    expect(formatAgendaDayLabel("2026-08-29")).toBe("samedi 29 août");
  });
});

describe("getDateKey", () => {
  it("extracts date part from ISO string", () => {
    expect(getDateKey("2026-07-16T19:00:00Z")).toBe("2026-07-16");
  });

  it("works with full datetime", () => {
    expect(getDateKey("2026-08-28T21:30:00.000Z")).toBe("2026-08-28");
  });
});

describe("groupEventsByDay", () => {
  it("groups events by their date", () => {
    const events = [
      makeEvent("a", "2026-07-16T19:00:00Z"),
      makeEvent("b", "2026-07-16T21:00:00Z"),
      makeEvent("c", "2026-07-17T20:00:00Z"),
    ];
    const days = groupEventsByDay(events);
    expect(days).toHaveLength(2);
    expect(days[0]!.dateKey).toBe("2026-07-16");
    expect(days[0]!.events).toHaveLength(2);
    expect(days[1]!.dateKey).toBe("2026-07-17");
  });

  it("sorts days chronologically", () => {
    const events = [
      makeEvent("a", "2026-07-18T19:00:00Z"),
      makeEvent("b", "2026-07-16T21:00:00Z"),
    ];
    const days = groupEventsByDay(events);
    expect(days[0]!.dateKey).toBe("2026-07-16");
    expect(days[1]!.dateKey).toBe("2026-07-18");
  });

  it("sorts events within a day by startTime", () => {
    const events = [
      makeEvent("later", "2026-07-16T22:00:00Z"),
      makeEvent("earlier", "2026-07-16T19:00:00Z"),
    ];
    const days = groupEventsByDay(events);
    expect(days[0]!.events[0]!.id).toBe("earlier");
    expect(days[0]!.events[1]!.id).toBe("later");
  });

  it("puts events without startTime in sans-date group, at end", () => {
    const events = [
      makeEvent("dated", "2026-07-16T19:00:00Z"),
      makeEvent("undated", null),
    ];
    const days = groupEventsByDay(events);
    expect(days[0]!.dateKey).toBe("2026-07-16");
    expect(days[1]!.dateKey).toBe("sans-date");
    expect(days[1]!.label).toBe("Date non définie");
  });

  it("returns empty array for empty input", () => {
    expect(groupEventsByDay([])).toHaveLength(0);
  });
});

describe("countByStatus", () => {
  it("counts must-see events", () => {
    const events = [
      makeEvent("a", null, "must-see"),
      makeEvent("b", null, "intéressé"),
      makeEvent("c", null, "must-see"),
    ];
    expect(countByStatus(events, "must-see")).toBe(2);
    expect(countByStatus(events, "intéressé")).toBe(1);
  });

  it("returns 0 for empty list", () => {
    expect(countByStatus([], "must-see")).toBe(0);
  });
});

describe("buildAgendaFestival", () => {
  it("excludes vu events from days", () => {
    const events = [
      makeEvent("a", "2026-07-16T19:00:00Z", "must-see"),
      makeEvent("b", "2026-07-16T21:00:00Z", "vu"),
    ];
    const fest = buildAgendaFestival("fe1", "WLG", "wlg", "2026-07-16", "2026-07-19", events);
    expect(fest.mustSeeCount).toBe(1);
    expect(fest.days[0]!.events).toHaveLength(1);
  });

  it("sets counts correctly", () => {
    const events = [
      makeEvent("a", null, "must-see"),
      makeEvent("b", null, "must-see"),
      makeEvent("c", null, "intéressé"),
    ];
    const fest = buildAgendaFestival("fe1", "Test", "test", "2026-07-16", "2026-07-19", events);
    expect(fest.mustSeeCount).toBe(2);
    expect(fest.intéresséCount).toBe(1);
  });
});

describe("sortFestivalsByStartDate", () => {
  it("sorts by startDate ascending", () => {
    const festivals = [
      { festEventId: "f2", festivalName: "Later", festivalSlug: "later", startDate: "2026-08-01", endDate: "2026-08-04", days: [], mustSeeCount: 0, intéresséCount: 0 },
      { festEventId: "f1", festivalName: "Earlier", festivalSlug: "earlier", startDate: "2026-07-01", endDate: "2026-07-04", days: [], mustSeeCount: 0, intéresséCount: 0 },
    ];
    const sorted = sortFestivalsByStartDate(festivals);
    expect(sorted[0]!.festEventId).toBe("f1");
    expect(sorted[1]!.festEventId).toBe("f2");
  });
});

describe("getTotalEventCount", () => {
  it("sums mustSee + intéressé across all festivals", () => {
    const festivals = [
      { festEventId: "f1", festivalName: "A", festivalSlug: "a", startDate: "", endDate: "", days: [], mustSeeCount: 3, intéresséCount: 2 },
      { festEventId: "f2", festivalName: "B", festivalSlug: "b", startDate: "", endDate: "", days: [], mustSeeCount: 1, intéresséCount: 4 },
    ];
    expect(getTotalEventCount(festivals)).toBe(10);
  });

  it("returns 0 for empty list", () => {
    expect(getTotalEventCount([])).toBe(0);
  });
});
