import { describe, it, expect } from "vitest";
import { buildArtistSharePayload } from "@/lib/share";

describe("buildArtistSharePayload", () => {
  it("builds the correct share URL", () => {
    const payload = buildArtistSharePayload("Gojira", "abc123");
    expect(payload.url).toBe("/artiste/abc123");
    expect(payload.title).toBe("Gojira");
  });

  it("includes the artist name in the share text", () => {
    const payload = buildArtistSharePayload("Rammstein", "xyz");
    expect(payload.text).toContain("Rammstein");
    expect(payload.text).toContain("MyCrewFest");
  });

  it("prepends baseUrl when provided", () => {
    const payload = buildArtistSharePayload("Amon Amarth", "id1", "https://mycrewfest.com");
    expect(payload.url).toBe("https://mycrewfest.com/artiste/id1");
  });

  it("works with empty baseUrl (default)", () => {
    const payload = buildArtistSharePayload("Artist", "id2");
    expect(payload.url).toMatch(/^\/artiste\//);
  });
});
