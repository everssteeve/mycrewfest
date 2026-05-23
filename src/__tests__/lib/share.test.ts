import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildArtistSharePayload,
  buildFestivalSharePayload,
  type SharePayload,
  shareOrCopy,
} from "@/lib/share";

const PAYLOAD: SharePayload = {
  title: "Hellfest 2026",
  text: "Découvre Hellfest 2026 sur MyCrewFest",
  url: "https://app.mycrewfest.com/festival/hellfest-2026",
};

// ---------------------------------------------------------------------------
// buildFestivalSharePayload
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// buildArtistSharePayload
// ---------------------------------------------------------------------------

describe("buildArtistSharePayload", () => {
  it("builds correct payload with baseUrl", () => {
    const p = buildArtistSharePayload("Orelsan", "artist-orelsan", "https://app.mycrewfest.com");
    expect(p.title).toBe("Orelsan");
    expect(p.url).toBe("https://app.mycrewfest.com/artiste/artist-orelsan");
    expect(p.text).toContain("Orelsan");
  });

  it("builds relative payload without baseUrl", () => {
    const p = buildArtistSharePayload("Orelsan", "artist-orelsan");
    expect(p.url).toBe("/artiste/artist-orelsan");
  });

  it("includes artist name in text", () => {
    const p = buildArtistSharePayload("Aya Nakamura", "artist-aya");
    expect(p.text).toContain("Aya Nakamura");
  });
});

// ---------------------------------------------------------------------------
// buildFestivalSharePayload
// ---------------------------------------------------------------------------

describe("buildFestivalSharePayload", () => {
  it("builds the correct payload with baseUrl", () => {
    const p = buildFestivalSharePayload(
      "Hellfest 2026",
      "hellfest-2026",
      "https://app.mycrewfest.com",
    );
    expect(p.title).toBe("Hellfest 2026");
    expect(p.url).toBe("https://app.mycrewfest.com/festival/hellfest-2026");
    expect(p.text).toContain("Hellfest 2026");
  });

  it("builds the correct payload without baseUrl (relative)", () => {
    const p = buildFestivalSharePayload("Hellfest", "hellfest");
    expect(p.url).toBe("/festival/hellfest");
  });
});

// ---------------------------------------------------------------------------
// shareOrCopy — clipboard fallback
// ---------------------------------------------------------------------------

describe("shareOrCopy — clipboard fallback", () => {
  beforeEach(() => {
    // Simulate no native share API
    Object.defineProperty(globalThis.navigator, "share", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it("returns 'copied' when clipboard succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    const result = await shareOrCopy(PAYLOAD);
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(PAYLOAD.url);
  });

  it("returns 'unavailable' when clipboard fails", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
      writable: true,
    });

    const result = await shareOrCopy(PAYLOAD);
    expect(result).toBe("unavailable");
  });

  it("returns 'unavailable' when neither share nor clipboard is available", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const result = await shareOrCopy(PAYLOAD);
    expect(result).toBe("unavailable");
  });
});

// ---------------------------------------------------------------------------
// shareOrCopy — Web Share API
// ---------------------------------------------------------------------------

describe("shareOrCopy — Web Share API", () => {
  it("returns 'shared' when navigator.share succeeds", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "share", {
      value: shareMock,
      configurable: true,
      writable: true,
    });

    const result = await shareOrCopy(PAYLOAD);
    expect(result).toBe("shared");
    expect(shareMock).toHaveBeenCalledWith(PAYLOAD);
  });

  it("returns 'cancelled' when user aborts the share sheet", async () => {
    const abort = new DOMException("share cancelled", "AbortError");
    Object.defineProperty(globalThis.navigator, "share", {
      value: vi.fn().mockRejectedValue(abort),
      configurable: true,
      writable: true,
    });
    // Also provide clipboard so we know we're testing abort path, not fallback
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });

    const result = await shareOrCopy(PAYLOAD);
    expect(result).toBe("cancelled");
  });

  it("falls back to clipboard when navigator.share throws a non-abort error", async () => {
    Object.defineProperty(globalThis.navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("NotAllowedError")),
      configurable: true,
      writable: true,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    const result = await shareOrCopy(PAYLOAD);
    expect(result).toBe("copied");
  });
});
