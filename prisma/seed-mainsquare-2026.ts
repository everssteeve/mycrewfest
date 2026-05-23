/**
 * Seed script — Main Square Festival 2026
 * Sources: mainsquarefestival.fr, sortiraparis.com, jds.fr, tendancesandco.fr
 * Édition 2026 : du 3 au 5 juillet 2026
 * Lieu : Citadelle Vauban d'Arras, 146 Allée du Bastion de la Reine, 62000 Arras
 * Run: pnpm tsx prisma/seed-mainsquare-2026.ts
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
  console.log("🌱 Seeding Main Square Festival 2026…");

  // ── Festival ───────────────────────────────────────────────────────────────
  const festival = await prisma.festival.upsert({
    where: { slug: "main-square-2026" },
    update: {
      programStatus: "complet",
      ingestionStatus: "enrichi",
    },
    create: {
      slug: "main-square-2026",
      name: "Main Square Festival 2026",
      description:
        "Le Main Square Festival investit chaque été la Citadelle Vauban d'Arras, monument classé UNESCO. Édition 2026 : Twenty One Pilots, Katy Perry, Orelsan et Marshmello en têtes d'affiche, sur 3 scènes (Main Stage, Vauban, Bastion). Festival sold-out avec ~40 000 festivaliers par jour.",
      startDate: dt("2026-07-03T12:00:00Z"),
      endDate: dt("2026-07-05T23:59:00Z"),
      city: "Arras",
      country: "France",
      latitude: 50.2909,
      longitude: 2.7699,
      address: "Citadelle Vauban, 146 Allée du Bastion de la Reine, 62000 Arras",
      festivalType: "musique",
      programType: "structuré",
      capacity: 40000,
      siteUrl: "https://mainsquarefestival.fr",
      instagramHandle: "mainsquarefestival",
      facebookPage: "https://www.facebook.com/MainSquareFestival",
      xHandle: "mainsquarefest",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
      isFeatured: true,
    },
  });
  console.log(`  ✓ Festival: ${festival.name} (id: ${festival.id})`);

  // ── Venues ─────────────────────────────────────────────────────────────────
  const venueMain = await prisma.venue.upsert({
    where: { id: "venue-mainsquare-main" },
    update: {},
    create: {
      id: "venue-mainsquare-main",
      festivalId: festival.id,
      name: "Main Stage",
      type: "scène",
      capacity: 40000,
    },
  });

  const venueVauban = await prisma.venue.upsert({
    where: { id: "venue-mainsquare-vauban" },
    update: {},
    create: {
      id: "venue-mainsquare-vauban",
      festivalId: festival.id,
      name: "Scène Vauban",
      type: "scène",
      capacity: 10000,
    },
  });

  const venueBastion = await prisma.venue.upsert({
    where: { id: "venue-mainsquare-bastion" },
    update: {},
    create: {
      id: "venue-mainsquare-bastion",
      festivalId: festival.id,
      name: "Scène Bastion",
      type: "scène",
      capacity: 5000,
    },
  });

  console.log("  ✓ Venues créés");

  // ── Artists ────────────────────────────────────────────────────────────────
  type ArtistSpec = {
    id: string;
    name: string;
    disciplines: string[];
    countryCode: string;
    venueId: string;
    startTime: string;
    instagram?: string;
  };

  const artistSpecs: ArtistSpec[] = [
    // ── VENDREDI 3 juillet — Main Stage ──
    {
      id: "artist-mainsquare-katy-perry",
      name: "Katy Perry",
      disciplines: ["pop"],
      countryCode: "US",
      venueId: venueMain.id,
      startTime: "2026-07-03T20:15:00Z",
      instagram: "katyperry",
    },
    {
      id: "artist-mainsquare-paul-kalkbrenner",
      name: "Paul Kalkbrenner",
      disciplines: ["electro", "techno", "DJ"],
      countryCode: "DE",
      venueId: venueMain.id,
      startTime: "2026-07-03T22:45:00Z",
      instagram: "paulkalkbrenner",
    },
    {
      id: "artist-mainsquare-charlotte-cardin",
      name: "Charlotte Cardin",
      disciplines: ["pop", "indie", "électro-pop"],
      countryCode: "CA",
      venueId: venueMain.id,
      startTime: "2026-07-03T18:15:00Z",
      instagram: "charlottecardin",
    },
    {
      id: "artist-mainsquare-midnight-generation",
      name: "Midnight Generation",
      disciplines: ["rock", "indie"],
      countryCode: "FR",
      venueId: venueMain.id,
      startTime: "2026-07-03T16:15:00Z",
    },
    {
      id: "artist-mainsquare-linka-moja",
      name: "Linka Moja",
      disciplines: ["pop", "indie"],
      countryCode: "FR",
      venueId: venueMain.id,
      startTime: "2026-07-03T14:45:00Z",
    },

    // ── VENDREDI 3 juillet — Scène Vauban ──
    {
      id: "artist-mainsquare-jessie-murph",
      name: "Jessie Murph",
      disciplines: ["country-pop", "pop"],
      countryCode: "US",
      venueId: venueVauban.id,
      startTime: "2026-07-03T17:15:00Z",
      instagram: "jessiemurph",
    },
    {
      id: "artist-mainsquare-miki",
      name: "Miki",
      disciplines: ["pop", "indie"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-03T19:15:00Z",
      instagram: "miki_officiel",
    },
    {
      id: "artist-mainsquare-cassius",
      name: "Cassius",
      disciplines: ["electro", "house", "DJ"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-03T21:45:00Z",
      instagram: "cassiusofficial",
    },
    {
      id: "artist-mainsquare-luiza",
      name: "Luiza",
      disciplines: ["pop", "R&B"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-03T15:30:00Z",
    },

    // ── VENDREDI 3 juillet — Scène Bastion ──
    {
      id: "artist-mainsquare-nuur",
      name: "Nûr",
      disciplines: ["pop", "indie"],
      countryCode: "FR",
      venueId: venueBastion.id,
      startTime: "2026-07-03T17:30:00Z",
      instagram: "nur_officiel",
    },
    {
      id: "artist-mainsquare-seedy-liars",
      name: "Seedy Liars",
      disciplines: ["rock", "garage"],
      countryCode: "FR",
      venueId: venueBastion.id,
      startTime: "2026-07-03T15:40:00Z",
    },
    {
      id: "artist-mainsquare-romain-podeur",
      name: "Romain Podeur",
      disciplines: ["electro", "DJ"],
      countryCode: "FR",
      venueId: venueBastion.id,
      startTime: "2026-07-03T19:30:00Z",
    },

    // ── SAMEDI 4 juillet — Main Stage ──
    {
      id: "artist-mainsquare-orelsan",
      name: "Orelsan",
      disciplines: ["rap", "hip-hop"],
      countryCode: "FR",
      venueId: venueMain.id,
      startTime: "2026-07-04T19:30:00Z",
      instagram: "orelsan",
    },
    {
      id: "artist-mainsquare-marshmello",
      name: "Marshmello",
      disciplines: ["electro", "house", "DJ"],
      countryCode: "US",
      venueId: venueMain.id,
      startTime: "2026-07-04T22:00:00Z",
      instagram: "marshmellomusic",
    },
    {
      id: "artist-mainsquare-the-warning",
      name: "The Warning",
      disciplines: ["rock", "metal"],
      countryCode: "MX",
      venueId: venueMain.id,
      startTime: "2026-07-04T15:30:00Z",
      instagram: "thewarningband",
    },
    {
      id: "artist-mainsquare-asaf-avidan",
      name: "Asaf Avidan",
      disciplines: ["folk", "rock", "blues"],
      countryCode: "IL",
      venueId: venueMain.id,
      startTime: "2026-07-04T17:30:00Z",
      instagram: "asafavidan",
    },
    {
      id: "artist-mainsquare-radio-free-alice",
      name: "Radio Free Alice",
      disciplines: ["rock", "indie"],
      countryCode: "FR",
      venueId: venueMain.id,
      startTime: "2026-07-04T13:45:00Z",
    },

    // ── SAMEDI 4 juillet — Scène Vauban ──
    {
      id: "artist-mainsquare-yame",
      name: "Yamê",
      disciplines: ["afropop", "R&B"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-04T18:30:00Z",
      instagram: "yame_music",
    },
    {
      id: "artist-mainsquare-l2b",
      name: "L2B",
      disciplines: ["rap", "hip-hop"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-04T21:00:00Z",
      instagram: "l2b_officiel",
    },
    {
      id: "artist-mainsquare-eve-la-marka",
      name: "Eve La Marka",
      disciplines: ["rap", "R&B"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-04T14:30:00Z",
      instagram: "evelamarka",
    },
    {
      id: "artist-mainsquare-nono-la-grinta",
      name: "Nono La Grinta",
      disciplines: ["rap", "afropop"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-04T16:30:00Z",
    },

    // ── DIMANCHE 5 juillet — Main Stage ──
    {
      id: "artist-mainsquare-twenty-one-pilots",
      name: "Twenty One Pilots",
      disciplines: ["rock", "alternative", "pop"],
      countryCode: "US",
      venueId: venueMain.id,
      startTime: "2026-07-05T20:45:00Z",
      instagram: "twentyonepilots",
    },
    {
      id: "artist-mainsquare-renee-rapp",
      name: "Renée Rapp",
      disciplines: ["pop", "R&B"],
      countryCode: "US",
      venueId: venueMain.id,
      startTime: "2026-07-05T16:30:00Z",
      instagram: "reneerapp",
    },
    {
      id: "artist-mainsquare-vald-collab",
      name: "Vald x Vladimir Cauchemar x Todiefor",
      disciplines: ["rap", "electro"],
      countryCode: "FR",
      venueId: venueMain.id,
      startTime: "2026-07-05T18:30:00Z",
    },
    {
      id: "artist-mainsquare-balu-brigada",
      name: "Balu Brigada",
      disciplines: ["pop", "indie", "soul"],
      countryCode: "CH",
      venueId: venueMain.id,
      startTime: "2026-07-05T14:30:00Z",
      instagram: "balubrigada",
    },
    {
      id: "artist-mainsquare-voila",
      name: "Voilà",
      disciplines: ["pop", "indie"],
      countryCode: "FR",
      venueId: venueMain.id,
      startTime: "2026-07-05T13:00:00Z",
    },

    // ── DIMANCHE 5 juillet — Scène Vauban ──
    {
      id: "artist-mainsquare-zaho",
      name: "Zaho",
      disciplines: ["R&B", "soul", "afropop"],
      countryCode: "DZ",
      venueId: venueVauban.id,
      startTime: "2026-07-05T17:30:00Z",
      instagram: "zahomusic",
    },
    {
      id: "artist-mainsquare-perceval",
      name: "Perceval",
      disciplines: ["pop", "indie"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-05T19:45:00Z",
    },
    {
      id: "artist-mainsquare-don-west",
      name: "Don West",
      disciplines: ["rap", "R&B"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-05T15:30:00Z",
    },
    {
      id: "artist-mainsquare-supermodel",
      name: "Supermodel",
      disciplines: ["indie", "rock"],
      countryCode: "FR",
      venueId: venueVauban.id,
      startTime: "2026-07-05T13:45:00Z",
    },

    // ── DIMANCHE 5 juillet — Scène Bastion ──
    {
      id: "artist-mainsquare-ahna",
      name: "Ahna",
      disciplines: ["electro", "techno"],
      countryCode: "FR",
      venueId: venueBastion.id,
      startTime: "2026-07-05T15:45:00Z",
    },
    {
      id: "artist-mainsquare-ours-samplus",
      name: "Ours Samplus",
      disciplines: ["hip-hop", "rap"],
      countryCode: "FR",
      venueId: venueBastion.id,
      startTime: "2026-07-05T17:45:00Z",
    },
  ];

  for (const spec of artistSpecs) {
    const artist = await prisma.artist.upsert({
      where: { id: spec.id },
      update: {},
      create: {
        id: spec.id,
        name: spec.name,
        disciplines: jsonArr(spec.disciplines),
        countryCode: spec.countryCode,
        ...(spec.instagram ? { instagram: spec.instagram } : {}),
      },
    });

    const eventId = `event-mainsquare-2026-${spec.id}`;
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
        endTime: new Date(dt(spec.startTime).getTime() + 75 * 60 * 1000), // 75 min par défaut
        access: "inclus",
        status: "confirmé",
        confidence: "vérifié_humain",
      },
    });
  }

  console.log(`  ✓ ${artistSpecs.length} artistes + événements créés`);

  // ── News items ─────────────────────────────────────────────────────────────
  const newsItems = [
    {
      id: "news-mainsquare-2026-sold-out",
      category: "logistique",
      summary:
        "Main Square Festival 2026 complet ! Les 40 000 pass 3 jours se sont arrachés à plus de 4 mois de l'événement. Une revente officielle est disponible sur le site du festival pour permettre des échanges sécurisés à partir de 69€.",
      publishedAt: dt("2026-02-20T10:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: true,
      source: "site_officiel",
      sourceUrl: "https://mainsquarefestival.fr/",
    },
    {
      id: "news-mainsquare-2026-tetes-affiche",
      category: "line-up",
      summary:
        "Main Square 2026 dévoile ses têtes d'affiche : Twenty One Pilots, Katy Perry et Orelsan en headliners sur la Main Stage, rejoints par Marshmello, Paul Kalkbrenner, Charlotte Cardin et Asaf Avidan.",
      publishedAt: dt("2025-10-15T09:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "instagram",
      sourceUrl: "https://www.instagram.com/mainsquarefestival/",
    },
    {
      id: "news-mainsquare-2026-programme-complet",
      category: "line-up",
      summary:
        "Programmation complète du Main Square 2026 révélée ! Jessie Murph, The Warning, Renée Rapp, Yamê, L2B et Zaho rejoignent les scènes Vauban et Bastion. Plus de 35 artistes répartis sur 3 jours dans la Citadelle d'Arras.",
      publishedAt: dt("2026-03-10T10:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "site_officiel",
      sourceUrl: "https://mainsquarefestival.fr/",
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
  console.log("✅ Main Square Festival 2026 seedé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
