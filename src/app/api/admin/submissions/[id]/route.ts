import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

const patchSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "action doit être 'accept' ou 'reject'." }, { status: 422 });
  }

  const submission = await prisma.festivalSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  if (parsed.data.action === "reject") {
    const updated = await prisma.festivalSubmission.update({
      where: { id },
      data: { status: "rejeté" },
    });
    return NextResponse.json({ data: updated });
  }

  // Accept: create festival and link
  const slug = `${submission.nameProposed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}`;

  const festival = await prisma.festival.create({
    data: {
      name: submission.nameProposed,
      slug,
      city: "À compléter",
      country: "FR",
      startDate: new Date(),
      endDate: new Date(),
      siteUrl: submission.officialUrl,
      ingestionStatus: "détecté",
      confidenceLevel: "auto",
    },
  });

  const updated = await prisma.festivalSubmission.update({
    where: { id },
    data: { status: "ajouté", festivalId: festival.id },
  });

  return NextResponse.json({ data: updated, festival: { id: festival.id, slug: festival.slug } });
}
