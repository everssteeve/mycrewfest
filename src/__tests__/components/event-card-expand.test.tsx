import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventWithSelectionAndConfidence } from "@/components/festevent/event-card";
import { EventCard } from "@/components/festevent/event-card";

function makeEvent(
  override: Partial<EventWithSelectionAndConfidence> = {},
): EventWithSelectionAndConfidence {
  return {
    id: "evt-1",
    title: "Test Concert",
    eventType: "concert",
    startTime: "2026-07-15T20:00:00",
    endTime: null,
    durationMins: 90,
    access: "inclus",
    status: "confirmé",
    confidence: "vérifié_humain",
    tags: [],
    venue: null,
    artist: null,
    selection: null,
    ...override,
  };
}

const onSelectionCycle = vi.fn();

describe("EventCard — expand artist details", () => {
  it("does not show expand button when artist has no details", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: null,
            disciplines: [],
            countryCode: null,
            siteUrl: null,
            instagram: null,
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    expect(screen.queryByRole("button", { name: /voir plus/i })).toBeNull();
  });

  it("shows expand button when artist has a description", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: "Un super artiste",
            disciplines: [],
            countryCode: null,
            siteUrl: null,
            instagram: null,
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    expect(screen.getByRole("button", { name: /voir les détails/i })).toBeTruthy();
  });

  it("shows expand button when artist has disciplines", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: null,
            disciplines: ["hip-hop"],
            countryCode: null,
            siteUrl: null,
            instagram: null,
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    expect(screen.getByRole("button", { name: /voir les détails/i })).toBeTruthy();
  });

  it("reveals artist description on click", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: "Bio secrète de l'artiste",
            disciplines: [],
            countryCode: null,
            siteUrl: null,
            instagram: null,
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    expect(screen.queryByText(/Bio secrète/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /voir les détails/i }));
    expect(screen.getByText(/Bio secrète/)).toBeTruthy();
  });

  it("shows 'Réduire' button after expanding", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: "Bio",
            disciplines: [],
            countryCode: null,
            siteUrl: null,
            instagram: null,
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /voir les détails/i }));
    expect(screen.getByRole("button", { name: /réduire/i })).toBeTruthy();
  });

  it("shows discipline chips in expanded panel", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: null,
            disciplines: ["danse", "cirque"],
            countryCode: "FR",
            siteUrl: null,
            instagram: null,
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /voir les détails/i }));
    expect(screen.getByText("danse")).toBeTruthy();
    expect(screen.getByText("cirque")).toBeTruthy();
    expect(screen.getByText("FR")).toBeTruthy();
  });

  it("shows instagram link when available", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: null,
            disciplines: [],
            countryCode: null,
            siteUrl: null,
            instagram: "superartiste",
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /voir les détails/i }));
    const link = screen.getByRole("link", { name: /instagram/i });
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).href).toContain("instagram.com/superartiste");
  });

  it("handles instagram handle with leading @ sign", () => {
    render(
      <EventCard
        event={makeEvent({
          artist: {
            id: "a1",
            name: "Artiste",
            description: null,
            disciplines: [],
            countryCode: null,
            siteUrl: null,
            instagram: "@monartiste",
          },
        })}
        onSelectionCycle={onSelectionCycle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /voir les détails/i }));
    const link = screen.getByRole("link", { name: /instagram/i });
    expect((link as HTMLAnchorElement).href).toContain("instagram.com/monartiste");
    expect((link as HTMLAnchorElement).href).not.toContain("@");
  });
});
