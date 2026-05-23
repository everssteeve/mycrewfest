import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") return null;
  return session;
}

const schema = z.object({
  url: z.string().url("URL invalide."),
});

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { url } = parsed.data;

  // Simulated extraction — mock data based on URL domain
  const domain = new URL(url).hostname.replace("www.", "");
  const mockName = domain.split(".")[0] ?? "Festival Inconnu";

  const mockData = {
    agent: "Agent 1 — Détection",
    source_url: url,
    extracted: {
      name: `${mockName.charAt(0).toUpperCase()}${mockName.slice(1)} Festival`,
      slug: `${mockName}-festival-${new Date().getFullYear()}`,
      description: `Festival extrait automatiquement depuis ${url}`,
      city: "Paris",
      country: "FR",
      festivalType: "multidisciplinaire",
      startDate: `${new Date().getFullYear()}-07-15`,
      endDate: `${new Date().getFullYear()}-07-18`,
      siteUrl: url,
      ingestionStatus: "détecté",
      confidenceLevel: "auto",
    },
    confidence: 0.72,
    timestamp: new Date().toISOString(),
    note: "Données simulées — Agent 1 non connecté à un vrai crawler.",
  };

  return NextResponse.json({ data: mockData });
}
