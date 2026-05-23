/**
 * Tests for /api/crews, /api/crews/join, /api/crews/[crewId]/rally,
 * and /api/crews/[crewId]/position route handlers.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", () => ({
  prisma: {
    crew: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crewMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    festEvent: {
      findFirst: vi.fn(),
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

const crewRow = {
  id: "crew-1",
  name: "Les Festivaliers",
  inviteCode: "ABCD1234",
  rallyLatitude: null,
  rallyLongitude: null,
  rallyDescription: null,
  members: [
    {
      id: "cm-1",
      userId: "user-1",
      role: "admin",
      geolocStatus: "off",
      isPrivate: false,
      user: { name: "Alice", image: null },
    },
  ],
};

// ---------------------------------------------------------------------------
// Import route handlers
// ---------------------------------------------------------------------------

const { GET: getCrews, POST: postCrew } = await import("@/app/api/crews/route");
const { POST: postJoin } = await import("@/app/api/crews/join/route");
const { PUT: putRally } = await import("@/app/api/crews/[crewId]/rally/route");
const { POST: postPosition, GET: getPositions } = await import(
  "@/app/api/crews/[crewId]/position/route"
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function getPrismaMock() {
  const { prisma } = await import("@/lib/prisma");
  return prisma as {
    crew: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    crewMember: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    festEvent: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
}

async function getAuthMock() {
  const { auth } = await import("@/auth");
  return auth as ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// POST /api/crews
// ---------------------------------------------------------------------------

describe("POST /api/crews", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue({ id: "fe-1", crewId: null });
    prisma.crew.create.mockResolvedValue(crewRow);
    prisma.festEvent.update.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews", {
      method: "POST",
      body: JSON.stringify({ name: "Ma Crew", festEventId: "fe-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCrew(req);
    expect(res.status).toBe(401);
  });

  it("creates a crew with unique inviteCode and returns 201", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews", {
      method: "POST",
      body: JSON.stringify({ name: "Ma Crew", festEventId: "fe-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCrew(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id", "crew-1");
    expect(body).toHaveProperty("inviteCode");
    expect(body).toHaveProperty("members");
    expect(Array.isArray(body.members)).toBe(true);
  });

  it("returns 422 when name is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews", {
      method: "POST",
      body: JSON.stringify({ festEventId: "fe-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCrew(req);
    expect(res.status).toBe(422);
  });

  it("returns 404 when FestEvent not found", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews", {
      method: "POST",
      body: JSON.stringify({ name: "Ma Crew", festEventId: "fe-unknown" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCrew(req);
    expect(res.status).toBe(404);
  });

  it("returns 409 when FestEvent already linked to a crew", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce({
      id: "fe-1",
      crewId: "crew-existing",
    });

    const req = new NextRequest("http://localhost:3000/api/crews", {
      method: "POST",
      body: JSON.stringify({ name: "Ma Crew", festEventId: "fe-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCrew(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toHaveProperty("crewId", "crew-existing");
  });
});

// ---------------------------------------------------------------------------
// POST /api/crews/join
// ---------------------------------------------------------------------------

describe("POST /api/crews/join", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.crew.findFirst.mockResolvedValue({
      ...crewRow,
      members: [{ userId: "user-other" }],
    });
    prisma.crewMember.create.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: "ABCD1234" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postJoin(req);
    expect(res.status).toBe(401);
  });

  it("joins a crew with a valid inviteCode and returns 200", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: "ABCD1234" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postJoin(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("joined", true);
    expect(body).toHaveProperty("crewId", "crew-1");
  });

  it("returns 404 for an invalid inviteCode", async () => {
    const prisma = await getPrismaMock();
    prisma.crew.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: "BADCODE" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postJoin(req);
    expect(res.status).toBe(404);
  });

  it("returns alreadyMember:true when user is already in the crew", async () => {
    const prisma = await getPrismaMock();
    prisma.crew.findFirst.mockResolvedValueOnce({
      ...crewRow,
      members: [{ userId: "user-1" }], // already a member
    });

    const req = new NextRequest("http://localhost:3000/api/crews/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: "ABCD1234" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postJoin(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("alreadyMember", true);
  });

  it("links crew to FestEvent when festEventId is provided", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue({ id: "fe-1" });
    prisma.festEvent.update.mockResolvedValue({});

    const req = new NextRequest("http://localhost:3000/api/crews/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode: "ABCD1234", festEventId: "fe-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postJoin(req);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/crews/[crewId]/rally
// ---------------------------------------------------------------------------

describe("PUT /api/crews/[crewId]/rally", () => {
  const routeCtx = { params: Promise.resolve({ crewId: "crew-1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.crewMember.findFirst.mockResolvedValue({
      id: "cm-1",
      userId: "user-1",
      crewId: "crew-1",
      role: "admin",
    });
    prisma.crew.update.mockResolvedValue({
      rallyLatitude: 47.09,
      rallyLongitude: -1.28,
      rallyDescription: "Entrée principale",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/rally", {
      method: "PUT",
      body: JSON.stringify({ lat: 47.09, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putRally(req, routeCtx);
    expect(res.status).toBe(401);
  });

  it("updates rally point and returns 200 with coords", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/rally", {
      method: "PUT",
      body: JSON.stringify({
        lat: 47.09,
        lng: -1.28,
        description: "Entrée principale",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putRally(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("lat", 47.09);
    expect(body).toHaveProperty("lng", -1.28);
  });

  it("returns 403 when user is not a member of the crew", async () => {
    const prisma = await getPrismaMock();
    prisma.crewMember.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/rally", {
      method: "PUT",
      body: JSON.stringify({ lat: 47.09, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putRally(req, routeCtx);
    expect(res.status).toBe(403);
  });

  it("returns 403 when user is not the admin", async () => {
    const prisma = await getPrismaMock();
    prisma.crewMember.findFirst.mockResolvedValueOnce({
      id: "cm-2",
      userId: "user-1",
      crewId: "crew-1",
      role: "membre", // not admin
    });

    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/rally", {
      method: "PUT",
      body: JSON.stringify({ lat: 47.09, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putRally(req, routeCtx);
    expect(res.status).toBe(403);
  });

  it("returns 422 when lat/lng are missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/rally", {
      method: "PUT",
      body: JSON.stringify({ description: "Entrée" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putRally(req, routeCtx);
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// POST /api/crews/[crewId]/position
// ---------------------------------------------------------------------------

describe("POST /api/crews/[crewId]/position", () => {
  const routeCtx = { params: Promise.resolve({ crewId: "crew-1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.crewMember.findFirst.mockResolvedValue({
      id: "cm-1",
      userId: "user-1",
      crewId: "crew-1",
    });
    prisma.crewMember.update.mockResolvedValue({});
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/position", {
      method: "POST",
      body: JSON.stringify({ lat: 47.09, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPosition(req, routeCtx);
    expect(res.status).toBe(401);
  });

  it("updates GPS position and returns updated:true", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/position", {
      method: "POST",
      body: JSON.stringify({ lat: 47.09, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPosition(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("updated", true);
  });

  it("returns 403 when user is not in the crew", async () => {
    const prisma = await getPrismaMock();
    prisma.crewMember.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/position", {
      method: "POST",
      body: JSON.stringify({ lat: 47.09, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPosition(req, routeCtx);
    expect(res.status).toBe(403);
  });

  it("returns 422 for invalid lat/lng (out of range)", async () => {
    const req = new NextRequest("http://localhost:3000/api/crews/crew-1/position", {
      method: "POST",
      body: JSON.stringify({ lat: 999, lng: -1.28 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postPosition(req, routeCtx);
    expect(res.status).toBe(422);
  });
});
