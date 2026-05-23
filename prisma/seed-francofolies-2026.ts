/**
 * Seed script — Francofolies de La Rochelle 2026
 * Source: francofolies.fr, alouette.fr, sortiraparis.com, riffx.fr
 * Édition 2026 : du 10 au 14 juillet 2026 — programmation annoncée (scène Jean-Louis Foulquier complète)
 * Run: pnpm tsx prisma/seed-francofolies-2026.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

function dt(iso: string): Date {
  return new Date(iso);
}
function jsonArr(arr: string[]): string {
  return JSON.stringify(arr);
}

async function main() {
  console.log("🌱 Seeding Francofolies de La Rochelle 2026…");

  // ── Festival ───────────────────────────────────────────────────────────────
  const festival = await prisma.festival.upsert({
    where: { slug: "francofolies-2026" },
    update: {
      programStatus: "partiel",
      ingestionStatus: "enrichi",
    },
    create: {
      slug: "francofolies-2026",
      name: "Francofolies de La Rochelle 2026",
      description:
        "Festival emblématique dédié aux musiques francophones depuis 1985, les Francofolies de La Rochelle rassemblent chaque été plus de 150 000 festivaliers pendant 5 jours. Concerts sur la grande scène Jean-Louis Foulquier, à La Coursive, La Sirène et dans les salles de la ville. Mélange unique de têtes d'affiche grand public et de découvertes de la scène francophone.",
      startDate: dt("2026-07-10T17:00:00Z"),
      endDate: dt("2026-07-14T23:59:00Z"),
      city: "La Rochelle",
      country: "France",
      latitude: 46.1591,
      longitude: -1.1521,
      address: "Place de la Verdière, 17000 La Rochelle",
      festivalType: "musique",
      programType: "structuré",
      capacity: 30000,
      siteUrl: "https://www.francofolies.fr",
      instagramHandle: "francofolies",
      facebookPage: "https://www.facebook.com/Francofolies",
      xHandle: "francofolies",
      ingestionStatus: "enrichi",
      confidenceLevel: "manual",
      programStatus: "partiel",
      isFeatured: true,
    },
  });
  console.log(`  ✓ Festival: ${festival.name} (id: ${festival.id})`);

  // ── Venues ─────────────────────────────────────────────────────────────────
  const venueFoulquier = await prisma.venue.upsert({
    where: { id: "venue-franco-foulquier" },
    update: {},
    create: {
      id: "venue-franco-foulquier",
      festivalId: festival.id,
      name: "Scène Jean-Louis Foulquier",
      type: "scène",
      capacity: 25000,
    },
  });

  const venueSirene = await prisma.venue.upsert({
    where: { id: "venue-franco-sirene" },
    update: {},
    create: {
      id: "venue-franco-sirene",
      festivalId: festival.id,
      name: "La Sirène",
      type: "salle",
      capacity: 1200,
    },
  });

  const venueCoursive = await prisma.venue.upsert({
    where: { id: "venue-franco-coursive" },
    update: {},
    create: {
      id: "venue-franco-coursive",
      festivalId: festival.id,
      name: "La Coursive — Scène nationale",
      type: "salle",
      capacity: 900,
    },
  });

  console.log("  ✓ Venues créés");

  // ── Artists ────────────────────────────────────────────────────────────────
  type ArtistSpec = {
    id: string;
    name: string;
    disciplines: string[];
    countryCode: string;
    day: string;
    venueId: string;
    startTime: string;
    confirmed: boolean;
  };

  // Scène Jean-Louis Foulquier — programmation confirmée
  // Source: francofolies.fr + alouette.fr (mai 2026)
  const artistSpecs: ArtistSpec[] = [
    // VENDREDI 10 juillet
    {
      id: "artist-franco-luiza",
      name: "Luiza",
      disciplines: ["pop", "soul"],
      countryCode: "FR",
      day: "vendredi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-10T17:30:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-youssou-ndour",
      name: "Youssou Ndour",
      disciplines: ["world", "afropop"],
      countryCode: "SN",
      day: "vendredi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-10T19:30:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-zaz",
      name: "ZAZ",
      disciplines: ["chanson", "jazz"],
      countryCode: "FR",
      day: "vendredi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-10T21:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-gims",
      name: "Gims",
      disciplines: ["rap", "afropop"],
      countryCode: "CD",
      day: "vendredi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-10T22:30:00Z",
      confirmed: true,
    },
    // SAMEDI 11 juillet
    {
      id: "artist-franco-la-mano",
      name: "La Mano 1.9",
      disciplines: ["rap", "trap"],
      countryCode: "FR",
      day: "samedi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-11T17:30:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-l2b",
      name: "L2B",
      disciplines: ["rap"],
      countryCode: "FR",
      day: "samedi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-11T19:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-jokair",
      name: "Jok'Air",
      disciplines: ["rap", "trap"],
      countryCode: "FR",
      day: "samedi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-11T21:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-niska",
      name: "Niska",
      disciplines: ["rap", "trap"],
      countryCode: "FR",
      day: "samedi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-11T22:30:00Z",
      confirmed: true,
    },
    // DIMANCHE 12 juillet
    {
      id: "artist-franco-skip-the-use",
      name: "Skip The Use",
      disciplines: ["rock", "electro"],
      countryCode: "FR",
      day: "dimanche",
      venueId: venueFoulquier.id,
      startTime: "2026-07-12T18:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-gael-faye",
      name: "Gaël Faye",
      disciplines: ["rap", "chanson"],
      countryCode: "BI",
      day: "dimanche",
      venueId: venueFoulquier.id,
      startTime: "2026-07-12T20:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-orelsan",
      name: "Orelsan",
      disciplines: ["rap"],
      countryCode: "FR",
      day: "dimanche",
      venueId: venueFoulquier.id,
      startTime: "2026-07-12T22:00:00Z",
      confirmed: true,
    },
    // LUNDI 13 juillet
    {
      id: "artist-franco-helena",
      name: "Helena",
      disciplines: ["electro", "pop"],
      countryCode: "FR",
      day: "lundi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-13T19:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-louane",
      name: "Louane",
      disciplines: ["pop", "chanson"],
      countryCode: "FR",
      day: "lundi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-13T20:30:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-aya-nakamura",
      name: "Aya Nakamura",
      disciplines: ["afropop", "R&B"],
      countryCode: "FR",
      day: "lundi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-13T22:00:00Z",
      confirmed: true,
    },
    // MARDI 14 juillet (Fête Nationale)
    {
      id: "artist-franco-feu-chatterton",
      name: "Feu! Chatterton",
      disciplines: ["rock", "chanson"],
      countryCode: "FR",
      day: "mardi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-14T19:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-gaetan-roussel",
      name: "Gaëtan Roussel",
      disciplines: ["rock", "chanson"],
      countryCode: "FR",
      day: "mardi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-14T20:30:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-mika",
      name: "Mika",
      disciplines: ["pop"],
      countryCode: "GB",
      day: "mardi",
      venueId: venueFoulquier.id,
      startTime: "2026-07-14T22:00:00Z",
      confirmed: true,
    },
    // Artistes scènes secondaires (La Sirène / La Coursive)
    {
      id: "artist-franco-emily-loizeau",
      name: "Emily Loizeau",
      disciplines: ["chanson", "indie"],
      countryCode: "FR",
      day: "vendredi",
      venueId: venueCoursive.id,
      startTime: "2026-07-10T20:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-vincent-delerm",
      name: "Vincent Delerm",
      disciplines: ["chanson"],
      countryCode: "FR",
      day: "samedi",
      venueId: venueCoursive.id,
      startTime: "2026-07-11T20:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-raphael",
      name: "Raphaël",
      disciplines: ["rock", "chanson"],
      countryCode: "FR",
      day: "dimanche",
      venueId: venueSirene.id,
      startTime: "2026-07-12T21:00:00Z",
      confirmed: true,
    },
    {
      id: "artist-franco-odezenne",
      name: "Odezenne",
      disciplines: ["electro", "indie"],
      countryCode: "FR",
      day: "lundi",
      venueId: venueSirene.id,
      startTime: "2026-07-13T21:00:00Z",
      confirmed: true,
    },
  ];

  const festivalSlug = "franco-2026";

  for (const spec of artistSpecs) {
    const artist = await prisma.artist.upsert({
      where: { id: spec.id },
      update: {},
      create: {
        id: spec.id,
        name: spec.name,
        disciplines: jsonArr(spec.disciplines),
        countryCode: spec.countryCode,
      },
    });

    const eventId = `event-francofolies-2026-${spec.id}`;
    await prisma.event.upsert({
      where: { id: eventId },
      update: {},
      create: {
        id: eventId,
        festivalId: festival.id,
        venueId: spec.venueId,
        artistId: artist.id,
        title: artist.name,
        eventType: "concert",
        startTime: dt(spec.startTime),
        endTime: new Date(dt(spec.startTime).getTime() + 75 * 60 * 1000),
        access: "inclus",
        status: spec.confirmed ? "confirmé" : "à_confirmer",
        confidence: "manual",
      },
    });
  }

  console.log(`  ✓ ${artistSpecs.length} artistes + événements créés`);

  // ── News items ─────────────────────────────────────────────────────────────
  const newsItems = [
    {
      id: "news-francofolies-2026-prog-complete",
      category: "line-up",
      summary:
        "Programmation des Francofolies 2026 dévoilée : Orelsan, Aya Nakamura, Mika, Gims, Louane, Gaël Faye… La scène Jean-Louis Foulquier affiche complet pour les 5 soirées du 10 au 14 juillet.",
      publishedAt: dt("2026-03-15T09:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: true,
      source: "site_officiel",
      sourceUrl: "https://www.francofolies.fr/pre-annonce-26/",
    },
    {
      id: "news-francofolies-2026-mika-annonce",
      category: "line-up",
      summary:
        "Mika en clôture des Francofolies 2026 le 14 juillet — soirée Fête Nationale avec aussi Gaëtan Roussel et Feu! Chatterton pour célébrer les musiques francophones.",
      publishedAt: dt("2026-02-20T10:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "presse",
      sourceUrl: "https://www.alouette.fr/francofolies-la-rochelle-2026-luiza-helena-mika-programmation",
    },
    {
      id: "news-francofolies-2026-billetterie",
      category: "billetterie",
      summary:
        "Billets Francofolies 2026 disponibles à la vente — pass 5 jours et billets à la soirée sur francofolies.seetickets.com. Plus de 150 000 festivaliers attendus à La Rochelle.",
      publishedAt: dt("2025-11-10T09:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "site_officiel",
      sourceUrl: "https://francofolies.seetickets.com/tg/tour/les-francofolies-de-la-rochelle/35734",
    },
  ];

  for (const item of newsItems) {
    await prisma.newsItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        festivalId: festival.id,
        source: item.source,
        sourceUrl: item.sourceUrl,
        publishedAt: item.publishedAt,
        category: item.category,
        summary: item.summary,
        urgencyLevel: item.urgencyLevel,
        isPinned: item.isPinned,
      },
    });
  }

  console.log(`  ✓ ${newsItems.length} actualités créées`);
  console.log("✅ Francofolies de La Rochelle 2026 seedé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
