/**
 * Seed script — Garorock 2026 (30ème édition)
 * Source: garorock.com, sortiraparis.com, handsupelectro.fr, jds.fr
 * Édition 2026 : du 25 au 28 juin 2026 (warm-up jeudi + festival vendredi-dimanche)
 * Lieu : Plaine de la Filhole, Marmande (47)
 * Run: pnpm tsx prisma/seed-garorock-2026.ts
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
  console.log("🌱 Seeding Garorock 2026 (30ème édition)…");

  // ── Festival ───────────────────────────────────────────────────────────────
  const festival = await prisma.festival.upsert({
    where: { slug: "garorock-2026" },
    update: {
      programStatus: "complet",
      ingestionStatus: "enrichi",
    },
    create: {
      slug: "garorock-2026",
      name: "Garorock 2026",
      description:
        "30ème édition de Garorock à la Plaine de la Filhole de Marmande. Festival multigenre mêlant rap, électro, rock indé, bass music et vibes afro-caribéennes. Warm-up le 25 juin + 3 jours de festival (26-28 juin). ~130 000 festivaliers attendus pour cette édition anniversaire.",
      startDate: dt("2026-06-26T12:00:00Z"),
      endDate: dt("2026-06-28T23:59:00Z"),
      city: "Marmande",
      country: "France",
      latitude: 44.4994,
      longitude: 0.1541,
      address: "Plaine de la Filhole, 1 Boulevard Richard Cœur de Lion, 47200 Marmande",
      festivalType: "musique",
      programType: "structuré",
      capacity: 130000,
      siteUrl: "https://www.garorock.com",
      instagramHandle: "festivalgarorock",
      facebookPage: "https://www.facebook.com/garorock",
      xHandle: "garorock",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
      isFeatured: true,
    },
  });
  console.log(`  ✓ Festival: ${festival.name} (id: ${festival.id})`);

  // ── Venues ─────────────────────────────────────────────────────────────────
  const venueMainStage = await prisma.venue.upsert({
    where: { id: "venue-garorock-main" },
    update: {},
    create: {
      id: "venue-garorock-main",
      festivalId: festival.id,
      name: "Grande Scène",
      type: "scène",
      capacity: 60000,
    },
  });

  const venueElectro = await prisma.venue.upsert({
    where: { id: "venue-garorock-electro" },
    update: {},
    create: {
      id: "venue-garorock-electro",
      festivalId: festival.id,
      name: "Scène Électro",
      type: "scène",
      capacity: 20000,
    },
  });

  const venueScene2 = await prisma.venue.upsert({
    where: { id: "venue-garorock-scene2" },
    update: {},
    create: {
      id: "venue-garorock-scene2",
      festivalId: festival.id,
      name: "Scène 2",
      type: "scène",
      capacity: 15000,
    },
  });

  const venueWarmup = await prisma.venue.upsert({
    where: { id: "venue-garorock-warmup" },
    update: {},
    create: {
      id: "venue-garorock-warmup",
      festivalId: festival.id,
      name: "Scène Warm-Up",
      type: "salle",
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
    // ── JEUDI 25 juin — Warm-Up ──
    {
      id: "artist-garorock-kiki",
      name: "KI/KI",
      disciplines: ["electro", "techno"],
      countryCode: "FR",
      venueId: venueWarmup.id,
      startTime: "2026-06-25T22:00:00Z",
      instagram: "kiki_djette",
    },
    {
      id: "artist-garorock-onlynumbers",
      name: "Onlynumbers",
      disciplines: ["electro", "DJ"],
      countryCode: "FR",
      venueId: venueWarmup.id,
      startTime: "2026-06-25T20:00:00Z",
    },
    {
      id: "artist-garorock-benwal",
      name: "Benwal",
      disciplines: ["electro", "DJ"],
      countryCode: "FR",
      venueId: venueWarmup.id,
      startTime: "2026-06-25T23:00:00Z",
    },
    {
      id: "artist-garorock-djkoyla",
      name: "DJ Koyla",
      disciplines: ["DJ", "afro"],
      countryCode: "FR",
      venueId: venueWarmup.id,
      startTime: "2026-06-25T19:00:00Z",
    },

    // ── VENDREDI 26 juin ──
    {
      id: "artist-garorock-bigflo-oli",
      name: "Bigflo & Oli",
      disciplines: ["rap"],
      countryCode: "FR",
      venueId: venueMainStage.id,
      startTime: "2026-06-26T22:30:00Z",
      instagram: "bigfloetoli",
    },
    {
      id: "artist-garorock-major-lazer",
      name: "Major Lazer",
      disciplines: ["dancehall", "electro", "DJ"],
      countryCode: "US",
      venueId: venueMainStage.id,
      startTime: "2026-06-26T21:00:00Z",
      instagram: "majorlazer",
    },
    {
      id: "artist-garorock-timmy-trumpet",
      name: "Timmy Trumpet",
      disciplines: ["electro", "DJ"],
      countryCode: "AU",
      venueId: venueElectro.id,
      startTime: "2026-06-26T23:00:00Z",
      instagram: "timmytrumpet",
    },
    {
      id: "artist-garorock-viagra-boys",
      name: "Viagra Boys",
      disciplines: ["rock", "post-punk"],
      countryCode: "SE",
      venueId: venueScene2.id,
      startTime: "2026-06-26T21:00:00Z",
      instagram: "viagraboys",
    },
    {
      id: "artist-garorock-disiz",
      name: "Disiz",
      disciplines: ["rap", "hip-hop"],
      countryCode: "FR",
      venueId: venueMainStage.id,
      startTime: "2026-06-26T19:00:00Z",
      instagram: "disizlaplaie",
    },
    {
      id: "artist-garorock-last-train",
      name: "Last Train",
      disciplines: ["rock"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-26T19:30:00Z",
      instagram: "lasttrainmusic",
    },
    {
      id: "artist-garorock-mosimann",
      name: "Mosimann",
      disciplines: ["electro", "DJ"],
      countryCode: "FR",
      venueId: venueElectro.id,
      startTime: "2026-06-26T21:00:00Z",
      instagram: "mosimann",
    },
    {
      id: "artist-garorock-47ter",
      name: "47Ter",
      disciplines: ["rap"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-26T17:00:00Z",
      instagram: "47ter_officiel",
    },
    {
      id: "artist-garorock-voilaaa",
      name: "Voilaaa Sound System",
      disciplines: ["afro", "world"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-26T15:00:00Z",
    },

    // ── SAMEDI 27 juin ──
    {
      id: "artist-garorock-kaytranada",
      name: "Kaytranada",
      disciplines: ["electro", "house", "DJ"],
      countryCode: "CA",
      venueId: venueMainStage.id,
      startTime: "2026-06-27T22:30:00Z",
      instagram: "kaytranada",
    },
    {
      id: "artist-garorock-plk",
      name: "PLK",
      disciplines: ["rap", "drill"],
      countryCode: "FR",
      venueId: venueMainStage.id,
      startTime: "2026-06-27T21:00:00Z",
      instagram: "plk_",
    },
    {
      id: "artist-garorock-tom-odell",
      name: "Tom Odell",
      disciplines: ["pop", "rock", "indie"],
      countryCode: "GB",
      venueId: venueScene2.id,
      startTime: "2026-06-27T21:00:00Z",
      instagram: "tomodell",
    },
    {
      id: "artist-garorock-nico-moreno",
      name: "Nico Moreno",
      disciplines: ["techno", "electro"],
      countryCode: "FR",
      venueId: venueElectro.id,
      startTime: "2026-06-27T23:00:00Z",
      instagram: "nicomoreno_official",
    },
    {
      id: "artist-garorock-boulevard-des-airs",
      name: "Boulevard des Airs",
      disciplines: ["pop", "rock"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-27T19:00:00Z",
      instagram: "boulevarddesairs",
    },
    {
      id: "artist-garorock-maureen",
      name: "Maureen",
      disciplines: ["pop", "indie"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-27T17:00:00Z",
      instagram: "maureenmusique",
    },
    {
      id: "artist-garorock-thylacine",
      name: "Thylacine",
      disciplines: ["electro", "ambient"],
      countryCode: "FR",
      venueId: venueElectro.id,
      startTime: "2026-06-27T20:00:00Z",
      instagram: "thylacinemusic",
    },
    {
      id: "artist-garorock-lessss",
      name: "LESSSS",
      disciplines: ["techno", "electro"],
      countryCode: "FR",
      venueId: venueElectro.id,
      startTime: "2026-06-27T21:30:00Z",
    },
    {
      id: "artist-garorock-yuston",
      name: "Yuston XIII",
      disciplines: ["rap", "hip-hop"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-27T15:30:00Z",
    },
    {
      id: "artist-garorock-tshegue",
      name: "Tshegue",
      disciplines: ["afro", "electro"],
      countryCode: "CD",
      venueId: venueScene2.id,
      startTime: "2026-06-27T22:00:00Z",
      instagram: "tsheguemusic",
    },

    // ── DIMANCHE 28 juin ──
    {
      id: "artist-garorock-gims",
      name: "Gims",
      disciplines: ["rap", "afropop"],
      countryCode: "CD",
      venueId: venueMainStage.id,
      startTime: "2026-06-28T22:00:00Z",
      instagram: "mastergimsofficial",
    },
    {
      id: "artist-garorock-vald-collab",
      name: "Vald x Vladimir Cauchemar x Todiefor",
      disciplines: ["rap", "electro"],
      countryCode: "FR",
      venueId: venueMainStage.id,
      startTime: "2026-06-28T20:30:00Z",
    },
    {
      id: "artist-garorock-sofi-tukker",
      name: "Sofi Tukker",
      disciplines: ["electro", "house"],
      countryCode: "US",
      venueId: venueElectro.id,
      startTime: "2026-06-28T22:30:00Z",
      instagram: "sofitukker",
    },
    {
      id: "artist-garorock-theodora",
      name: "Theodora",
      disciplines: ["pop", "R&B"],
      countryCode: "FR",
      venueId: venueMainStage.id,
      startTime: "2026-06-28T19:00:00Z",
      instagram: "theodora_music",
    },
    {
      id: "artist-garorock-sara-landry",
      name: "Sara Landry",
      disciplines: ["techno", "electro"],
      countryCode: "US",
      venueId: venueElectro.id,
      startTime: "2026-06-28T21:00:00Z",
      instagram: "saralandry",
    },
    {
      id: "artist-garorock-dub-inc",
      name: "Dub Inc",
      disciplines: ["reggae", "world"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-28T20:00:00Z",
      instagram: "dubincofficiel",
    },
    {
      id: "artist-garorock-synapson",
      name: "Synapson",
      disciplines: ["electro", "house", "DJ"],
      countryCode: "FR",
      venueId: venueElectro.id,
      startTime: "2026-06-28T19:00:00Z",
      instagram: "synapson",
    },
    {
      id: "artist-garorock-eve-la-marka",
      name: "Eve La Marka",
      disciplines: ["rap", "R&B"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-28T17:00:00Z",
      instagram: "evelamarka",
    },
    {
      id: "artist-garorock-olivia-merilahti",
      name: "Olivia Merilahti",
      disciplines: ["pop", "soul"],
      countryCode: "FR",
      venueId: venueScene2.id,
      startTime: "2026-06-28T15:30:00Z",
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

    const eventId = `event-garorock-2026-${spec.id}`;
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
      id: "news-garorock-2026-programmation-complete",
      category: "line-up",
      summary:
        "Programmation Garorock 2026 complète ! Plus de 45 nouveaux noms révélés dont Sara Landry, Sofi Tukker, Theodora, Kaytranada et Vald x Vladimir Cauchemar x Todiefor pour cette 30ème édition anniversaire à Marmande (26-28 juin).",
      publishedAt: dt("2026-03-02T10:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: true,
      source: "site_officiel",
      sourceUrl: "https://www.garorock.com/",
    },
    {
      id: "news-garorock-2026-premiere-vague",
      category: "line-up",
      summary:
        "Garorock 2026 (30ème édition) annonce sa première vague : Bigflo & Oli, Major Lazer, Gims, PLK, Kaytranada et Nico Moreno en tête d'affiche. Warm-up le 25 juin avec KI/KI.",
      publishedAt: dt("2025-11-20T09:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "instagram",
      sourceUrl: "https://www.instagram.com/festivalgarorock/",
    },
    {
      id: "news-garorock-2026-30ans",
      category: "autre",
      summary:
        "Garorock fête ses 30 ans ! L'édition 2026 s'annonce XXL avec une programmation éclectique mêlant rap, électro, rock indé et world music. Pass 3 jours à partir de 110€, Pass Culture accepté.",
      publishedAt: dt("2026-01-15T10:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "site_officiel",
      sourceUrl: "https://www.garorock.com/",
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
  console.log("✅ Garorock 2026 seedé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
