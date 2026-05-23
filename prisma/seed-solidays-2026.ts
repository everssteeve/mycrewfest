/**
 * Seed script — Solidays 2026
 * Source: solidays.org, programmation complète dévoilée le 5 mai 2026
 * Run: pnpm tsx prisma/seed-solidays-2026.ts
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
  console.log("🌱 Seeding Solidays 2026…");

  // ── Festival ───────────────────────────────────────────────────────────────
  const festival = await prisma.festival.upsert({
    where: { slug: "solidays-2026" },
    update: {
      programStatus: "complet",
      ingestionStatus: "enrichi",
    },
    create: {
      slug: "solidays-2026",
      name: "Solidays 2026",
      description:
        "Festival de musique et de solidarité de 3 jours organisé par l'association Solidarité Sida à l'Hippodrome Paris-Longchamp. Plus de 80 concerts sur plusieurs scènes, villages associatifs, expositions et mobilisation contre le VIH/SIDA. ~250 000 festivaliers attendus.",
      startDate: dt("2026-06-26T12:00:00Z"),
      endDate: dt("2026-06-28T23:59:00Z"),
      city: "Paris",
      country: "France",
      latitude: 48.8583,
      longitude: 2.2495,
      address: "Hippodrome de Paris-Longchamp, Route des Tribunes, 75016 Paris",
      festivalType: "musique",
      programType: "structuré",
      capacity: 83000,
      siteUrl: "https://www.solidays.org",
      instagramHandle: "solidays",
      facebookPage: "https://www.facebook.com/FestivalSolidays",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
      isFeatured: true,
    },
  });
  console.log(`  ✓ Festival: ${festival.name} (id: ${festival.id})`);

  // ── Venues ─────────────────────────────────────────────────────────────────
  const venueParis = await prisma.venue.upsert({
    where: { id: "venue-solidays-paris" },
    update: {},
    create: {
      id: "venue-solidays-paris",
      festivalId: festival.id,
      name: "Scène Paris",
      type: "scène",
      capacity: 50000,
    },
  });

  const venueBagatelle = await prisma.venue.upsert({
    where: { id: "venue-solidays-bagatelle" },
    update: {},
    create: {
      id: "venue-solidays-bagatelle",
      festivalId: festival.id,
      name: "Scène Bagatelle",
      type: "scène",
      capacity: 20000,
    },
  });

  const venueElectro = await prisma.venue.upsert({
    where: { id: "venue-solidays-electro" },
    update: {},
    create: {
      id: "venue-solidays-electro",
      festivalId: festival.id,
      name: "Scène Électro",
      type: "salle",
      capacity: 8000,
    },
  });

  console.log("  ✓ Venues créés");

  // ── Artists ────────────────────────────────────────────────────────────────
  type ArtistSpec = {
    id: string;
    name: string;
    disciplines: string[];
    countryCode: string;
    day: "vendredi" | "samedi" | "dimanche";
    venueId: string;
    startTime: string;
  };

  const artistSpecs: ArtistSpec[] = [
    // VENDREDI 26 juin
    { id: "artist-gims", name: "Gims", disciplines: ["rap", "afropop"], countryCode: "CD", day: "vendredi", venueId: venueParis.id, startTime: "2026-06-26T21:30:00Z" },
    { id: "artist-helena-solidays", name: "Helena", disciplines: ["electro", "pop"], countryCode: "FR", day: "vendredi", venueId: venueParis.id, startTime: "2026-06-26T19:30:00Z" },
    { id: "artist-i-hate-models", name: "I Hate Models", disciplines: ["techno", "electro"], countryCode: "FR", day: "vendredi", venueId: venueElectro.id, startTime: "2026-06-26T23:00:00Z" },
    { id: "artist-nico-moreno", name: "Nico Moreno", disciplines: ["techno"], countryCode: "FR", day: "vendredi", venueId: venueElectro.id, startTime: "2026-06-26T21:00:00Z" },
    { id: "artist-vald", name: "Vald", disciplines: ["rap"], countryCode: "FR", day: "vendredi", venueId: venueBagatelle.id, startTime: "2026-06-26T22:00:00Z" },
    { id: "artist-naika", name: "Naïka", disciplines: ["pop", "R&B"], countryCode: "FR", day: "vendredi", venueId: venueBagatelle.id, startTime: "2026-06-26T18:00:00Z" },
    { id: "artist-meryl", name: "Meryl", disciplines: ["pop", "R&B"], countryCode: "FR", day: "vendredi", venueId: venueParis.id, startTime: "2026-06-26T18:00:00Z" },
    { id: "artist-guy2bezbar", name: "Guy2Bezbar", disciplines: ["rap"], countryCode: "FR", day: "vendredi", venueId: venueBagatelle.id, startTime: "2026-06-26T16:30:00Z" },
    { id: "artist-tshegue", name: "Tshegue", disciplines: ["afro", "electro"], countryCode: "CD", day: "vendredi", venueId: venueBagatelle.id, startTime: "2026-06-26T15:00:00Z" },
    { id: "artist-jade-solidays", name: "Jäde", disciplines: ["pop"], countryCode: "FR", day: "vendredi", venueId: venueParis.id, startTime: "2026-06-26T16:30:00Z" },
    // SAMEDI 27 juin
    { id: "artist-bigflo-oli", name: "Bigflo & Oli", disciplines: ["rap"], countryCode: "FR", day: "samedi", venueId: venueParis.id, startTime: "2026-06-27T22:00:00Z" },
    { id: "artist-major-lazer", name: "Major Lazer", disciplines: ["dancehall", "electro"], countryCode: "US", day: "samedi", venueId: venueParis.id, startTime: "2026-06-27T23:30:00Z" },
    { id: "artist-zara-larsson", name: "Zara Larsson", disciplines: ["pop"], countryCode: "SE", day: "samedi", venueId: venueParis.id, startTime: "2026-06-27T20:30:00Z" },
    { id: "artist-amelie-lens", name: "Amelie Lens", disciplines: ["techno"], countryCode: "BE", day: "samedi", venueId: venueElectro.id, startTime: "2026-06-27T22:00:00Z" },
    { id: "artist-nina-kraviz", name: "Nina Kraviz", disciplines: ["techno", "electro"], countryCode: "RU", day: "samedi", venueId: venueElectro.id, startTime: "2026-06-27T23:30:00Z" },
    { id: "artist-suzane", name: "Suzane", disciplines: ["electro", "pop"], countryCode: "FR", day: "samedi", venueId: venueBagatelle.id, startTime: "2026-06-27T20:00:00Z" },
    { id: "artist-josman", name: "Josman", disciplines: ["rap"], countryCode: "FR", day: "samedi", venueId: venueBagatelle.id, startTime: "2026-06-27T18:30:00Z" },
    { id: "artist-luiza", name: "Luiza", disciplines: ["pop", "soul"], countryCode: "FR", day: "samedi", venueId: venueParis.id, startTime: "2026-06-27T18:00:00Z" },
    { id: "artist-last-train", name: "Last Train", disciplines: ["rock"], countryCode: "FR", day: "samedi", venueId: venueBagatelle.id, startTime: "2026-06-27T16:30:00Z" },
    { id: "artist-zaho", name: "Zaho", disciplines: ["R&B", "soul"], countryCode: "DZ", day: "samedi", venueId: venueBagatelle.id, startTime: "2026-06-27T15:00:00Z" },
    // DIMANCHE 28 juin
    { id: "artist-orelsan-solidays", name: "Orelsan", disciplines: ["rap"], countryCode: "FR", day: "dimanche", venueId: venueParis.id, startTime: "2026-06-28T22:00:00Z" },
    { id: "artist-gazo", name: "Gazo", disciplines: ["rap", "drill"], countryCode: "FR", day: "dimanche", venueId: venueParis.id, startTime: "2026-06-28T23:30:00Z" },
    { id: "artist-jade-pop", name: "Jade", disciplines: ["pop"], countryCode: "FR", day: "dimanche", venueId: venueBagatelle.id, startTime: "2026-06-28T22:00:00Z" },
    { id: "artist-l2b", name: "L2B", disciplines: ["rap"], countryCode: "FR", day: "dimanche", venueId: venueBagatelle.id, startTime: "2026-06-28T20:30:00Z" },
    { id: "artist-yael-naim", name: "Yael Naim", disciplines: ["pop", "indie"], countryCode: "IL", day: "dimanche", venueId: venueParis.id, startTime: "2026-06-28T18:30:00Z" },
    { id: "artist-mosimann", name: "Mosimann", disciplines: ["electro", "DJ"], countryCode: "FR", day: "dimanche", venueId: venueElectro.id, startTime: "2026-06-28T22:00:00Z" },
    { id: "artist-bilal-hassani", name: "Bilal Hassani", disciplines: ["pop"], countryCode: "FR", day: "dimanche", venueId: venueBagatelle.id, startTime: "2026-06-28T18:00:00Z" },
    { id: "artist-skip-the-use", name: "Skip The Use", disciplines: ["rock", "electro"], countryCode: "FR", day: "dimanche", venueId: venueParis.id, startTime: "2026-06-28T17:00:00Z" },
    { id: "artist-iliona", name: "Iliona", disciplines: ["pop", "electropop"], countryCode: "FR", day: "dimanche", venueId: venueParis.id, startTime: "2026-06-28T20:00:00Z" },
  ];

  for (const spec of artistSpecs) {
    // Upsert artist
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

    // Create event (skip if already exists for this festival + artist)
    const eventId = `event-solidays-2026-${spec.id}`;
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
        endTime: new Date(dt(spec.startTime).getTime() + 75 * 60 * 1000), // 75 min default
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
      id: "news-solidays-2026-complet",
      category: "line-up",
      summary:
        "Programmation Solidays 2026 complète ! Gazo, Jade, Meryl, Bilal Hassani, Last Train, Vacra… 30 nouveaux artistes rejoignent l'affiche du 26-28 juin à Longchamp.",
      publishedAt: dt("2026-05-05T10:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: true,
      source: "site_officiel",
      sourceUrl: "https://www.solidays.org/solidays-26-cest-parti/",
    },
    {
      id: "news-solidays-2026-major-lazer",
      category: "line-up",
      summary:
        "Major Lazer, Vald x Vladimir Cauchemar x Todiefor, Amelie Lens et I Hate Models rejoignent la programmation Solidays 2026 — vague d'annonces de février.",
      publishedAt: dt("2026-02-10T09:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "instagram",
      sourceUrl: "https://www.instagram.com/solidays/",
    },
    {
      id: "news-solidays-2026-premiere-vague",
      category: "line-up",
      summary:
        "Solidays 2026 annonce sa première vague : Orelsan, Bigflo & Oli, Nico Moreno, Mosimann, Nina Kraviz, Zara Larsson en tête d'affiche.",
      publishedAt: dt("2025-12-05T09:00:00Z"),
      urgencyLevel: "normal" as const,
      isPinned: false,
      source: "site_officiel",
      sourceUrl: "https://www.solidays.org/",
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
  console.log("✅ Solidays 2026 seedé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
