import { beforeEach, describe, expect, it } from "vitest";
import { useFestEventStore } from "@/store/use-fest-event-store";

// Reset store state between tests
beforeEach(() => {
  useFestEventStore.setState({
    activeFestEvent: null,
    selections: {},
    comfortMarginMins: 15,
    presenceDates: [],
    arrivalConstraint: null,
    departureConstraint: null,
  });
});

describe("useFestEventStore", () => {
  it("updateSelection(eventId, 'must-see') adds the selection", () => {
    useFestEventStore.getState().updateSelection("ev-1", "must-see");
    const { selections } = useFestEventStore.getState();
    expect(selections["ev-1"]).toBe("must-see");
  });

  it("updateSelection(eventId, 'intéressé') stores the correct status", () => {
    useFestEventStore.getState().updateSelection("ev-2", "intéressé");
    expect(useFestEventStore.getState().selections["ev-2"]).toBe("intéressé");
  });

  it("updateSelection(eventId, null) removes the selection", () => {
    useFestEventStore.setState({ selections: { "ev-1": "must-see" } });
    useFestEventStore.getState().updateSelection("ev-1", null);
    const { selections } = useFestEventStore.getState();
    expect("ev-1" in selections).toBe(false);
  });

  it("updateSelection null on non-existing key is a no-op", () => {
    useFestEventStore.getState().updateSelection("ev-99", null);
    expect(useFestEventStore.getState().selections).toEqual({});
  });

  it("multiple selections can coexist", () => {
    useFestEventStore.getState().updateSelection("ev-1", "must-see");
    useFestEventStore.getState().updateSelection("ev-2", "intéressé");
    useFestEventStore.getState().updateSelection("ev-3", "vu");
    const { selections } = useFestEventStore.getState();
    expect(selections["ev-1"]).toBe("must-see");
    expect(selections["ev-2"]).toBe("intéressé");
    expect(selections["ev-3"]).toBe("vu");
  });

  it("setComfortMargin(30) sets comfortMarginMins to 30", () => {
    useFestEventStore.getState().setComfortMargin(30);
    expect(useFestEventStore.getState().comfortMarginMins).toBe(30);
  });

  it("setComfortMargin updates value correctly", () => {
    useFestEventStore.getState().setComfortMargin(5);
    expect(useFestEventStore.getState().comfortMarginMins).toBe(5);
    useFestEventStore.getState().setComfortMargin(20);
    expect(useFestEventStore.getState().comfortMarginMins).toBe(20);
  });

  it("setPresenceDates stores the dates array", () => {
    useFestEventStore.getState().setPresenceDates(["2025-06-15", "2025-06-16"]);
    expect(useFestEventStore.getState().presenceDates).toEqual(["2025-06-15", "2025-06-16"]);
  });

  it("setActiveFestEvent sets the active fest event", () => {
    const fe = {
      id: "fe-1",
      festivalId: "fes-1",
      festival: {
        id: "fes-1",
        name: "Test Festival",
        slug: "test-festival",
        startDate: "2025-06-15",
        endDate: "2025-06-17",
        city: "Paris",
        country: "France",
        festivalType: "musique" as const,
        programType: "structuré" as const,
        programStatus: "complet" as const,
        confidenceLevel: "auto" as const,
      },
      mode: "solo" as const,
      presenceDates: [],
      comfortMarginMins: 15,
      createdAt: new Date().toISOString(),
      events: [],
      selections: {},
    };
    useFestEventStore.getState().setActiveFestEvent(fe);
    expect(useFestEventStore.getState().activeFestEvent?.id).toBe("fe-1");
  });
});
