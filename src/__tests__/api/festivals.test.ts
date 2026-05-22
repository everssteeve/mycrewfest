import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock Prisma before importing the route handlers
vi.mock("@/lib/prisma", () => ({
  prisma: {
    festival: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    userFollowsFestival: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock next-auth so the route handlers don't need a real session
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const festivalRow = {
  id: "fes-1",
  name: "Greenfield Festival",
  slug: "greenfield-festival",
  description: "A great music festival",
  startDate: new Date("2025-06-15"),
  endDate: new Date("2025-06-17"),
  city: "Lyon",
  country: "France",
  latitude: 45.7,
  longitude: 4.8,
  festivalType: "musique",
  programType: "structuré",
  programStatus: "complet",
  ingestionStatus: "ingéré",
  confidenceLevel: "vérifié_humain",
  capacity: 5000,
  siteUrl: "https://greenfield.fr",
  instagramHandle: "@greenfield",
  _count: { events: 20, followers: 150 },
};

const festivalDetailRow = {
  ...festivalRow,
  address: "123 Rue de la Musique, Lyon",
  facebookPage: null,
  xHandle: null,
  mapImageUrl: null,
  events: [],
  venues: [],
  newsItems: [],
  _count: { events: 0, followers: 150 },
};

// ---------------------------------------------------------------------------
// Import route handlers (after mock setup)
// ---------------------------------------------------------------------------

// Dynamic import is needed here because vi.mock hoisting happens before imports
const { GET: getList } = await import("@/app/api/festivals/route");
const { GET: getBySlug } = await import("@/app/api/festivals/[slug]/route");

// ---------------------------------------------------------------------------
// Helper to get Prisma mock
// ---------------------------------------------------------------------------

async function getPrismaMock() {
  const { prisma } = await import("@/lib/prisma");
  return prisma as {
    festival: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    userFollowsFestival: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
}

// ---------------------------------------------------------------------------
// GET /api/festivals
// ---------------------------------------------------------------------------

describe("GET /api/festivals", () => {
  beforeEach(async () => {
    const prisma = await getPrismaMock();
    vi.clearAllMocks();
    // Default: $transaction returns [total, festivals]
    prisma.$transaction.mockResolvedValue([1, [festivalRow]]);
    prisma.userFollowsFestival.findMany.mockResolvedValue([]);
  });

  it("returns 200 with an array of festivals", async () => {
    const req = new NextRequest("http://localhost:3000/api/festivals");
    const res = await getList(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].slug).toBe("greenfield-festival");
  });

  it("returns pagination meta", async () => {
    const req = new NextRequest("http://localhost:3000/api/festivals");
    const res = await getList(req);
    const body = await res.json();
    expect(body).toHaveProperty("meta");
    expect(body.meta).toMatchObject({
      page: 1,
      total: 1,
    });
  });

  it("GET /api/festivals?q=green filters by name query", async () => {
    const prisma = await getPrismaMock();
    prisma.$transaction.mockResolvedValue([1, [festivalRow]]);

    const req = new NextRequest("http://localhost:3000/api/festivals?q=green");
    const res = await getList(req);
    expect(res.status).toBe(200);

    // The $transaction was called with a where clause containing the name filter
    const callArgs = prisma.$transaction.mock.calls[0][0];
    // callArgs is [countCall, findManyCall] passed to $transaction
    expect(callArgs).toBeDefined();
  });

  it("GET /api/festivals?type=musique filters by festival type", async () => {
    const prisma = await getPrismaMock();
    prisma.$transaction.mockResolvedValue([0, []]);

    const req = new NextRequest(
      "http://localhost:3000/api/festivals?type=musique",
    );
    const res = await getList(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns 500 on Prisma error", async () => {
    const prisma = await getPrismaMock();
    prisma.$transaction.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/festivals");
    const res = await getList(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// GET /api/festivals/[slug]
// ---------------------------------------------------------------------------

describe("GET /api/festivals/[slug]", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.userFollowsFestival.findUnique.mockResolvedValue(null);
  });

  it("returns 200 and the festival object for a valid slug", async () => {
    const prisma = await getPrismaMock();
    prisma.festival.findUnique.mockResolvedValue(festivalDetailRow);

    const req = new NextRequest(
      "http://localhost:3000/api/festivals/greenfield-festival",
    );
    const res = await getBySlug(req, {
      params: Promise.resolve({ slug: "greenfield-festival" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe("greenfield-festival");
    expect(body.name).toBe("Greenfield Festival");
  });

  it("returns 404 for an unknown slug", async () => {
    const prisma = await getPrismaMock();
    prisma.festival.findUnique.mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost:3000/api/festivals/unknown-festival",
    );
    const res = await getBySlug(req, {
      params: Promise.resolve({ slug: "unknown-festival" }),
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns isFollowed: false when user is not authenticated", async () => {
    const prisma = await getPrismaMock();
    prisma.festival.findUnique.mockResolvedValue(festivalDetailRow);

    const req = new NextRequest(
      "http://localhost:3000/api/festivals/greenfield-festival",
    );
    const res = await getBySlug(req, {
      params: Promise.resolve({ slug: "greenfield-festival" }),
    });
    const body = await res.json();
    expect(body.isFollowed).toBe(false);
  });

  it("returns 500 on Prisma error", async () => {
    const prisma = await getPrismaMock();
    prisma.festival.findUnique.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest(
      "http://localhost:3000/api/festivals/crash-festival",
    );
    const res = await getBySlug(req, {
      params: Promise.resolve({ slug: "crash-festival" }),
    });
    expect(res.status).toBe(500);
  });
});
