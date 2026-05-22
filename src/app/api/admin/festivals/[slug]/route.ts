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

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  festivalType: z.string().optional(),
  programType: z.string().optional(),
  siteUrl: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
  ingestionStatus: z.string().optional(),
  confidenceLevel: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { slug } = await params;

  const festival = await prisma.festival.findUnique({ where: { slug } });
  if (!festival) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return NextResponse.json({ data: festival });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (data.startDate) data.startDate = new Date(data.startDate as string);
  if (data.endDate) data.endDate = new Date(data.endDate as string);

  try {
    const festival = await prisma.festival.update({ where: { slug }, data });
    return NextResponse.json({ data: festival });
  } catch (err) {
    console.error("[admin/festivals PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { slug } = await params;

  try {
    await prisma.festival.delete({ where: { slug } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/festivals DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
