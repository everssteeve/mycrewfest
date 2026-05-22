/**
 * Tests for /api/festevents/[id]/selections and
 * /api/festevents/[id]/selections/[eventId] route handlers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", () => ({
  prisma: {
    festEvent: {
      findFirst: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
    },
    selection: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", email: "test@mycrewfest.dev" },
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers
// ---------------------------------------------------------------------------

const { POST: postSelection } = await import(
  "@/app/api/festevents/[id]/selections/route"
);
const { DELETE: deleteSelection } = await import(
  "@/app/api/festevents/[id]/selections/[eventId]/route"
);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function getPrismaMock() {
  const { prisma } = await import("@/lib/prisma");
  return prisma as {
    festEvent: { findFirst: ReturnType<typeof vi.fn> };
    event: { findFirst: ReturnType<typeof vi.fn> };
    selection: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
}

async function getAuthMock() {
  const { auth } = await import("@/auth");
  return auth as ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// POST /api/festevents/[id]/selections
// ---------------------------------------------------------------------------

describe("POST /api/festevents/[id]/selections", () => {
  const routeCtx = { params: Promise.resolve({ id: "fe-1" }) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue({
      id: "fe-1",
      festivalId: "fes-1",
    });
    prisma.event.findFirst.mockResolvedValue({ id: "event-1" });
    prisma.selection.upsert.mockResolvedValue({
      id: "sel-1",
      status: "intéressé",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections",
      {
        method: "POST",
        body: JSON.stringify({ eventId: "event-1", status: "intéressé" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await postSelection(req, routeCtx);
    expect(res.status).toBe(401);
  });

  it("creates/updates a selection and returns 200 with id and status", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections",
      {
        method: "POST",
        body: JSON.stringify({ eventId: "event-1", status: "intéressé" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await postSelection(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("id", "sel-1");
    expect(body).toHaveProperty("status", "intéressé");
  });

  it("returns 404 when FestEvent not found or not owned", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-unknown/selections",
      {
        method: "POST",
        body: JSON.stringify({ eventId: "event-1", status: "intéressé" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await postSelection(req, {
      params: Promise.resolve({ id: "fe-unknown" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when event does not belong to this festival", async () => {
    const prisma = await getPrismaMock();
    prisma.event.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections",
      {
        method: "POST",
        body: JSON.stringify({ eventId: "event-other-festival", status: "must-see" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await postSelection(req, routeCtx);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/festival/i);
  });

  it("returns 422 for invalid status value", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections",
      {
        method: "POST",
        body: JSON.stringify({ eventId: "event-1", status: "invalid-status" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await postSelection(req, routeCtx);
    expect(res.status).toBe(422);
  });

  it("returns 422 when eventId is missing", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections",
      {
        method: "POST",
        body: JSON.stringify({ status: "intéressé" }),
        headers: { "Content-Type": "application/json" },
      },
    );
    const res = await postSelection(req, routeCtx);
    expect(res.status).toBe(422);
  });

  it("supports all valid selection statuses", async () => {
    const statuses = ["intéressé", "must-see", "vu"] as const;

    for (const status of statuses) {
      const prisma = await getPrismaMock();
      prisma.selection.upsert.mockResolvedValueOnce({ id: "sel-x", status });

      const req = new NextRequest(
        "http://localhost:3000/api/festevents/fe-1/selections",
        {
          method: "POST",
          body: JSON.stringify({ eventId: "event-1", status }),
          headers: { "Content-Type": "application/json" },
        },
      );
      const res = await postSelection(req, routeCtx);
      expect(res.status).toBe(200);
    }
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/festevents/[id]/selections/[eventId]
// ---------------------------------------------------------------------------

describe("DELETE /api/festevents/[id]/selections/[eventId]", () => {
  const routeCtx = {
    params: Promise.resolve({ id: "fe-1", eventId: "event-1" }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValue({ id: "fe-1" });
    prisma.selection.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("returns 401 when unauthenticated", async () => {
    const authMock = await getAuthMock();
    authMock.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections/event-1",
      { method: "DELETE" },
    );
    const res = await deleteSelection(req, routeCtx);
    expect(res.status).toBe(401);
  });

  it("deletes the selection and returns deleted:true", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections/event-1",
      { method: "DELETE" },
    );
    const res = await deleteSelection(req, routeCtx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("deleted", true);
  });

  it("returns 404 when FestEvent does not belong to user", async () => {
    const prisma = await getPrismaMock();
    prisma.festEvent.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-other/selections/event-1",
      { method: "DELETE" },
    );
    const res = await deleteSelection(req, {
      params: Promise.resolve({ id: "fe-other", eventId: "event-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when selection does not exist", async () => {
    const prisma = await getPrismaMock();
    prisma.selection.deleteMany.mockResolvedValueOnce({ count: 0 });

    const req = new NextRequest(
      "http://localhost:3000/api/festevents/fe-1/selections/event-missing",
      { method: "DELETE" },
    );
    const res = await deleteSelection(req, {
      params: Promise.resolve({ id: "fe-1", eventId: "event-missing" }),
    });
    expect(res.status).toBe(404);
  });
});
