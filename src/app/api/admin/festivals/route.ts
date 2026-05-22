import { NextRequest, NextResponse } from "next/server";
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

const festivalSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  city: z.string().min(1),
  country: z.string().min(1),
  address: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  festivalType: z.string().default("multidisciplinaire"),
  programType: z.string().default("structuré"),
  siteUrl: z.string().optional(),
  instagramHandle: z.string().optional(),
  ingestionStatus: z.string().default("détecté"),
  confidenceLevel: z.string().default("auto"),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const festivals = await prisma.festival.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        festivalType: true,
        startDate: true,
        endDate: true,
        ingestionStatus: true,
        confidenceLevel: true,
        city: true,
        country: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: festivals });
  } catch (err) {
    console.error("[admin/festivals GET]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = festivalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  try {
    const festival = await prisma.festival.create({
      data: {
        ...parsed.data,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });

    return NextResponse.json({ data: festival }, { status: 201 });
  } catch (err) {
    console.error("[admin/festivals POST]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
