import { describe, it, expect } from "vitest";
import {
  extractFestEventId,
  buildContextualHref,
  isTabActive,
} from "@/lib/bottom-nav";

// ---------------------------------------------------------------------------
// extractFestEventId
// ---------------------------------------------------------------------------

describe("extractFestEventId", () => {
  it("returns null for root path", () => {
    expect(extractFestEventId("/")).toBeNull();
  });

  it("returns null for catalogue", () => {
    expect(extractFestEventId("/catalogue")).toBeNull();
  });

  it("returns null for profil", () => {
    expect(extractFestEventId("/profil")).toBeNull();
  });

  it("extracts id from festevent root", () => {
    expect(extractFestEventId("/festevent/abc123")).toBe("abc123");
  });

  it("extracts id from festevent with sub-route", () => {
    expect(extractFestEventId("/festevent/abc123/programme")).toBe("abc123");
  });

  it("extracts id from festevent with deep sub-route", () => {
    expect(extractFestEventId("/festevent/xyz-456/planning")).toBe("xyz-456");
  });

  it("extracts id with alphanumeric and dashes", () => {
    expect(extractFestEventId("/festevent/cm9abc123/crew")).toBe("cm9abc123");
  });

  it("returns null for paths that start with festevent but are not /festevent/", () => {
    expect(extractFestEventId("/festevents/foo")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildContextualHref
// ---------------------------------------------------------------------------

describe("buildContextualHref", () => {
  it("returns fallback when festEventId is null", () => {
    expect(buildContextualHref("programme", null, "/catalogue")).toBe("/catalogue");
  });

  it("builds fest event href when festEventId is provided", () => {
    expect(buildContextualHref("programme", "abc123", "/catalogue")).toBe(
      "/festevent/abc123/programme",
    );
  });

  it("builds carte href correctly", () => {
    expect(buildContextualHref("carte", "fest-42", "/catalogue")).toBe(
      "/festevent/fest-42/carte",
    );
  });

  it("builds crew href correctly", () => {
    expect(buildContextualHref("crew", "xyz", "/profil")).toBe(
      "/festevent/xyz/crew",
    );
  });

  it("returns fallback for crew when outside fest event", () => {
    expect(buildContextualHref("crew", null, "/profil")).toBe("/profil");
  });
});

// ---------------------------------------------------------------------------
// isTabActive
// ---------------------------------------------------------------------------

describe("isTabActive", () => {
  it("matches exact href prefix", () => {
    expect(isTabActive("/catalogue", "/catalogue")).toBe(true);
  });

  it("matches sub-path of href", () => {
    expect(isTabActive("/catalogue/foo", "/catalogue")).toBe(true);
  });

  it("does not match unrelated path", () => {
    expect(isTabActive("/profil", "/catalogue")).toBe(false);
  });

  it("matches contextually when inside a fest event with matching section", () => {
    expect(isTabActive("/festevent/abc123/programme", "/festevent/abc123/programme", "programme")).toBe(true);
  });

  it("matches contextually for any fest event with the same section", () => {
    expect(isTabActive("/festevent/xyz/carte", "/festevent/abc123/carte", "carte")).toBe(true);
  });

  it("does not match wrong section in same fest event", () => {
    expect(isTabActive("/festevent/abc123/planning", "/festevent/abc123/programme", "programme")).toBe(false);
  });

  it("home tab is active on catalogue", () => {
    expect(isTabActive("/catalogue", "/catalogue")).toBe(true);
  });

  it("profil tab is active on profil sub-routes", () => {
    expect(isTabActive("/profil", "/profil")).toBe(true);
  });
});
