/**
 * Tests for POST/DELETE /api/festivals/[slug]/follow
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFestival = { id: "festival-1" };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    festival: {
      findUnique: vi.fn(),
    },
    userFollowsFestival: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { DELETE, POST } from "@/app/api/festivals/[slug]/follow/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockFestivalFindUnique = vi.mocked(prisma.festival.findUnique);
const mockUpsert = vi.mocked(prisma.userFollowsFestival.upsert);
const mockDeleteMany = vi.mocked(prisma.userFollowsFestival.deleteMany);

function makeRequest(method: "POST" | "DELETE"): NextRequest {
  return new NextRequest("http://localhost/api/festivals/hellfest/follow", {
    method,
  });
}

const routeContext = { params: Promise.resolve({ slug: "hellfest" }) };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/festivals/[slug]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@mycrewfest.dev", name: "Test" },
    } as Awaited<ReturnType<typeof auth>>);
    // biome-ignore lint/suspicious/noExplicitAny: prisma mock
    mockFestivalFindUnique.mockResolvedValue(mockFestival as any);
    // biome-ignore lint/suspicious/noExplicitAny: prisma mock
    mockUpsert.mockResolvedValue({} as any);
  });

  it("returns 200 and { followed: true } on success", async () => {
    const res = await POST(makeRequest("POST"), routeContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ followed: true });
  });

  it("calls prisma.userFollowsFestival.upsert with correct IDs", async () => {
    await POST(makeRequest("POST"), routeContext);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_festivalId: { userId: "user-1", festivalId: "festival-1" } },
        create: { userId: "user-1", festivalId: "festival-1" },
      }),
    );
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest("POST"), routeContext);
    expect(res.status).toBe(401);
  });

  it("returns 404 when festival is not found", async () => {
    mockFestivalFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest("POST"), routeContext);
    expect(res.status).toBe(404);
  });

  it("returns 500 when upsert throws", async () => {
    mockUpsert.mockRejectedValue(new Error("DB error"));
    const res = await POST(makeRequest("POST"), routeContext);
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/festivals/[slug]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@mycrewfest.dev", name: "Test" },
    } as Awaited<ReturnType<typeof auth>>);
    // biome-ignore lint/suspicious/noExplicitAny: prisma mock
    mockFestivalFindUnique.mockResolvedValue(mockFestival as any);
    // biome-ignore lint/suspicious/noExplicitAny: prisma mock
    mockDeleteMany.mockResolvedValue({ count: 1 } as any);
  });

  it("returns 200 and { followed: false } on success", async () => {
    const res = await DELETE(makeRequest("DELETE"), routeContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ followed: false });
  });

  it("calls prisma.userFollowsFestival.deleteMany with correct IDs", async () => {
    await DELETE(makeRequest("DELETE"), routeContext);
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", festivalId: "festival-1" },
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE"), routeContext);
    expect(res.status).toBe(401);
  });

  it("returns 404 when festival is not found", async () => {
    mockFestivalFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE"), routeContext);
    expect(res.status).toBe(404);
  });

  it("returns 500 when deleteMany throws", async () => {
    mockDeleteMany.mockRejectedValue(new Error("DB error"));
    const res = await DELETE(makeRequest("DELETE"), routeContext);
    expect(res.status).toBe(500);
  });
});
