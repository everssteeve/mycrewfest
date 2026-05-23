import { describe, expect, it } from "vitest";
import {
  countCrewAdmins,
  countCrewMembersActiveGeoloc,
  countCrewMembersWithGeoloc,
} from "@/lib/crew-stats";

// ---------------------------------------------------------------------------
// countCrewAdmins
// ---------------------------------------------------------------------------

describe("countCrewAdmins", () => {
  it("returns 0 for empty list", () => {
    expect(countCrewAdmins([])).toBe(0);
  });

  it("returns 0 when no member is admin", () => {
    expect(countCrewAdmins([{ role: "membre" }, { role: "membre" }])).toBe(0);
  });

  it("counts admin members correctly", () => {
    const members = [{ role: "admin" }, { role: "membre" }, { role: "admin" }];
    expect(countCrewAdmins(members)).toBe(2);
  });

  it("returns total when all are admins", () => {
    expect(countCrewAdmins([{ role: "admin" }, { role: "admin" }])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countCrewMembersWithGeoloc
// ---------------------------------------------------------------------------

describe("countCrewMembersWithGeoloc", () => {
  it("returns 0 for empty list", () => {
    expect(countCrewMembersWithGeoloc([])).toBe(0);
  });

  it("returns 0 when all members have geoloc off", () => {
    expect(countCrewMembersWithGeoloc([{ geolocStatus: "off" }, { geolocStatus: "off" }])).toBe(0);
  });

  it("counts active geoloc members", () => {
    const members = [
      { geolocStatus: "active" },
      { geolocStatus: "off" },
      { geolocStatus: "background" },
    ];
    expect(countCrewMembersWithGeoloc(members)).toBe(2);
  });

  it("counts background geoloc as sharing", () => {
    expect(countCrewMembersWithGeoloc([{ geolocStatus: "background" }])).toBe(1);
  });

  it("returns total when all share location", () => {
    const members = [{ geolocStatus: "active" }, { geolocStatus: "background" }];
    expect(countCrewMembersWithGeoloc(members)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// countCrewMembersActiveGeoloc
// ---------------------------------------------------------------------------

describe("countCrewMembersActiveGeoloc", () => {
  it("returns 0 for empty list", () => {
    expect(countCrewMembersActiveGeoloc([])).toBe(0);
  });

  it("returns 0 when no member has active geoloc", () => {
    const members = [{ geolocStatus: "off" }, { geolocStatus: "background" }];
    expect(countCrewMembersActiveGeoloc(members)).toBe(0);
  });

  it("counts only active geoloc members", () => {
    const members = [
      { geolocStatus: "active" },
      { geolocStatus: "off" },
      { geolocStatus: "active" },
      { geolocStatus: "background" },
    ];
    expect(countCrewMembersActiveGeoloc(members)).toBe(2);
  });

  it("returns total when all are active", () => {
    expect(
      countCrewMembersActiveGeoloc([{ geolocStatus: "active" }, { geolocStatus: "active" }]),
    ).toBe(2);
  });
});
