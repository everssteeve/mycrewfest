/**
 * Tests for /api/festevents and /api/festevents/[id] route handlers.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", () => ({
  prisma: {
    festEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    festival: {
      findUnique: vi.fn(),
    },
  },
}));

// Authenticated session by default
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@mycrewfest.dev" },
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const festivalRow = {
  id: "fes-1",
  name: "Hellfest",
  slug: "hellfest",
  description: "Le festival du métal",
  startDate: new Date("2026-06-19"),
  endDate: new Date("2026-06-22"),
  city: "Clisson",
  country: "France",
  latitude: 47.09,
  longitude: -1.28,
  festivalType: "musique",
  programType: "structuré",
  programStatus: "complet",
  ingestionStatus: "ingéré",
  confidenceLevel: "vérifié_humain",
  capacity: 60000,
  siteUrl: "https://hellfest.fr",
  instagramHandle: "@hellfest",
};

const festEventRow = {
  id: "fe-1",
  userId: "user-1",
  festivalId: "fes-1",
  mode: "solo",
  programTypeOverride: null,
  presenceDates: null,
  arrivalConstraint: null,
  departureConstraint: null,
  comfortMarginMins: 15,
  shareToken: "share-abc123",
  crewId: null,
  createdAt: new Date("2026-05-01T10:00:00Z"),
  updatedAt: new Date("2026-05-01T10:00:00Z"),
  festival: festivalRow,
  selections: [],
  _count: { selections: 0 },
};

// ---------------------------------------------------------------------------
// Import route handlers
// ---------------------------------------------------------------------------

const { GET: getList, POST: postCreate } = await import("@/app/api/festevents/route");
const {
  GET: getById,
  DELETE: deleteById,
  PUT: putById,
} = await import("@/app/api/festevents/[id]/route");

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function getPrismaMock() {
  const { prisma } = await import("@/lib/prisma");
  return prisma as {
    festEvent: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    festival: { findUnique: ReturnType<typeof vi.fn> };
  };
}

async function getAuthMock() {
  const { auth } = await import("@/auth");
  return auth as ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// GET /api/festevents
// ---------------------------------------------------------------------------

describe("GET /api/festevents", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findMany.mockResolvedValue([festEventRow]);
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents");
    const res = await getList(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with list of FestEvents", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents");
    const res = await getList(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("fe-1");
  });

  it("returns 500 on Prisma error", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findMany.mockRejectedValueOnce(new Error("DB crash"));

    const req = new NextRequest("http://localhost:3000/api/festevents");
    const res = await getList(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// POST /api/festevents
// ---------------------------------------------------------------------------

describe("POST /api/festevents", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festival.findUnique.mockResolvedValue({ id: "fes-1" });
    prisma.festEvent.findFirst.mockResolvedValue(null); // no existing
    prisma.festEvent.create.mockResolvedValue({ id: "fe-new" });
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents", {
      method: "POST",
      body: JSON.stringify({ festivalSlug: "hellfest" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCreate(req);
    expect(res.status).toBe(401);
  });

  it("creates a FestEvent and returns 201 with id", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents", {
      method: "POST",
      body: JSON.stringify({ festivalSlug: "hellfest", mode: "solo" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCreate(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id", "fe-new");
  });

  it("returns 422 when festivalSlug is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents", {
      method: "POST",
      body: JSON.stringify({ mode: "solo" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCreate(req);
    expect(res.status).toBe(422);
  });

  it("returns 404 when festival not found", async () => {
    const prisma = await getPrismaMock();
    prisma.festival.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents", {
      method: "POST",
      body: JSON.stringify({ festivalSlug: "unknown-fest" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCreate(req);
    expect(res.status).toBe(404);
  });

  it("returns 409 when a FestEvent already exists for this user+festival", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce({ id: "fe-existing" });

    const req = new NextRequest("http://localhost:3000/api/festevents", {
      method: "POST",
      body: JSON.stringify({ festivalSlug: "hellfest" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCreate(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toHaveProperty("id", "fe-existing");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await postCreate(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/festevents/[id]
// ---------------------------------------------------------------------------

describe("GET /api/festevents/[id]", () => {
  const routeCtx = { params: Promise.resolve({ id: "fe-1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue(festEventRow);
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1");
    const res = await getById(req, routeCtx);
    expect(res.status).toBe(401);
  });

  it("returns 200 with FestEvent detail including selections", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1");
    const res = await getById(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("fe-1");
    expect(body).toHaveProperty("selections");
    expect(Array.isArray(body.selections)).toBe(true);
  });

  it("returns 404 when FestEvent not found or not owned", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1");
    const res = await getById(req, { params: Promise.resolve({ id: "fe-other" }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/festevents/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/festevents/[id]", () => {
  const routeCtx = { params: Promise.resolve({ id: "fe-1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue(festEventRow);
    prisma.festEvent.delete.mockResolvedValue(festEventRow);
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1", {
      method: "DELETE",
    });
    const res = await deleteById(req, routeCtx);
    expect(res.status).toBe(401);
  });

  it("returns 200 and deleted:true on success", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1", {
      method: "DELETE",
    });
    const res = await deleteById(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("deleted", true);
  });

  it("returns 404 when FestEvent does not belong to user", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents/fe-999", {
      method: "DELETE",
    });
    const res = await deleteById(req, { params: Promise.resolve({ id: "fe-999" }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/festevents/[id]
// ---------------------------------------------------------------------------

describe("PUT /api/festevents/[id]", () => {
  const routeCtx = { params: Promise.resolve({ id: "fe-1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue(festEventRow);
    prisma.festEvent.update.mockResolvedValue({
      id: "fe-1",
      updatedAt: new Date("2026-05-02T10:00:00Z"),
    });
  });

  it("returns 200 with updated FestEvent", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1", {
      method: "PUT",
      body: JSON.stringify({ comfortMarginMins: 20 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putById(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id", "fe-1");
  });

  it("returns 422 for invalid comfortMarginMins (> 120)", async () => {
    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1", {
      method: "PUT",
      body: JSON.stringify({ comfortMarginMins: 999 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putById(req, routeCtx);
    expect(res.status).toBe(422);
  });

  it("returns 404 when FestEvent not found", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/festevents/fe-1", {
      method: "PUT",
      body: JSON.stringify({ mode: "crew" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await putById(req, routeCtx);
    expect(res.status).toBe(404);
  });
});
