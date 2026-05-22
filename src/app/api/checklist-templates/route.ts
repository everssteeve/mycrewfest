import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Default templates — seeded on first request if DB is empty
// ---------------------------------------------------------------------------

const DEFAULT_TEMPLATES = [
  {
    name: "Camping festival",
    category: "camping",
    items: JSON.stringify([
      "Tente",
      "Sac de couchage",
      "Tapis de sol",
      "Lampe frontale",
      "Bouchons d'oreilles",
      "Kit premiers secours",
      "Chargeur solaire",
      "Sac à dos journée",
      "Vêtements de rechange",
      "Imperméable / poncho",
      "Chaussures de rechange",
      "Crème solaire",
      "Anti-moustiques",
      "Serviette microfibre",
      "Cadenas (tente/casier)",
    ]),
  },
  {
    name: "Festival day trip",
    category: "day_trip",
    items: JSON.stringify([
      "Billets / e-tickets téléchargés",
      "Pièce d'identité",
      "Chargeur de batterie externe",
      "Bouteille d'eau réutilisable",
      "Collations / barres énergétiques",
      "Crème solaire",
      "Casque ou bouchons",
      "Sac à dos léger",
      "Imperméable pliant",
      "Cash (en cas de fragilité réseau CB)",
    ]),
  },
  {
    name: "Festival urbain",
    category: "urban",
    items: JSON.stringify([
      "Billets / e-tickets téléchargés",
      "Pièce d'identité",
      "Carte de transport",
      "Chargeur de batterie externe",
      "Bouteille d'eau",
      "Casque ou bouchons",
      "Plan du festival hors-ligne",
      "Point de ralliement défini",
      "Numéro de contact d'urgence crew",
    ]),
  },
  {
    name: "Festival en famille",
    category: "family",
    items: JSON.stringify([
      "Billets enfants + adultes",
      "Carte d'identité ou livret de famille",
      "Poussette / porte-bébé",
      "Crème solaire haute protection",
      "Anti-moustiques adapté enfants",
      "Chapeau / casquette enfants",
      "Snacks et boissons enfants",
      "Kit premiers secours",
      "Couverture / couverture de secours",
      "Jeu / doudou de secours",
      "Protège-tympans enfants",
      "Vêtements de rechange enfants",
      "Point de ralliement défini",
    ]),
  },
];

/**
 * GET /api/checklist-templates
 * Returns all checklist templates. Seeds defaults if none exist.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  let templates = await prisma.checklistTemplate.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Seed defaults if empty
  if (templates.length === 0) {
    await prisma.checklistTemplate.createMany({ data: DEFAULT_TEMPLATES });
    templates = await prisma.checklistTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  return NextResponse.json(
    templates.map((t) => {
      let items: string[] = [];
      try {
        const parsed = JSON.parse(t.items);
        if (Array.isArray(parsed)) items = parsed as string[];
      } catch {
        items = [];
      }
      return {
        id: t.id,
        name: t.name,
        category: t.category,
        items,
      };
    }),
  );
}
