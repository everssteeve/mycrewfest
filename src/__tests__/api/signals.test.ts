/**
 * Tests for /api/signals route handler.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", () => ({
  prisma: {
    signal: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@mycrewfest.dev" },
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const signalRow = {
  id: "sig-1",
  authorId: "user-1",
  scope: "communauté",
  festivalId: null,
  crewId: null,
  venueId: null,
  eventId: null,
  latitude: 47.09,
  longitude: -1.28,
  description: "Super food truck !",
  discoveryType: "nourriture",
  predefinedPhrase: null,
  confirmations: 0,
  infirmations: 0,
  createdAt: new Date("2026-07-01T15:00:00Z"),
  expiresAt: new Date("2026-07-01T16:00:00Z"),
};

// ---------------------------------------------------------------------------
// Import route handler
// ---------------------------------------------------------------------------

const { POST: postSignal } = await import("@/app/api/signals/route");

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function getPrismaMock() {
  const { prisma } = await import("@/lib/prisma");
  return prisma as {
    signal: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
}

async function getAuthMock() {
  const { auth } = await import("@/auth");
  return auth as ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// POST /api/signals
// ---------------------------------------------------------------------------

describe("POST /api/signals", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.signal.create.mockResolvedValue(signalRow);
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "communauté",
        latitude: 47.09,
        longitude: -1.28,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(401);
  });

  it("creates a community signal and returns 201 with signal data", async () => {
    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "communauté",
        latitude: 47.09,
        longitude: -1.28,
        description: "Super food truck !",
        discoveryType: "nourriture",
        expiresInMins: 60,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id", "sig-1");
    expect(body).toHaveProperty("scope", "communauté");
    expect(body).toHaveProperty("latitude", 47.09);
    expect(body).toHaveProperty("longitude", -1.28);
    expect(body).toHaveProperty("confirmations", 0);
    expect(body).toHaveProperty("expiresAt");
    expect(body).toHaveProperty("createdAt");
  });

  it("creates a crew-scoped signal", async () => {
    const crewSignalRow = { ...signalRow, scope: "crew", crewId: "crew-1" };
    const prisma = await getPrismaMock();
    prisma.signal.create.mockResolvedValueOnce(crewSignalRow);

    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "crew",
        crewId: "crew-1",
        latitude: 47.09,
        longitude: -1.28,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("scope", "crew");
  });

  it("returns 400 when scope is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        latitude: 47.09,
        longitude: -1.28,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when latitude is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "communauté",
        longitude: -1.28,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when longitude is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "communauté",
        latitude: 47.09,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: "not-valid-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await postSignal(req);
    expect(res.status).toBe(400);
  });

  it("sets default expiresAt to 60 minutes from now when expiresInMins not provided", async () => {
    const before = Date.now();

    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "communauté",
        latitude: 47.09,
        longitude: -1.28,
      }),
      headers: { "Content-Type": "application/json" },
    });
    await postSignal(req);

    const prisma = await getPrismaMock();
    const createCall = prisma.signal.create.mock.calls[0][0];
    const expiresAt = createCall?.data?.expiresAt as Date;

    expect(expiresAt).toBeInstanceOf(Date);
    const diffMs = expiresAt.getTime() - before;
    // Should be approximately 60 minutes (allow ±5s of tolerance)
    expect(diffMs).toBeGreaterThanOrEqual(60 * 60_000 - 5000);
    expect(diffMs).toBeLessThanOrEqual(60 * 60_000 + 5000);
  });

  it("passes optional fields (festivalId, venueId, eventId) to Prisma create", async () => {
    const req = new NextRequest("http://localhost:3000/api/signals", {
      method: "POST",
      body: JSON.stringify({
        scope: "communauté",
        festivalId: "fes-1",
        venueId: "venue-1",
        eventId: "event-1",
        latitude: 47.09,
        longitude: -1.28,
      }),
      headers: { "Content-Type": "application/json" },
    });
    await postSignal(req);

    const prisma = await getPrismaMock();
    const createData = prisma.signal.create.mock.calls[0][0].data;
    expect(createData.festivalId).toBe("fes-1");
    expect(createData.venueId).toBe("venue-1");
    expect(createData.eventId).toBe("event-1");
  });
});
