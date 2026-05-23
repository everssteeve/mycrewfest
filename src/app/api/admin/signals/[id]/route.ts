import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal) return NextResponse.json({ error: "Signal introuvable." }, { status: 404 });

  await prisma.signal.delete({ where: { id } });

  return NextResponse.json({ success: true, id });
}
