import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcrypt";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dt(iso: string): Date {
  return new Date(iso);
}

function jsonArr(arr: string[]): string {
  return JSON.stringify(arr);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding database…");

  // ── User test ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 10);
  const testUser = await prisma.user.upsert({
    where: { email: "test@mycrewfest.dev" },
    update: {},
    create: {
      email: "test@mycrewfest.dev",
      name: "Test User",
      pseudo: "tester",
      passwordHash,
      emailVerified: new Date(),
      preferredDisciplines: jsonArr(["musique", "cirque"]),
    },
  });
  console.log(`  ✓ User: ${testUser.email}`);

  // ── Artists / Compagnies ────────────────────────────────────────────────
  const artistRoyal = await prisma.artist.upsert({
    where: { id: "artist-royal-de-luxe" },
    update: {},
    create: {
      id: "artist-royal-de-luxe",
      name: "Royal de Luxe",
      description:
        "Compagnie de théâtre de rue internationale, connue pour ses géants mécaniques.",
      disciplines: jsonArr(["théâtre_rue", "spectacle_géant"]),
      countryCode: "FR",
      siteUrl: "https://www.royaldeluxe.com",
      instagram: "royaldeluxe_officiel",
    },
  });

  const artistArcosm = await prisma.artist.upsert({
    where: { id: "artist-arcosm" },
    update: {},
    create: {
      id: "artist-arcosm",
      name: "Arcosm",
      description: "Compagnie de cirque contemporain pluridisciplinaire.",
      disciplines: jsonArr(["cirque", "danse"]),
      countryCode: "FR",
    },
  });

  const artistMassiveAttack = await prisma.artist.upsert({
    where: { id: "artist-massive-attack" },
    update: {},
    create: {
      id: "artist-massive-attack",
      name: "Massive Attack",
      description: "Groupe de trip-hop britannique fondé à Bristol en 1988.",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
      siteUrl: "https://www.massiveattack.com",
      instagram: "massiveattackofficial",
    },
  });

  const artistGorillaz = await prisma.artist.upsert({
    where: { id: "artist-gorillaz" },
    update: {},
    create: {
      id: "artist-gorillaz",
      name: "Gorillaz",
      description: "Groupe de musique virtuel britannique fondé par Damon Albarn.",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
      siteUrl: "https://www.gorillaz.com",
    },
  });

  const artistCharlatans = await prisma.artist.upsert({
    where: { id: "artist-charlatans" },
    update: {},
    create: {
      id: "artist-charlatans",
      name: "The Charlatans",
      description: "Groupe de rock alternatif britannique des années 90.",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  const artistOumouSangare = await prisma.artist.upsert({
    where: { id: "artist-oumou-sangare" },
    update: {},
    create: {
      id: "artist-oumou-sangare",
      name: "Oumou Sangaré",
      description: "Chanteuse malienne de renommée mondiale, voix du Wassoulou.",
      disciplines: jsonArr(["musique", "world"]),
      countryCode: "ML",
      instagram: "oumousangare_officiel",
    },
  });

  const artistNusrat = await prisma.artist.upsert({
    where: { id: "artist-nusrat" },
    update: {},
    create: {
      id: "artist-nusrat",
      name: "Rahat Fateh Ali Khan",
      description: "Chanteur de qawwali pakistanais, héritier de la tradition de Nusrat.",
      disciplines: jsonArr(["musique", "world", "qawwali"]),
      countryCode: "PK",
    },
  });

  const artistLen = await prisma.artist.upsert({
    where: { id: "artist-len-faki" },
    update: {},
    create: {
      id: "artist-len-faki",
      name: "Len Faki",
      description: "DJ et producteur de techno berlinois, résident du Berghain.",
      disciplines: jsonArr(["musique", "techno"]),
      countryCode: "DE",
      instagram: "lenfaki",
    },
  });

  const artistNineInch = await prisma.artist.upsert({
    where: { id: "artist-nine-inch-nails" },
    update: {},
    create: {
      id: "artist-nine-inch-nails",
      name: "Nine Inch Nails",
      description: "Groupe de rock industriel américain dirigé par Trent Reznor.",
      disciplines: jsonArr(["musique", "industrial"]),
      countryCode: "US",
      siteUrl: "https://www.nin.com",
    },
  });

  console.log("  ✓ Artists/Compagnies créés");

  // ── 1. We Love Green (hybride, Paris) ───────────────────────────────────
  const wlg = await prisma.festival.upsert({
    where: { slug: "we-love-green-2025" },
    update: {},
    create: {
      slug: "we-love-green-2025",
      name: "We Love Green 2025",
      description:
        "Festival de musique éco-responsable au coeur du Bois de Vincennes. Musique, culture et engagement écologique.",
      startDate: dt("2025-05-30T12:00:00Z"),
      endDate: dt("2025-06-01T23:59:00Z"),
      city: "Paris",
      country: "France",
      latitude: 48.8361,
      longitude: 2.4449,
      address: "Bois de Vincennes, Route de la Pyramide, 75012 Paris",
      festivalType: "multidisciplinaire",
      programType: "hybride",
      capacity: 40000,
      siteUrl: "https://welovegreen.fr",
      instagramHandle: "welovegreen",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  // Venues WLG
  const wlgScenePrincipale = await prisma.venue.upsert({
    where: { id: "venue-wlg-principale" },
    update: {},
    create: {
      id: "venue-wlg-principale",
      festivalId: wlg.id,
      name: "Scène Principale",
      type: "scène",
      capacity: 25000,
      latitude: 48.8361,
      longitude: 2.4440,
    },
  });

  const wlgSceneBosquet = await prisma.venue.upsert({
    where: { id: "venue-wlg-bosquet" },
    update: {},
    create: {
      id: "venue-wlg-bosquet",
      festivalId: wlg.id,
      name: "Scène Bosquet",
      type: "scène",
      capacity: 8000,
      latitude: 48.8371,
      longitude: 2.4460,
    },
  });

  const wlgSceneLab = await prisma.venue.upsert({
    where: { id: "venue-wlg-lab" },
    update: {},
    create: {
      id: "venue-wlg-lab",
      festivalId: wlg.id,
      name: "Green Lab",
      type: "espace",
      capacity: 2000,
      latitude: 48.8351,
      longitude: 2.4455,
    },
  });

  const wlgForet = await prisma.venue.upsert({
    where: { id: "venue-wlg-foret" },
    update: {},
    create: {
      id: "venue-wlg-foret",
      festivalId: wlg.id,
      name: "Forêt Électronique",
      type: "plein_air",
      capacity: 5000,
      latitude: 48.8355,
      longitude: 2.4430,
    },
  });

  // Events WLG
  const wlgEvents = [
    {
      id: "evt-wlg-massive-attack",
      festivalId: wlg.id,
      venueId: wlgScenePrincipale.id,
      artistId: artistMassiveAttack.id,
      title: "Massive Attack",
      eventType: "concert",
      startTime: dt("2025-05-30T22:00:00Z"),
      endTime: dt("2025-05-31T00:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["trip-hop", "électronique", "têtes_d_affiche"]),
    },
    {
      id: "evt-wlg-gorillaz",
      festivalId: wlg.id,
      venueId: wlgScenePrincipale.id,
      artistId: artistGorillaz.id,
      title: "Gorillaz",
      eventType: "concert",
      startTime: dt("2025-05-31T21:00:00Z"),
      endTime: dt("2025-05-31T23:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["alternative", "électronique", "têtes_d_affiche"]),
    },
    {
      id: "evt-wlg-charlatans",
      festivalId: wlg.id,
      venueId: wlgSceneBosquet.id,
      artistId: artistCharlatans.id,
      title: "The Charlatans",
      eventType: "concert",
      startTime: dt("2025-05-30T19:30:00Z"),
      endTime: dt("2025-05-30T21:00:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "britpop"]),
    },
    {
      id: "evt-wlg-len-faki",
      festivalId: wlg.id,
      venueId: wlgForet.id,
      artistId: artistLen.id,
      title: "Len Faki",
      eventType: "concert",
      startTime: dt("2025-05-31T01:00:00Z"),
      endTime: dt("2025-05-31T04:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "berghain"]),
    },
    {
      id: "evt-wlg-atelier-eco",
      festivalId: wlg.id,
      venueId: wlgSceneLab.id,
      title: "Atelier : Musique & Environnement",
      eventType: "atelier",
      startTime: dt("2025-05-31T14:00:00Z"),
      endTime: dt("2025-05-31T16:00:00Z"),
      durationMins: 120,
      access: "réservation_séparée",
      status: "confirmé",
      tags: jsonArr(["écologie", "atelier"]),
    },
    {
      id: "evt-wlg-conf-climat",
      festivalId: wlg.id,
      venueId: wlgSceneLab.id,
      title: "Conférence : L'industrie musicale face au défi climatique",
      eventType: "conférence",
      startTime: dt("2025-06-01T11:00:00Z"),
      endTime: dt("2025-06-01T12:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["conférence", "écologie"]),
    },
    {
      id: "evt-wlg-nin",
      festivalId: wlg.id,
      venueId: wlgScenePrincipale.id,
      artistId: artistNineInch.id,
      title: "Nine Inch Nails",
      eventType: "concert",
      startTime: dt("2025-06-01T21:30:00Z"),
      endTime: dt("2025-06-01T23:30:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["industrial", "rock"]),
    },
    {
      id: "evt-wlg-installation",
      festivalId: wlg.id,
      venueId: wlgForet.id,
      title: "Installation sonore : Échos de la forêt",
      eventType: "installation",
      startTime: dt("2025-05-30T15:00:00Z"),
      endTime: dt("2025-06-01T20:00:00Z"),
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["installation", "art_sonore"]),
    },
    {
      id: "evt-wlg-dj-set-opening",
      festivalId: wlg.id,
      venueId: wlgForet.id,
      title: "Opening DJ Set — Kollektiv Turmstrasse",
      eventType: "concert",
      startTime: dt("2025-05-30T23:00:00Z"),
      endTime: dt("2025-05-31T02:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "minimal"]),
    },
    {
      id: "evt-wlg-parade",
      festivalId: wlg.id,
      title: "Parade Verte — défilé éco-festif",
      eventType: "défilé",
      startTime: dt("2025-06-01T14:00:00Z"),
      endTime: dt("2025-06-01T15:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["défilé", "participatif"]),
    },
  ];

  for (const evt of wlgEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  // News WLG
  const wlgNews = [
    {
      id: "news-wlg-1",
      festivalId: wlg.id,
      source: "instagram",
      publishedAt: dt("2025-04-15T10:00:00Z"),
      category: "line-up",
      summary: "Confirmation officielle : Nine Inch Nails rejoignent le line-up de WLG 2025 pour une date exclusive en France !",
      urgencyLevel: "normal",
      isPinned: true,
    },
    {
      id: "news-wlg-2",
      festivalId: wlg.id,
      source: "site_officiel",
      publishedAt: dt("2025-05-02T09:00:00Z"),
      category: "logistique",
      summary: "Les transports en commun vers le Bois de Vincennes seront renforcés les 30, 31 mai et 1er juin. Navettes gratuites depuis la station Château de Vincennes (ligne 1).",
      urgencyLevel: "normal",
      isPinned: false,
    },
    {
      id: "news-wlg-3",
      festivalId: wlg.id,
      source: "x",
      publishedAt: dt("2025-05-20T14:30:00Z"),
      category: "programme-change",
      summary: "Mise à jour des horaires : Gorillaz jouent désormais à 21h (et non 22h) pour des raisons techniques. Vérifiez votre programme !",
      urgencyLevel: "critique",
      isPinned: true,
    },
  ];

  for (const news of wlgNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${wlg.name} (${wlgEvents.length} events, ${wlgNews.length} news)`);

  // ── 2. Festival d'Aurillac (déambulatoire, Aurillac) ───────────────────
  const aurillac = await prisma.festival.upsert({
    where: { slug: "festival-aurillac-2025" },
    update: {},
    create: {
      slug: "festival-aurillac-2025",
      name: "Festival International de Théâtre de Rue d'Aurillac",
      description:
        "L'un des plus importants festivals de théâtre de rue au monde. La ville entière se transforme en scène pendant 4 jours.",
      startDate: dt("2025-08-20T09:00:00Z"),
      endDate: dt("2025-08-23T23:59:00Z"),
      city: "Aurillac",
      country: "France",
      latitude: 44.9286,
      longitude: 2.4421,
      address: "Aurillac, Cantal",
      festivalType: "theatre_rue",
      programType: "déambulatoire",
      capacity: 80000,
      siteUrl: "https://aurillac.net",
      instagramHandle: "festivalaurillac",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "partiel",
    },
  });

  // Venues (espaces) Aurillac
  const aurVenuePlaceSquirou = await prisma.venue.upsert({
    where: { id: "venue-aurillac-place-squirou" },
    update: {},
    create: {
      id: "venue-aurillac-place-squirou",
      festivalId: aurillac.id,
      name: "Place du Squirou",
      type: "rue",
      latitude: 44.9291,
      longitude: 2.4416,
    },
  });

  const aurVenueChateau = await prisma.venue.upsert({
    where: { id: "venue-aurillac-chateau" },
    update: {},
    create: {
      id: "venue-aurillac-chateau",
      festivalId: aurillac.id,
      name: "Esplanade du Château St-Étienne",
      type: "plein_air",
      capacity: 5000,
      latitude: 44.9301,
      longitude: 2.4401,
    },
  });

  const aurVenueRuePierre = await prisma.venue.upsert({
    where: { id: "venue-aurillac-rue-pierre" },
    update: {},
    create: {
      id: "venue-aurillac-rue-pierre",
      festivalId: aurillac.id,
      name: "Rue des Forgerons",
      type: "rue",
      latitude: 44.9280,
      longitude: 2.4430,
    },
  });

  // Compagnies / Events Aurillac (déambulatoire = lots of short shows)
  const aurillacEvents = [
    {
      id: "evt-aurillac-royal-de-luxe",
      festivalId: aurillac.id,
      venueId: aurVenuePlaceSquirou.id,
      artistId: artistRoyal.id,
      title: "Royal de Luxe — La Visite du Géant",
      eventType: "spectacle",
      startTime: dt("2025-08-20T16:00:00Z"),
      endTime: dt("2025-08-20T18:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["géant", "parade", "incontournable"]),
    },
    {
      id: "evt-aurillac-arcosm",
      festivalId: aurillac.id,
      venueId: aurVenueChateau.id,
      artistId: artistArcosm.id,
      title: "Arcosm — Under My Skin",
      eventType: "spectacle",
      startTime: dt("2025-08-21T20:30:00Z"),
      endTime: dt("2025-08-21T21:30:00Z"),
      durationMins: 60,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["cirque", "danse", "intime"]),
    },
    {
      id: "evt-aurillac-circ1",
      festivalId: aurillac.id,
      venueId: aurVenueRuePierre.id,
      title: "Cie Les Hommes Penchés — Équilibre(s)",
      eventType: "spectacle",
      startTime: dt("2025-08-20T11:00:00Z"),
      endTime: dt("2025-08-20T11:45:00Z"),
      durationMins: 45,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["cirque", "rue", "acrobatie"]),
    },
    {
      id: "evt-aurillac-circ2",
      festivalId: aurillac.id,
      venueId: aurVenueRuePierre.id,
      title: "Cie Les Hommes Penchés — Équilibre(s) (2e représentation)",
      eventType: "spectacle",
      startTime: dt("2025-08-21T11:00:00Z"),
      endTime: dt("2025-08-21T11:45:00Z"),
      durationMins: 45,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["cirque", "rue", "acrobatie"]),
    },
    {
      id: "evt-aurillac-marionnettes",
      festivalId: aurillac.id,
      venueId: aurVenuePlaceSquirou.id,
      title: "Cie Casus Belli — Marionnettes Géantes de Nuit",
      eventType: "spectacle",
      startTime: dt("2025-08-21T22:00:00Z"),
      endTime: dt("2025-08-21T23:00:00Z"),
      durationMins: 60,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["marionnettes", "nocturne", "spectaculaire"]),
    },
    {
      id: "evt-aurillac-parade-ouverture",
      festivalId: aurillac.id,
      title: "Parade d'ouverture — Toutes compagnies",
      eventType: "défilé",
      startTime: dt("2025-08-20T09:30:00Z"),
      endTime: dt("2025-08-20T11:00:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["parade", "ouverture"]),
    },
    {
      id: "evt-aurillac-feu",
      festivalId: aurillac.id,
      venueId: aurVenueChateau.id,
      title: "Cie Carabosse — Jardin de Feu",
      eventType: "installation",
      startTime: dt("2025-08-22T21:00:00Z"),
      endTime: dt("2025-08-22T23:30:00Z"),
      durationMins: 150,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["feu", "installation", "nocturne"]),
    },
    {
      id: "evt-aurillac-hip-hop",
      festivalId: aurillac.id,
      venueId: aurVenueRuePierre.id,
      title: "Cie KompleXKapharnaüm — Cypher Urbain",
      eventType: "cypher",
      startTime: dt("2025-08-23T15:00:00Z"),
      endTime: dt("2025-08-23T17:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["hip-hop", "danse_rue", "participatif"]),
    },
  ];

  for (const evt of aurillacEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  const aurillacNews = [
    {
      id: "news-aurillac-1",
      festivalId: aurillac.id,
      source: "site_officiel",
      publishedAt: dt("2025-07-01T09:00:00Z"),
      category: "line-up",
      summary: "Programme 2025 : 120 compagnies internationales confirmées, dont 40 premières françaises. La Géorgie est le pays invité cette année.",
      urgencyLevel: "normal",
      isPinned: true,
    },
    {
      id: "news-aurillac-2",
      festivalId: aurillac.id,
      source: "instagram",
      publishedAt: dt("2025-08-10T15:00:00Z"),
      category: "logistique",
      summary: "Rappel : le centre-ville est fermé à la circulation du 20 au 23 août. Parkings relais disponibles à l'entrée de la ville avec navettes.",
      urgencyLevel: "normal",
      isPinned: false,
    },
    {
      id: "news-aurillac-3",
      festivalId: aurillac.id,
      source: "x",
      publishedAt: dt("2025-08-19T20:00:00Z"),
      category: "logistique",
      summary: "Canicule annoncée sur le Cantal. Pensez à vous hydrater ! Points d'eau gratuits dans toute la ville + brumisateurs place du Squirou.",
      urgencyLevel: "critique",
      isPinned: true,
    },
  ];

  for (const news of aurillacNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${aurillac.name} (${aurillacEvents.length} events, ${aurillacNews.length} news)`);

  // ── 3. Dour Festival (musique, Belgique) ────────────────────────────────
  const dour = await prisma.festival.upsert({
    where: { slug: "dour-festival-2025" },
    update: {},
    create: {
      slug: "dour-festival-2025",
      name: "Dour Festival 2025",
      description:
        "L'un des plus grands festivals de musique alternative en Belgique. Electro, punk, hip-hop, metal — 5 jours de musique non-stop.",
      startDate: dt("2025-07-16T12:00:00Z"),
      endDate: dt("2025-07-20T06:00:00Z"),
      city: "Dour",
      country: "Belgique",
      latitude: 50.3957,
      longitude: 3.7728,
      address: "Plaine de la Machine à Feu, Dour, Belgique",
      festivalType: "musique",
      programType: "structuré",
      capacity: 200000,
      siteUrl: "https://dourfestival.be",
      instagramHandle: "dourfestival",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  const dourLaVache = await prisma.venue.upsert({
    where: { id: "venue-dour-la-vache" },
    update: {},
    create: {
      id: "venue-dour-la-vache",
      festivalId: dour.id,
      name: "La Vache — Scène Principale",
      type: "scène",
      capacity: 80000,
      latitude: 50.3960,
      longitude: 3.7720,
    },
  });

  const dourLaFarm = await prisma.venue.upsert({
    where: { id: "venue-dour-la-farm" },
    update: {},
    create: {
      id: "venue-dour-la-farm",
      festivalId: dour.id,
      name: "La Farm",
      type: "salle",
      capacity: 15000,
      latitude: 50.3970,
      longitude: 3.7730,
    },
  });

  const dourLastArena = await prisma.venue.upsert({
    where: { id: "venue-dour-last-arena" },
    update: {},
    create: {
      id: "venue-dour-last-arena",
      festivalId: dour.id,
      name: "Last Arena",
      type: "salle",
      capacity: 30000,
      latitude: 50.3965,
      longitude: 3.7740,
    },
  });

  const dourEvents = [
    {
      id: "evt-dour-nin",
      festivalId: dour.id,
      venueId: dourLaVache.id,
      artistId: artistNineInch.id,
      title: "Nine Inch Nails",
      eventType: "concert",
      startTime: dt("2025-07-18T22:00:00Z"),
      endTime: dt("2025-07-19T00:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["industrial", "rock", "tête_d_affiche"]),
    },
    {
      id: "evt-dour-len-faki",
      festivalId: dour.id,
      venueId: dourLastArena.id,
      artistId: artistLen.id,
      title: "Len Faki b2b Paula Temple",
      eventType: "concert",
      startTime: dt("2025-07-17T02:00:00Z"),
      endTime: dt("2025-07-17T05:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "dark_techno"]),
    },
    {
      id: "evt-dour-gorillaz",
      festivalId: dour.id,
      venueId: dourLaVache.id,
      artistId: artistGorillaz.id,
      title: "Gorillaz",
      eventType: "concert",
      startTime: dt("2025-07-19T21:00:00Z"),
      endTime: dt("2025-07-19T23:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["alternative", "tête_d_affiche"]),
    },
    {
      id: "evt-dour-farm-1",
      festivalId: dour.id,
      venueId: dourLaFarm.id,
      title: "Kode9 + The Spaceape",
      eventType: "concert",
      startTime: dt("2025-07-17T20:00:00Z"),
      endTime: dt("2025-07-17T21:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["dubstep", "grime"]),
    },
    {
      id: "evt-dour-farm-2",
      festivalId: dour.id,
      venueId: dourLaFarm.id,
      title: "Sleaford Mods",
      eventType: "concert",
      startTime: dt("2025-07-18T19:00:00Z"),
      endTime: dt("2025-07-18T20:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["punk", "post-punk"]),
    },
    {
      id: "evt-dour-farm-3",
      festivalId: dour.id,
      venueId: dourLaFarm.id,
      title: "Ibeyi",
      eventType: "concert",
      startTime: dt("2025-07-20T18:00:00Z"),
      endTime: dt("2025-07-20T19:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["soul", "r&b", "afrobeat"]),
    },
    {
      id: "evt-dour-vache-1",
      festivalId: dour.id,
      venueId: dourLaVache.id,
      title: "LCD Soundsystem",
      eventType: "concert",
      startTime: dt("2025-07-17T21:00:00Z"),
      endTime: dt("2025-07-17T23:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["dance-punk", "indé"]),
    },
    {
      id: "evt-dour-vache-2",
      festivalId: dour.id,
      venueId: dourLaVache.id,
      title: "Bicep Live",
      eventType: "concert",
      startTime: dt("2025-07-16T22:00:00Z"),
      endTime: dt("2025-07-16T23:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["électronique", "house"]),
    },
    {
      id: "evt-dour-arena-1",
      festivalId: dour.id,
      venueId: dourLastArena.id,
      title: "Charlotte de Witte",
      eventType: "concert",
      startTime: dt("2025-07-19T01:00:00Z"),
      endTime: dt("2025-07-19T04:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "peak_time"]),
    },
    {
      id: "evt-dour-arena-2",
      festivalId: dour.id,
      venueId: dourLastArena.id,
      title: "Boris Brejcha",
      eventType: "concert",
      startTime: dt("2025-07-20T00:00:00Z"),
      endTime: dt("2025-07-20T03:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["high-tech-minimal", "techno"]),
    },
  ];

  for (const evt of dourEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  const dourNews = [
    {
      id: "news-dour-1",
      festivalId: dour.id,
      source: "facebook",
      publishedAt: dt("2025-06-15T12:00:00Z"),
      category: "line-up",
      summary: "Deuxième vague du line-up annoncée ! 35 nouveaux artistes dont LCD Soundsystem, Sleaford Mods et Ibeyi rejoignent l'affiche.",
      urgencyLevel: "normal",
      isPinned: false,
    },
    {
      id: "news-dour-2",
      festivalId: dour.id,
      source: "site_officiel",
      publishedAt: dt("2025-07-10T10:00:00Z"),
      category: "logistique",
      summary: "Ouverture des campings dès le 15 juillet à 14h. Les bus depuis Bruxelles, Paris et Lille partent depuis les gares centrales — réservation obligatoire.",
      urgencyLevel: "normal",
      isPinned: false,
    },
    {
      id: "news-dour-3",
      festivalId: dour.id,
      source: "instagram",
      publishedAt: dt("2025-07-16T08:00:00Z"),
      category: "programme-change",
      summary: "⚠️ The Prodigy annule sa date pour raisons médicales. Replacement annoncé ce soir.",
      urgencyLevel: "critique",
      isPinned: true,
    },
  ];

  for (const news of dourNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${dour.name} (${dourEvents.length} events, ${dourNews.length} news)`);

  // ── 4. Circa Auch (cirque, Auch) ────────────────────────────────────────
  const circa = await prisma.festival.upsert({
    where: { slug: "circa-auch-2025" },
    update: {},
    create: {
      slug: "circa-auch-2025",
      name: "Circa — Festival International des Arts du Cirque",
      description:
        "Référence internationale du cirque contemporain, Circa présente chaque automne les créations les plus inventives du cirque mondial.",
      startDate: dt("2025-10-22T18:00:00Z"),
      endDate: dt("2025-10-26T22:00:00Z"),
      city: "Auch",
      country: "France",
      latitude: 43.6461,
      longitude: 0.5854,
      address: "Auch, Gers, Occitanie",
      festivalType: "cirque",
      programType: "structuré",
      capacity: 10000,
      siteUrl: "https://www.circa-auch.com",
      instagramHandle: "circa_auch",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "partiel",
    },
  });

  const circaChapiteauPrincipal = await prisma.venue.upsert({
    where: { id: "venue-circa-chapiteau" },
    update: {},
    create: {
      id: "venue-circa-chapiteau",
      festivalId: circa.id,
      name: "Grand Chapiteau",
      type: "salle",
      capacity: 1500,
      latitude: 43.6465,
      longitude: 0.5850,
    },
  });

  const circaEspaceFabrique = await prisma.venue.upsert({
    where: { id: "venue-circa-fabrique" },
    update: {},
    create: {
      id: "venue-circa-fabrique",
      festivalId: circa.id,
      name: "La Fabrique",
      type: "salle",
      capacity: 500,
      latitude: 43.6455,
      longitude: 0.5860,
    },
  });

  const circaEspacePublic = await prisma.venue.upsert({
    where: { id: "venue-circa-espace-public" },
    update: {},
    create: {
      id: "venue-circa-espace-public",
      festivalId: circa.id,
      name: "Espace Public / Rue",
      type: "rue",
      latitude: 43.6461,
      longitude: 0.5858,
    },
  });

  const circaEvents = [
    {
      id: "evt-circa-arcosm-skin",
      festivalId: circa.id,
      venueId: circaChapiteauPrincipal.id,
      artistId: artistArcosm.id,
      title: "Arcosm — Under My Skin (création 2025)",
      eventType: "spectacle",
      startTime: dt("2025-10-22T20:00:00Z"),
      endTime: dt("2025-10-22T21:15:00Z"),
      durationMins: 75,
      access: "réservation_séparée",
      status: "confirmé",
      tags: jsonArr(["cirque", "danse", "création", "incontournable"]),
    },
    {
      id: "evt-circa-arcosm-skin-2",
      festivalId: circa.id,
      venueId: circaChapiteauPrincipal.id,
      artistId: artistArcosm.id,
      title: "Arcosm — Under My Skin (2e représentation)",
      eventType: "spectacle",
      startTime: dt("2025-10-23T20:00:00Z"),
      endTime: dt("2025-10-23T21:15:00Z"),
      durationMins: 75,
      access: "réservation_séparée",
      status: "confirmé",
      tags: jsonArr(["cirque", "danse"]),
    },
    {
      id: "evt-circa-circ-contemp",
      festivalId: circa.id,
      venueId: circaEspaceFabrique.id,
      title: "Cie XY — Il n'est pas encore minuit",
      eventType: "spectacle",
      startTime: dt("2025-10-24T19:00:00Z"),
      endTime: dt("2025-10-24T20:30:00Z"),
      durationMins: 90,
      access: "réservation_séparée",
      status: "confirmé",
      tags: jsonArr(["acrobatie_collective", "poétique"]),
    },
    {
      id: "evt-circa-rue-1",
      festivalId: circa.id,
      venueId: circaEspacePublic.id,
      title: "Cie Cheval blanc — Cascade en plein air",
      eventType: "spectacle",
      startTime: dt("2025-10-25T14:00:00Z"),
      endTime: dt("2025-10-25T15:00:00Z"),
      durationMins: 60,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rue", "gratuit", "famille"]),
    },
    {
      id: "evt-circa-atelier",
      festivalId: circa.id,
      venueId: circaEspaceFabrique.id,
      title: "Atelier initiation acrobatie — 8-14 ans",
      eventType: "atelier",
      startTime: dt("2025-10-25T10:00:00Z"),
      endTime: dt("2025-10-25T12:00:00Z"),
      durationMins: 120,
      ageMin: 8,
      ageMax: 14,
      access: "réservation_séparée",
      status: "confirmé",
      tags: jsonArr(["atelier", "famille", "enfants"]),
    },
    {
      id: "evt-circa-nuit-magique",
      festivalId: circa.id,
      venueId: circaChapiteauPrincipal.id,
      title: "Nuit de cirque — Gala de clôture",
      eventType: "spectacle",
      startTime: dt("2025-10-26T20:00:00Z"),
      endTime: dt("2025-10-26T22:30:00Z"),
      durationMins: 150,
      access: "réservation_séparée",
      status: "confirmé",
      tags: jsonArr(["gala", "clôture", "multi-compagnies"]),
    },
  ];

  for (const evt of circaEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  const circaNews = [
    {
      id: "news-circa-1",
      festivalId: circa.id,
      source: "site_officiel",
      publishedAt: dt("2025-09-01T09:00:00Z"),
      category: "line-up",
      summary: "Programme complet 2025 en ligne ! 15 compagnies de 12 pays, dont 6 créations mondiales. La billetterie ouvre le 5 septembre.",
      urgencyLevel: "normal",
      isPinned: true,
    },
    {
      id: "news-circa-2",
      festivalId: circa.id,
      source: "instagram",
      publishedAt: dt("2025-10-15T11:00:00Z"),
      category: "logistique",
      summary: "Attention : quelques représentations affichent complet. Covoiturage disponible via BlaBlacar depuis Toulouse, Bordeaux et Agen.",
      urgencyLevel: "normal",
      isPinned: false,
    },
  ];

  for (const news of circaNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${circa.name} (${circaEvents.length} events, ${circaNews.length} news)`);

  // ── 5. We Are Electric (techno, Eindhoven) ──────────────────────────────
  const wae = await prisma.festival.upsert({
    where: { slug: "we-are-electric-2025" },
    update: {},
    create: {
      slug: "we-are-electric-2025",
      name: "We Are Electric 2025",
      description:
        "Festival de musique électronique en plein air à Eindhoven. Techno, house, trance — un temple de l'électro néerlandais.",
      startDate: dt("2025-07-05T14:00:00Z"),
      endDate: dt("2025-07-06T06:00:00Z"),
      city: "Eindhoven",
      country: "Pays-Bas",
      latitude: 51.4416,
      longitude: 5.4697,
      address: "Genneper Parken, Eindhoven, Pays-Bas",
      festivalType: "musique",
      programType: "structuré",
      capacity: 25000,
      siteUrl: "https://weareelectric.nl",
      instagramHandle: "weareelectric_",
      ingestionStatus: "vérifié",
      confidenceLevel: "auto",
      programStatus: "complet",
    },
  });

  const waeStageTechno = await prisma.venue.upsert({
    where: { id: "venue-wae-techno" },
    update: {},
    create: {
      id: "venue-wae-techno",
      festivalId: wae.id,
      name: "The Factory",
      type: "scène",
      capacity: 15000,
      latitude: 51.4420,
      longitude: 5.4700,
    },
  });

  const waeStageHouse = await prisma.venue.upsert({
    where: { id: "venue-wae-house" },
    update: {},
    create: {
      id: "venue-wae-house",
      festivalId: wae.id,
      name: "The Garden",
      type: "plein_air",
      capacity: 8000,
      latitude: 51.4412,
      longitude: 5.4690,
    },
  });

  const waeEvents = [
    {
      id: "evt-wae-len-faki",
      festivalId: wae.id,
      venueId: waeStageTechno.id,
      artistId: artistLen.id,
      title: "Len Faki",
      eventType: "concert",
      startTime: dt("2025-07-06T00:00:00Z"),
      endTime: dt("2025-07-06T03:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "berlin", "peak_time"]),
    },
    {
      id: "evt-wae-nina",
      festivalId: wae.id,
      venueId: waeStageTechno.id,
      title: "Nina Kraviz",
      eventType: "concert",
      startTime: dt("2025-07-05T22:00:00Z"),
      endTime: dt("2025-07-06T00:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "trax"]),
    },
    {
      id: "evt-wae-amelie",
      festivalId: wae.id,
      venueId: waeStageTechno.id,
      title: "Amélie Lens",
      eventType: "concert",
      startTime: dt("2025-07-05T20:00:00Z"),
      endTime: dt("2025-07-05T22:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["techno", "belge"]),
    },
    {
      id: "evt-wae-garden-1",
      festivalId: wae.id,
      venueId: waeStageHouse.id,
      title: "Mano Le Tough",
      eventType: "concert",
      startTime: dt("2025-07-05T18:00:00Z"),
      endTime: dt("2025-07-05T20:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["deep_house", "melodic"]),
    },
    {
      id: "evt-wae-garden-2",
      festivalId: wae.id,
      venueId: waeStageHouse.id,
      title: "Peggy Gou",
      eventType: "concert",
      startTime: dt("2025-07-05T21:00:00Z"),
      endTime: dt("2025-07-05T23:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["house", "coréen", "tête_d_affiche"]),
    },
    {
      id: "evt-wae-factory-close",
      festivalId: wae.id,
      venueId: waeStageTechno.id,
      title: "Closing — Ostgut Ton Crew",
      eventType: "concert",
      startTime: dt("2025-07-06T03:00:00Z"),
      endTime: dt("2025-07-06T06:00:00Z"),
      durationMins: 180,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["closing", "berghain", "techno"]),
    },
  ];

  for (const evt of waeEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  const waeNews = [
    {
      id: "news-wae-1",
      festivalId: wae.id,
      source: "instagram",
      publishedAt: dt("2025-06-01T12:00:00Z"),
      category: "line-up",
      summary: "Line-up complet : Len Faki, Nina Kraviz, Amelie Lens, Peggy Gou + 20 autres artistes. Pas de spots restants — sold out en 48h.",
      urgencyLevel: "normal",
      isPinned: false,
    },
    {
      id: "news-wae-2",
      festivalId: wae.id,
      source: "site_officiel",
      publishedAt: dt("2025-07-04T10:00:00Z"),
      category: "logistique",
      summary: "Pas de voitures sur site. Navettes depuis la gare centrale d'Eindhoven (trajet 15 min, départs toutes les 20 min).",
      urgencyLevel: "normal",
      isPinned: false,
    },
  ];

  for (const news of waeNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${wae.name} (${waeEvents.length} events, ${waeNews.length} news)`);

  // ── 6. Les Suds à Arles (world music) ──────────────────────────────────
  const suds = await prisma.festival.upsert({
    where: { slug: "les-suds-arles-2025" },
    update: {},
    create: {
      slug: "les-suds-arles-2025",
      name: "Les Suds, à Arles 2025",
      description:
        "Festival de musiques du monde dans le cadre exceptionnel d'Arles antique. Du flamenco au gnaoua en passant par le fado et les musiques d'Afrique.",
      startDate: dt("2025-07-11T18:00:00Z"),
      endDate: dt("2025-07-14T23:59:00Z"),
      city: "Arles",
      country: "France",
      latitude: 43.6768,
      longitude: 4.6277,
      address: "Théâtre Antique d'Arles & divers lieux, Arles",
      festivalType: "world",
      programType: "structuré",
      capacity: 15000,
      siteUrl: "https://suds-arles.com",
      instagramHandle: "suds_arles",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  const sudsTheatreAntique = await prisma.venue.upsert({
    where: { id: "venue-suds-theatre-antique" },
    update: {},
    create: {
      id: "venue-suds-theatre-antique",
      festivalId: suds.id,
      name: "Théâtre Antique d'Arles",
      type: "plein_air",
      capacity: 2000,
      latitude: 43.6769,
      longitude: 4.6280,
    },
  });

  const sudsEspace = await prisma.venue.upsert({
    where: { id: "venue-suds-espace-van-gogh" },
    update: {},
    create: {
      id: "venue-suds-espace-van-gogh",
      festivalId: suds.id,
      name: "Espace Van Gogh",
      type: "espace",
      capacity: 800,
      latitude: 43.6760,
      longitude: 4.6265,
    },
  });

  const sudsPlace = await prisma.venue.upsert({
    where: { id: "venue-suds-place-republique" },
    update: {},
    create: {
      id: "venue-suds-place-republique",
      festivalId: suds.id,
      name: "Place de la République",
      type: "plein_air",
      capacity: 3000,
      latitude: 43.6773,
      longitude: 4.6283,
    },
  });

  const sudsEvents = [
    {
      id: "evt-suds-oumou",
      festivalId: suds.id,
      venueId: sudsTheatreAntique.id,
      artistId: artistOumouSangare.id,
      title: "Oumou Sangaré",
      eventType: "concert",
      startTime: dt("2025-07-11T21:30:00Z"),
      endTime: dt("2025-07-11T23:00:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["world", "mali", "wassoulou", "tête_d_affiche"]),
    },
    {
      id: "evt-suds-nusrat",
      festivalId: suds.id,
      venueId: sudsTheatreAntique.id,
      artistId: artistNusrat.id,
      title: "Rahat Fateh Ali Khan",
      eventType: "concert",
      startTime: dt("2025-07-12T21:00:00Z"),
      endTime: dt("2025-07-12T22:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["qawwali", "pakistan", "world"]),
    },
    {
      id: "evt-suds-flamenco",
      festivalId: suds.id,
      venueId: sudsTheatreAntique.id,
      title: "Israel Galván — Solo",
      eventType: "spectacle",
      startTime: dt("2025-07-13T21:00:00Z"),
      endTime: dt("2025-07-13T22:15:00Z"),
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["flamenco", "espagne", "danse"]),
    },
    {
      id: "evt-suds-gnaoua",
      festivalId: suds.id,
      venueId: sudsEspace.id,
      title: "Maâlem Mahmoud Guinia & Gnawa Masters",
      eventType: "concert",
      startTime: dt("2025-07-12T19:00:00Z"),
      endTime: dt("2025-07-12T20:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["gnaoua", "maroc", "rituel"]),
    },
    {
      id: "evt-suds-fado",
      festivalId: suds.id,
      venueId: sudsEspace.id,
      title: "Ana Moura — Fado",
      eventType: "concert",
      startTime: dt("2025-07-14T20:00:00Z"),
      endTime: dt("2025-07-14T21:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["fado", "portugal", "world"]),
    },
    {
      id: "evt-suds-place-free",
      festivalId: suds.id,
      venueId: sudsPlace.id,
      title: "Concert gratuit — Ouverture du festival",
      eventType: "concert",
      startTime: dt("2025-07-11T18:30:00Z"),
      endTime: dt("2025-07-11T20:00:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["gratuit", "ouverture", "world"]),
    },
    {
      id: "evt-suds-conf",
      festivalId: suds.id,
      venueId: sudsEspace.id,
      title: "Table ronde : Musiques du monde et transmission",
      eventType: "conférence",
      startTime: dt("2025-07-13T11:00:00Z"),
      endTime: dt("2025-07-13T13:00:00Z"),
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["débat", "musicologie"]),
    },
    {
      id: "evt-suds-cloture",
      festivalId: suds.id,
      venueId: sudsTheatreAntique.id,
      title: "Grande Nuit de Clôture — Plusieurs artistes",
      eventType: "concert",
      startTime: dt("2025-07-14T21:30:00Z"),
      endTime: dt("2025-07-14T23:59:00Z"),
      durationMins: 150,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["clôture", "world", "multi-artistes"]),
    },
  ];

  for (const evt of sudsEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  const sudsNews = [
    {
      id: "news-suds-1",
      festivalId: suds.id,
      source: "site_officiel",
      publishedAt: dt("2025-05-20T10:00:00Z"),
      category: "line-up",
      summary: "Programme 2025 dévoilé ! Oumou Sangaré, Rahat Fateh Ali Khan, Israel Galván et Ana Moura sont les grandes têtes d'affiche de cette 30e édition.",
      urgencyLevel: "normal",
      isPinned: true,
    },
    {
      id: "news-suds-2",
      festivalId: suds.id,
      source: "instagram",
      publishedAt: dt("2025-07-08T14:00:00Z"),
      category: "logistique",
      summary: "Chaleur exceptionnelle prévue durant le festival. Les concerts en journée déplacés en soirée pour le confort du public.",
      urgencyLevel: "critique",
      isPinned: true,
    },
    {
      id: "news-suds-3",
      festivalId: suds.id,
      source: "facebook",
      publishedAt: dt("2025-07-10T09:00:00Z"),
      category: "logistique",
      summary: "Navettes TER spéciales depuis Marseille, Montpellier et Nîmes les 11, 12, 13 et 14 juillet. Billets combinés concert+train disponibles sur le site.",
      urgencyLevel: "normal",
      isPinned: false,
    },
  ];

  for (const news of sudsNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${suds.name} (${sudsEvents.length} events, ${sudsNews.length} news)`);

  // ── 7. Les Vieilles Charrues 2026 (34ème édition) ──────────────────────
  const vc = await prisma.festival.upsert({
    where: { slug: "vieilles-charrues-2026" },
    update: {},
    create: {
      slug: "vieilles-charrues-2026",
      name: "Festival des Vieilles Charrues 2026",
      description:
        "Le plus grand festival de musique de France, 100% associatif et profondément breton. Fondé en 1992, l'événement réunit chaque année 70 000 festivaliers par jour sur la prairie de Kerampuilh à Carhaix-Plouguer. La 34ème édition célèbre un line-up éclectique allant du rock à la pop en passant par le rap, l'électro et la musique bretonne.",
      startDate: dt("2026-07-16T12:00:00Z"),
      endDate: dt("2026-07-19T23:59:00Z"),
      city: "Carhaix-Plouguer",
      country: "France",
      latitude: 48.2708,
      longitude: -3.5583,
      address: "Prairie de Kerampuilh, 29270 Carhaix-Plouguer",
      festivalType: "musique",
      programType: "scène",
      capacity: 70000,
      siteUrl: "https://www.vieillescharrues.asso.fr",
      instagramHandle: "vieillescharruesofficiel",
      facebookPage: "https://www.facebook.com/lesvieillescharruesofficiel",
      xHandle: "vieillescharrues",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  // Artists — Vieilles Charrues 2026
  const vcArtistKatyPerry = await prisma.artist.upsert({
    where: { id: "artist-katy-perry" },
    update: {},
    create: {
      id: "artist-katy-perry",
      name: "Katy Perry",
      description: "Superstar américaine de la pop, auteure de nombreux hits mondiaux dont Roar, Firework et Dark Horse.",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
      instagram: "katyperry",
    },
  });

  const vcArtistGims = await prisma.artist.upsert({
    where: { id: "artist-gims" },
    update: {},
    create: {
      id: "artist-gims",
      name: "Gims",
      description: "Rappeur et chanteur franco-congolais, l'un des artistes les plus écoutés en France. Ancien membre de Sexion d'Assaut.",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
      instagram: "maître.gims",
    },
  });

  const vcArtistNickCave = await prisma.artist.upsert({
    where: { id: "artist-nick-cave-bad-seeds" },
    update: {},
    create: {
      id: "artist-nick-cave-bad-seeds",
      name: "Nick Cave & The Bad Seeds",
      description: "Formation australienne légendaire autour de Nick Cave, figure incontournable du post-punk et du rock gothique depuis 1983.",
      disciplines: jsonArr(["musique"]),
      countryCode: "AU",
      siteUrl: "https://www.nickcave.com",
      instagram: "nickcaveofficial",
    },
  });

  const vcArtistJLAubert = await prisma.artist.upsert({
    where: { id: "artist-jean-louis-aubert" },
    update: {},
    create: {
      id: "artist-jean-louis-aubert",
      name: "Jean-Louis Aubert",
      description: "Chanteur et guitariste français, cofondateur et frontman du groupe Téléphone, monument du rock français.",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const vcArtistAyaNakamura = await prisma.artist.upsert({
    where: { id: "artist-aya-nakamura" },
    update: {},
    create: {
      id: "artist-aya-nakamura",
      name: "Aya Nakamura",
      description: "Chanteuse franco-malienne, artiste francophone la plus écoutée au monde. Ses tubes Djadja et Pookie ont conquis la planète.",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
      instagram: "ayanakamuraofficial",
    },
  });

  const vcArtistMika = await prisma.artist.upsert({
    where: { id: "artist-mika" },
    update: {},
    create: {
      id: "artist-mika",
      name: "Mika",
      description: "Chanteur britannique d'origine libanaise, auteur de Grace Kelly et Relax, Take It Easy. Pop colorée et performances scéniques spectaculaires.",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
      instagram: "mikainstagram",
    },
  });

  const vcArtistInterpol = await prisma.artist.upsert({
    where: { id: "artist-interpol" },
    update: {},
    create: {
      id: "artist-interpol",
      name: "Interpol",
      description: "Groupe de post-punk revival new-yorkais, connu pour Turn on the Bright Lights et une esthétique sombre et élégante.",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
      siteUrl: "https://www.interpolnyc.com",
    },
  });

  const vcArtistOrelsan = await prisma.artist.upsert({
    where: { id: "artist-orelsan" },
    update: {},
    create: {
      id: "artist-orelsan",
      name: "Orelsan",
      description: "Rappeur normand, l'une des voix les plus importantes du rap français. Son album La Fête est finie a marqué une génération.",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
      instagram: "orelsanofficial",
    },
  });

  const vcArtistVanessaParadis = await prisma.artist.upsert({
    where: { id: "artist-vanessa-paradis" },
    update: {},
    create: {
      id: "artist-vanessa-paradis",
      name: "Vanessa Paradis",
      description: "Chanteuse et actrice française, icône de la chanson française. De Joe le taxi à Be My Baby, une carrière jalonnée de succès.",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const vcArtistFeuChatterton = await prisma.artist.upsert({
    where: { id: "artist-feu-chatterton" },
    update: {},
    create: {
      id: "artist-feu-chatterton",
      name: "Feu! Chatterton",
      description: "Groupe de rock français poétique et psychédélique, auteur de Hier encore et Côte Concorde. Textes ciselés et univers scénique hypnotique.",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
      instagram: "feuchatterton",
    },
  });

  const vcArtistPatrickWatson = await prisma.artist.upsert({
    where: { id: "artist-patrick-watson" },
    update: {},
    create: {
      id: "artist-patrick-watson",
      name: "Patrick Watson",
      description: "Musicien folk-pop canadien, auteur de compositions intimistes et planantes. Reconnu pour ses performances live épurées.",
      disciplines: jsonArr(["musique"]),
      countryCode: "CA",
    },
  });

  // Venues — Vieilles Charrues 2026
  const vcSceneKerampuilh = await prisma.venue.upsert({
    where: { id: "venue-vc-kerampuilh" },
    update: {},
    create: {
      id: "venue-vc-kerampuilh",
      festivalId: vc.id,
      name: "Scène Kerampuilh",
      type: "scène",
      capacity: 50000,
      latitude: 48.2710,
      longitude: -3.5580,
    },
  });

  const vcSceneMarcelGuern = await prisma.venue.upsert({
    where: { id: "venue-vc-marcel-guern" },
    update: {},
    create: {
      id: "venue-vc-marcel-guern",
      festivalId: vc.id,
      name: "Scène Marcel Guern",
      type: "scène",
      capacity: 25000,
      latitude: 48.2705,
      longitude: -3.5590,
    },
  });

  const vcSceneGrune = await prisma.venue.upsert({
    where: { id: "venue-vc-grune-erde" },
    update: {},
    create: {
      id: "venue-vc-grune-erde",
      festivalId: vc.id,
      name: "Scène Grüne Erde",
      type: "scène",
      capacity: 8000,
      latitude: 48.2700,
      longitude: -3.5575,
    },
  });

  const vcSceneFestNoz = await prisma.venue.upsert({
    where: { id: "venue-vc-fest-noz" },
    update: {},
    create: {
      id: "venue-vc-fest-noz",
      festivalId: vc.id,
      name: "Espace Fest Noz",
      type: "scène",
      capacity: 3000,
      latitude: 48.2695,
      longitude: -3.5570,
    },
  });

  // Events — Vieilles Charrues 2026
  const vcEvents = [
    // Jeudi 16 juillet
    {
      id: "evt-vc-katy-perry",
      festivalId: vc.id,
      venueId: vcSceneKerampuilh.id,
      artistId: vcArtistKatyPerry.id,
      title: "Katy Perry",
      eventType: "concert",
      startTime: dt("2026-07-16T21:00:00Z"),
      endTime: dt("2026-07-16T22:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "tête-d-affiche", "incontournable"]),
    },
    {
      id: "evt-vc-gims-jeudi",
      festivalId: vc.id,
      venueId: vcSceneMarcelGuern.id,
      artistId: vcArtistGims.id,
      title: "Gims",
      eventType: "concert",
      startTime: dt("2026-07-16T19:00:00Z"),
      endTime: dt("2026-07-16T20:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "urban"]),
    },
    // Vendredi 17 juillet
    {
      id: "evt-vc-nick-cave",
      festivalId: vc.id,
      venueId: vcSceneKerampuilh.id,
      artistId: vcArtistNickCave.id,
      title: "Nick Cave & The Bad Seeds",
      eventType: "concert",
      startTime: dt("2026-07-17T21:00:00Z"),
      endTime: dt("2026-07-17T22:45:00Z"),
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "post-punk", "légende", "incontournable"]),
    },
    {
      id: "evt-vc-jl-aubert",
      festivalId: vc.id,
      venueId: vcSceneMarcelGuern.id,
      artistId: vcArtistJLAubert.id,
      title: "Jean-Louis Aubert",
      eventType: "concert",
      startTime: dt("2026-07-17T19:00:00Z"),
      endTime: dt("2026-07-17T20:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "française"]),
    },
    {
      id: "evt-vc-patrick-watson",
      festivalId: vc.id,
      venueId: vcSceneGrune.id,
      artistId: vcArtistPatrickWatson.id,
      title: "Patrick Watson",
      eventType: "concert",
      startTime: dt("2026-07-17T17:00:00Z"),
      endTime: dt("2026-07-17T18:00:00Z"),
      durationMins: 60,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["folk", "indie", "intimiste"]),
    },
    // Samedi 18 juillet
    {
      id: "evt-vc-aya-nakamura",
      festivalId: vc.id,
      venueId: vcSceneKerampuilh.id,
      artistId: vcArtistAyaNakamura.id,
      title: "Aya Nakamura",
      eventType: "concert",
      startTime: dt("2026-07-18T21:00:00Z"),
      endTime: dt("2026-07-18T22:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "afropop", "tête-d-affiche"]),
    },
    {
      id: "evt-vc-mika",
      festivalId: vc.id,
      venueId: vcSceneMarcelGuern.id,
      artistId: vcArtistMika.id,
      title: "Mika",
      eventType: "concert",
      startTime: dt("2026-07-18T19:00:00Z"),
      endTime: dt("2026-07-18T20:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "electropop", "festif"]),
    },
    {
      id: "evt-vc-interpol",
      festivalId: vc.id,
      venueId: vcSceneKerampuilh.id,
      artistId: vcArtistInterpol.id,
      title: "Interpol",
      eventType: "concert",
      startTime: dt("2026-07-18T18:00:00Z"),
      endTime: dt("2026-07-18T19:15:00Z"),
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["indie-rock", "post-punk", "new-york"]),
    },
    // Dimanche 19 juillet
    {
      id: "evt-vc-orelsan",
      festivalId: vc.id,
      venueId: vcSceneKerampuilh.id,
      artistId: vcArtistOrelsan.id,
      title: "Orelsan",
      eventType: "concert",
      startTime: dt("2026-07-19T21:00:00Z"),
      endTime: dt("2026-07-19T22:30:00Z"),
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "tête-d-affiche", "incontournable"]),
    },
    {
      id: "evt-vc-vanessa-paradis",
      festivalId: vc.id,
      venueId: vcSceneMarcelGuern.id,
      artistId: vcArtistVanessaParadis.id,
      title: "Vanessa Paradis",
      eventType: "concert",
      startTime: dt("2026-07-19T19:00:00Z"),
      endTime: dt("2026-07-19T20:15:00Z"),
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["chanson", "pop", "icône"]),
    },
    {
      id: "evt-vc-feu-chatterton",
      festivalId: vc.id,
      venueId: vcSceneGrune.id,
      artistId: vcArtistFeuChatterton.id,
      title: "Feu! Chatterton",
      eventType: "concert",
      startTime: dt("2026-07-19T17:30:00Z"),
      endTime: dt("2026-07-19T18:45:00Z"),
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "poétique", "français"]),
    },
  ];

  for (const evt of vcEvents) {
    await prisma.event.upsert({
      where: { id: evt.id },
      update: {},
      create: evt,
    });
  }

  // News — Vieilles Charrues 2026
  const vcNews = [
    {
      id: "news-vc-2026-lineup",
      festivalId: vc.id,
      summary: "Programmation complète dévoilée — 70+ artistes sur 4 jours. Katy Perry, Nick Cave, Aya Nakamura, Orelsan et Mika parmi les têtes d'affiche de la 34ème édition.",
      urgencyLevel: "normal" as const,
      isPinned: true,
      publishedAt: dt("2026-03-15T10:00:00Z"),
      category: "programmation",
      source: "site_officiel",
    },
    {
      id: "news-vc-2026-camping",
      festivalId: vc.id,
      summary: "Camping : ouverture anticipée le 15 juillet à 8h. Les festivaliers peuvent s'installer la veille du premier concert pour éviter les files d'attente. Réservation indispensable.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-05-01T09:00:00Z"),
      category: "logistique",
      source: "site_officiel",
    },
    {
      id: "news-vc-2026-pass-sold-out",
      festivalId: vc.id,
      summary: "Pass 4 jours et 3 jours sold out. Des billets à la journée restent disponibles à partir de 52€ (jeudi) et 61€ (vendredi-dimanche) sur le site officiel.",
      urgencyLevel: "critique" as const,
      isPinned: true,
      publishedAt: dt("2026-04-10T12:00:00Z"),
      category: "billetterie",
      source: "site_officiel",
    },
    {
      id: "news-vc-2026-mobilite",
      festivalId: vc.id,
      summary: "Plan mobilité douce : navettes depuis Brest, Quimper et Rennes. Covoiturage BlaBlaCar disponible. Trains spéciaux ajoutés les 16 et 19 juillet.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-06-01T08:00:00Z"),
      category: "logistique",
      source: "site_officiel",
    },
  ];

  for (const news of vcNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${vc.name} (${vcEvents.length} events, ${vcNews.length} news)`);

  // ── 7. Eurockéennes de Belfort 2026 ─────────────────────────────────────
  const eurocks = await prisma.festival.upsert({
    where: { slug: "eurockeennes-belfort-2026" },
    update: {},
    create: {
      slug: "eurockeennes-belfort-2026",
      name: "Eurockéennes de Belfort 2026",
      description:
        "36ème édition des Eurockéennes sur la Presqu'île du Malsaucy. Quatre jours et quatre scènes entre rock, rap, électro et pop sur l'un des sites naturels les plus spectaculaires de France.",
      startDate: dt("2026-07-02T15:00:00Z"),
      endDate: dt("2026-07-05T23:59:00Z"),
      city: "Belfort",
      country: "France",
      latitude: 47.6189,
      longitude: 6.8378,
      address: "Presqu'île du Malsaucy, 90120 Sermamagny",
      festivalType: "musique",
      programType: "structuré",
      capacity: 90000,
      siteUrl: "https://www.eurockeennes.fr",
      instagramHandle: "eurockeennes",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  // Artists — Eurockéennes 2026 (nouveaux)
  const artistTheOffspring = await prisma.artist.upsert({
    where: { id: "artist-the-offspring" },
    update: {},
    create: {
      id: "artist-the-offspring",
      name: "The Offspring",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
    },
  });

  const artistAirbourne = await prisma.artist.upsert({
    where: { id: "artist-airbourne" },
    update: {},
    create: {
      id: "artist-airbourne",
      name: "Airbourne",
      disciplines: jsonArr(["musique"]),
      countryCode: "AU",
    },
  });

  const artistSocialDistortion = await prisma.artist.upsert({
    where: { id: "artist-social-distortion" },
    update: {},
    create: {
      id: "artist-social-distortion",
      name: "Social Distortion",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
    },
  });

  const artistPulp = await prisma.artist.upsert({
    where: { id: "artist-pulp" },
    update: {},
    create: {
      id: "artist-pulp",
      name: "Pulp",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  const artistTheLumineers = await prisma.artist.upsert({
    where: { id: "artist-the-lumineers" },
    update: {},
    create: {
      id: "artist-the-lumineers",
      name: "The Lumineers",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
    },
  });

  const artistBenHarper = await prisma.artist.upsert({
    where: { id: "artist-ben-harper" },
    update: {},
    create: {
      id: "artist-ben-harper",
      name: "Ben Harper & The Innocent Criminals",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
    },
  });

  const artistJosman = await prisma.artist.upsert({
    where: { id: "artist-josman" },
    update: {},
    create: {
      id: "artist-josman",
      name: "Josman",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const artistAlonzo = await prisma.artist.upsert({
    where: { id: "artist-alonzo" },
    update: {},
    create: {
      id: "artist-alonzo",
      name: "Alonzo",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const artistUltraVomit = await prisma.artist.upsert({
    where: { id: "artist-ultra-vomit" },
    update: {},
    create: {
      id: "artist-ultra-vomit",
      name: "Ultra Vomit",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const artistJehnneyBeth = await prisma.artist.upsert({
    where: { id: "artist-jehnny-beth" },
    update: {},
    create: {
      id: "artist-jehnny-beth",
      name: "Jehnny Beth",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  // Venues — Eurockéennes 2026
  const eurocksGrandeScene = await prisma.venue.upsert({
    where: { id: "venue-eurocks-grande-scene" },
    update: {},
    create: {
      id: "venue-eurocks-grande-scene",
      festivalId: eurocks.id,
      name: "Grande Scène",
      type: "scène",
      capacity: 45000,
      latitude: 47.619,
      longitude: 6.8375,
    },
  });

  const eurocksGreenroom = await prisma.venue.upsert({
    where: { id: "venue-eurocks-greenroom" },
    update: {},
    create: {
      id: "venue-eurocks-greenroom",
      festivalId: eurocks.id,
      name: "Chapiteau Greenroom",
      type: "chapiteau",
      capacity: 8000,
      latitude: 47.618,
      longitude: 6.8365,
    },
  });

  const eurocksPlage = await prisma.venue.upsert({
    where: { id: "venue-eurocks-plage" },
    update: {},
    create: {
      id: "venue-eurocks-plage",
      festivalId: eurocks.id,
      name: "La Plage",
      type: "plein_air",
      capacity: 5000,
      latitude: 47.617,
      longitude: 6.839,
    },
  });

  const eurocksLoggia = await prisma.venue.upsert({
    where: { id: "venue-eurocks-loggia" },
    update: {},
    create: {
      id: "venue-eurocks-loggia",
      festivalId: eurocks.id,
      name: "La Loggia",
      type: "espace",
      capacity: 2000,
      latitude: 47.6195,
      longitude: 6.838,
    },
  });

  // Events — Eurockéennes 2026 (têtes d'affiche par jour)
  // All times converted from CEST (UTC+2) to UTC
  const eurocksEvents = [
    // Jeudi 2 juillet — scène unique rock/punk
    {
      id: "evt-eurocks-social-distortion",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistSocialDistortion.id,
      title: "Social Distortion",
      eventType: "concert",
      startTime: dt("2026-07-02T17:15:00Z"), // 19h15 CEST
      endTime: dt("2026-07-02T18:45:00Z"),   // 20h45 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["punk-rock", "country-punk"]),
    },
    {
      id: "evt-eurocks-the-offspring",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistTheOffspring.id,
      title: "The Offspring",
      eventType: "concert",
      startTime: dt("2026-07-02T19:00:00Z"), // 21h00 CEST
      endTime: dt("2026-07-02T20:45:00Z"),   // 22h45 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["punk-rock", "têtes_d_affiche"]),
    },
    {
      id: "evt-eurocks-airbourne",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistAirbourne.id,
      title: "Airbourne",
      eventType: "concert",
      startTime: dt("2026-07-02T21:15:00Z"), // 23h15 CEST
      endTime: dt("2026-07-02T22:45:00Z"),   // 00h45 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["hard-rock", "rock"]),
    },
    // Vendredi 3 juillet
    {
      id: "evt-eurocks-ultra-vomit",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistUltraVomit.id,
      title: "Ultra Vomit",
      eventType: "concert",
      startTime: dt("2026-07-03T17:30:00Z"), // 19h30 CEST
      endTime: dt("2026-07-03T19:00:00Z"),   // 21h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["metal", "metal-humoristique"]),
    },
    {
      id: "evt-eurocks-orelsan",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: vcArtistOrelsan.id,
      title: "Orelsan",
      eventType: "concert",
      startTime: dt("2026-07-03T19:45:00Z"), // 21h45 CEST
      endTime: dt("2026-07-03T21:30:00Z"),   // 23h30 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "têtes_d_affiche"]),
    },
    // Samedi 4 juillet
    {
      id: "evt-eurocks-josman",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistJosman.id,
      title: "Josman",
      eventType: "concert",
      startTime: dt("2026-07-04T16:15:00Z"), // 18h15 CEST
      endTime: dt("2026-07-04T17:45:00Z"),   // 19h45 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "trap"]),
    },
    {
      id: "evt-eurocks-the-lumineers",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistTheLumineers.id,
      title: "The Lumineers",
      eventType: "concert",
      startTime: dt("2026-07-04T18:30:00Z"), // 20h30 CEST
      endTime: dt("2026-07-04T20:30:00Z"),   // 22h30 CEST
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["folk-rock", "indie-folk"]),
    },
    {
      id: "evt-eurocks-alonzo",
      festivalId: eurocks.id,
      venueId: eurocksGreenroom.id,
      artistId: artistAlonzo.id,
      title: "Alonzo",
      eventType: "concert",
      startTime: dt("2026-07-04T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-07-04T21:00:00Z"),   // 23h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "hip-hop"]),
    },
    {
      id: "evt-eurocks-pulp",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistPulp.id,
      title: "Pulp",
      eventType: "concert",
      startTime: dt("2026-07-04T21:00:00Z"), // 23h00 CEST
      endTime: dt("2026-07-04T22:45:00Z"),   // 00h45 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["britpop", "indie-rock", "têtes_d_affiche"]),
    },
    // Dimanche 5 juillet
    {
      id: "evt-eurocks-jehnny-beth",
      festivalId: eurocks.id,
      venueId: eurocksPlage.id,
      artistId: artistJehnneyBeth.id,
      title: "Jehnny Beth",
      eventType: "concert",
      startTime: dt("2026-07-05T17:30:00Z"), // 19h30 CEST
      endTime: dt("2026-07-05T18:45:00Z"),   // 20h45 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "post-punk", "alternative"]),
    },
    {
      id: "evt-eurocks-aya-nakamura",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: vcArtistAyaNakamura.id,
      title: "Aya Nakamura",
      eventType: "concert",
      startTime: dt("2026-07-05T18:15:00Z"), // 20h15 CEST
      endTime: dt("2026-07-05T20:00:00Z"),   // 22h00 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "afropop", "têtes_d_affiche"]),
    },
    {
      id: "evt-eurocks-feu-chatterton",
      festivalId: eurocks.id,
      venueId: eurocksGreenroom.id,
      artistId: vcArtistFeuChatterton.id,
      title: "Feu! Chatterton",
      eventType: "concert",
      startTime: dt("2026-07-05T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-07-05T21:00:00Z"),   // 23h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "pop-rock"]),
    },
    {
      id: "evt-eurocks-ben-harper",
      festivalId: eurocks.id,
      venueId: eurocksGrandeScene.id,
      artistId: artistBenHarper.id,
      title: "Ben Harper & The Innocent Criminals",
      eventType: "concert",
      startTime: dt("2026-07-05T21:00:00Z"), // 23h00 CEST
      endTime: dt("2026-07-05T23:00:00Z"),   // 01h00 CEST
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["blues", "soul", "rock", "têtes_d_affiche"]),
    },
  ];

  for (const ev of eurocksEvents) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: {},
      create: ev,
    });
  }

  // News — Eurockéennes 2026
  const eurocksNews = [
    {
      id: "news-eurocks-2026-lineup",
      festivalId: eurocks.id,
      summary: "Programmation complète dévoilée — 51 artistes sur 4 jours et 4 scènes. The Offspring, Pulp, Aya Nakamura, Orelsan et Ben Harper en têtes d'affiche de la 36ème édition.",
      urgencyLevel: "normal" as const,
      isPinned: true,
      publishedAt: dt("2026-02-15T10:00:00Z"),
      category: "programmation",
      source: "site_officiel",
    },
    {
      id: "news-eurocks-2026-billets",
      festivalId: eurocks.id,
      summary: "Pass 4 jours disponibles à 209 € (+ frais). Billets à la journée de 67 € (jeudi) à 77 € (samedi/dimanche). Camping et hébergements partenaires à réserver séparément.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-01-20T09:00:00Z"),
      category: "billetterie",
      source: "site_officiel",
    },
    {
      id: "news-eurocks-2026-mobilite",
      festivalId: eurocks.id,
      summary: "Navettes spéciales depuis Belfort, Mulhouse et Strasbourg. Le site est accessible uniquement via transports organisés les soirs de concerts. Parking vélo gratuit au Malsaucy.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-05-10T08:00:00Z"),
      category: "logistique",
      source: "site_officiel",
    },
    {
      id: "news-eurocks-2026-headliners-vague2",
      festivalId: eurocks.id,
      summary: "2ème vague : Ben Harper, Alonzo, Jehnny Beth, Ecca Vandal et 25 nouveaux artistes complètent l'affiche. Seul 1 artiste reste à confirmer sur les 52 attendus.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-03-28T12:00:00Z"),
      category: "programmation",
      source: "instagram",
    },
  ];

  for (const news of eurocksNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${eurocks.name} (${eurocksEvents.length} events, ${eurocksNews.length} news)`);

  // ── 8. Musilac 2026 — Aix-les-Bains ─────────────────────────────────────
  const musilac = await prisma.festival.upsert({
    where: { slug: "musilac-2026" },
    update: {},
    create: {
      slug: "musilac-2026",
      name: "Musilac 2026",
      description:
        "Festival de musique sur l'Esplanade du Lac du Bourget, entre lac et montagnes. 4 jours de concerts pop, rock, électro et rap sur la Riviera des Alpes.",
      startDate: dt("2026-07-09T13:30:00Z"),
      endDate: dt("2026-07-12T23:59:00Z"),
      city: "Aix-les-Bains",
      country: "France",
      latitude: 45.6882,
      longitude: 5.8924,
      address: "Esplanade du Lac, Boulevard Robert Barrier, 73100 Aix-les-Bains",
      festivalType: "musique",
      programType: "structuré",
      capacity: 25000,
      siteUrl: "https://www.musilac.com",
      instagramHandle: "musilacfestival",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  // New artists — Musilac 2026
  const artistJamiroquai = await prisma.artist.upsert({
    where: { id: "artist-jamiroquai" },
    update: {},
    create: {
      id: "artist-jamiroquai",
      name: "Jamiroquai",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  const artistBigfloEtOli = await prisma.artist.upsert({
    where: { id: "artist-bigflo-et-oli" },
    update: {},
    create: {
      id: "artist-bigflo-et-oli",
      name: "Bigflo & Oli",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const artistCharlotteCardin = await prisma.artist.upsert({
    where: { id: "artist-charlotte-cardin" },
    update: {},
    create: {
      id: "artist-charlotte-cardin",
      name: "Charlotte Cardin",
      disciplines: jsonArr(["musique"]),
      countryCode: "CA",
    },
  });

  const artistCassius = await prisma.artist.upsert({
    where: { id: "artist-cassius" },
    update: {},
    create: {
      id: "artist-cassius",
      name: "Cassius",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const artistLastTrain = await prisma.artist.upsert({
    where: { id: "artist-last-train" },
    update: {},
    create: {
      id: "artist-last-train",
      name: "Last Train",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  const artistPomme = await prisma.artist.upsert({
    where: { id: "artist-pomme" },
    update: {},
    create: {
      id: "artist-pomme",
      name: "Pomme",
      disciplines: jsonArr(["musique"]),
      countryCode: "FR",
    },
  });

  // Venues — Musilac 2026
  const musilacSceneLac = await prisma.venue.upsert({
    where: { id: "venue-musilac-lac" },
    update: {},
    create: {
      id: "venue-musilac-lac",
      festivalId: musilac.id,
      name: "Scène Lac",
      type: "scène",
      capacity: 25000,
      latitude: 45.6882,
      longitude: 5.8924,
    },
  });

  const musilacSceneVillage = await prisma.venue.upsert({
    where: { id: "venue-musilac-village" },
    update: {},
    create: {
      id: "venue-musilac-village",
      festivalId: musilac.id,
      name: "Scène Village",
      type: "scène",
      capacity: 8000,
      latitude: 45.6876,
      longitude: 5.8916,
    },
  });

  const musilacSceneDecouverte = await prisma.venue.upsert({
    where: { id: "venue-musilac-decouverte" },
    update: {},
    create: {
      id: "venue-musilac-decouverte",
      festivalId: musilac.id,
      name: "Scène Découverte",
      type: "espace",
      capacity: 2000,
      latitude: 45.6871,
      longitude: 5.8930,
    },
  });

  // Events — Musilac 2026 (all CEST = UTC+2)
  const musilacEvents = [
    // Jeudi 9 juillet
    {
      id: "evt-musilac-feu-chatterton",
      festivalId: musilac.id,
      venueId: musilacSceneVillage.id,
      artistId: vcArtistFeuChatterton.id,
      title: "Feu! Chatterton",
      eventType: "concert",
      startTime: dt("2026-07-09T16:00:00Z"), // 18h00 CEST
      endTime: dt("2026-07-09T17:15:00Z"),   // 19h15 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "pop-rock"]),
    },
    {
      id: "evt-musilac-last-train",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: artistLastTrain.id,
      title: "Last Train",
      eventType: "concert",
      startTime: dt("2026-07-09T17:30:00Z"), // 19h30 CEST
      endTime: dt("2026-07-09T18:45:00Z"),   // 20h45 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "indie-rock"]),
    },
    {
      id: "evt-musilac-katy-perry",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: vcArtistKatyPerry.id,
      title: "Katy Perry",
      eventType: "concert",
      startTime: dt("2026-07-09T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-07-09T21:00:00Z"),   // 23h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "têtes_d_affiche"]),
    },
    // Vendredi 10 juillet
    {
      id: "evt-musilac-orelsan",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: vcArtistOrelsan.id,
      title: "Orelsan",
      eventType: "concert",
      startTime: dt("2026-07-10T19:45:00Z"), // 21h45 CEST
      endTime: dt("2026-07-10T21:30:00Z"),   // 23h30 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "têtes_d_affiche"]),
    },
    // Samedi 11 juillet
    {
      id: "evt-musilac-pomme",
      festivalId: musilac.id,
      venueId: musilacSceneVillage.id,
      artistId: artistPomme.id,
      title: "Pomme",
      eventType: "concert",
      startTime: dt("2026-07-11T16:30:00Z"), // 18h30 CEST
      endTime: dt("2026-07-11T17:30:00Z"),   // 19h30 CEST
      durationMins: 60,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["folk", "pop"]),
    },
    {
      id: "evt-musilac-jamiroquai",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: artistJamiroquai.id,
      title: "Jamiroquai",
      eventType: "concert",
      startTime: dt("2026-07-11T17:30:00Z"), // 19h30 CEST
      endTime: dt("2026-07-11T19:15:00Z"),   // 21h15 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["funk", "acid-jazz"]),
    },
    {
      id: "evt-musilac-gorillaz",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: artistGorillaz.id,
      title: "Gorillaz",
      eventType: "concert",
      startTime: dt("2026-07-11T20:00:00Z"), // 22h00 CEST
      endTime: dt("2026-07-11T22:00:00Z"),   // 00h00 CEST
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["alternative", "électronique", "têtes_d_affiche"]),
    },
    // Dimanche 12 juillet
    {
      id: "evt-musilac-charlotte-cardin",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: artistCharlotteCardin.id,
      title: "Charlotte Cardin",
      eventType: "concert",
      startTime: dt("2026-07-12T17:00:00Z"), // 19h00 CEST
      endTime: dt("2026-07-12T18:15:00Z"),   // 20h15 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "indie"]),
    },
    {
      id: "evt-musilac-bigflo-et-oli",
      festivalId: musilac.id,
      venueId: musilacSceneLac.id,
      artistId: artistBigfloEtOli.id,
      title: "Bigflo & Oli",
      eventType: "concert",
      startTime: dt("2026-07-12T19:45:00Z"), // 21h45 CEST
      endTime: dt("2026-07-12T21:30:00Z"),   // 23h30 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "têtes_d_affiche"]),
    },
    {
      id: "evt-musilac-cassius",
      festivalId: musilac.id,
      venueId: musilacSceneVillage.id,
      artistId: artistCassius.id,
      title: "Cassius",
      eventType: "concert",
      startTime: dt("2026-07-12T21:30:00Z"), // 23h30 CEST
      endTime: dt("2026-07-12T23:00:00Z"),   // 01h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["électronique", "house"]),
    },
  ];

  for (const ev of musilacEvents) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: {},
      create: ev,
    });
  }

  // News — Musilac 2026
  const musilacNews = [
    {
      id: "news-musilac-2026-lineup",
      festivalId: musilac.id,
      summary: "Programmation complète dévoilée — Katy Perry, Gorillaz, Jamiroquai, Orelsan et Bigflo & Oli en têtes d'affiche de Musilac 2026 à Aix-les-Bains.",
      urgencyLevel: "normal" as const,
      isPinned: true,
      publishedAt: dt("2026-02-10T10:00:00Z"),
      category: "programmation",
      source: "site_officiel",
    },
    {
      id: "news-musilac-2026-billets",
      festivalId: musilac.id,
      summary: "Pass 4 jours disponibles en prévente. Billets à la journée en vente sur musilac.com. Camping au bord du lac du Bourget inclus avec le pass.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-01-15T09:00:00Z"),
      category: "billetterie",
      source: "site_officiel",
    },
    {
      id: "news-musilac-2026-vague2",
      festivalId: musilac.id,
      summary: "2ème vague de programmation : 16 nouveaux artistes confirmés dont Charlotte Cardin, Pomme, Cassius et Last Train. Programmation complète disponible sur musilac.com.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-04-05T12:00:00Z"),
      category: "programmation",
      source: "instagram",
    },
  ];

  for (const news of musilacNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${musilac.name} (${musilacEvents.length} events, ${musilacNews.length} news)`);

  // ── 9. Rock en Seine 2026 — Saint-Cloud ──────────────────────────────────
  const rockEnSeine = await prisma.festival.upsert({
    where: { slug: "rock-en-seine-2026" },
    update: {},
    create: {
      slug: "rock-en-seine-2026",
      name: "Rock en Seine 2026",
      description:
        "5 jours de concerts au Domaine National de Saint-Cloud, aux portes de Paris. The Cure, Nick Cave, Tyler the Creator, Deftones et Lorde en têtes d'affiche de l'édition 2026.",
      startDate: dt("2026-08-26T14:00:00Z"),
      endDate: dt("2026-08-30T23:59:00Z"),
      city: "Saint-Cloud",
      country: "France",
      latitude: 48.8384,
      longitude: 2.2155,
      address: "Domaine National de Saint-Cloud, 92210 Saint-Cloud",
      festivalType: "musique",
      programType: "structuré",
      capacity: 40000,
      siteUrl: "https://www.rockenseine.com",
      instagramHandle: "rockenseine",
      ingestionStatus: "enrichi",
      confidenceLevel: "vérifié_humain",
      programStatus: "complet",
    },
  });

  // New artists — Rock en Seine 2026
  const artistTylerTheCreator = await prisma.artist.upsert({
    where: { id: "artist-tyler-the-creator" },
    update: {},
    create: {
      id: "artist-tyler-the-creator",
      name: "Tyler, the Creator",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
    },
  });

  const artistLorde = await prisma.artist.upsert({
    where: { id: "artist-lorde" },
    update: {},
    create: {
      id: "artist-lorde",
      name: "Lorde",
      disciplines: jsonArr(["musique"]),
      countryCode: "NZ",
    },
  });

  const artistTheCure = await prisma.artist.upsert({
    where: { id: "artist-the-cure" },
    update: {},
    create: {
      id: "artist-the-cure",
      name: "The Cure",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  const artistDeftones = await prisma.artist.upsert({
    where: { id: "artist-deftones" },
    update: {},
    create: {
      id: "artist-deftones",
      name: "Deftones",
      disciplines: jsonArr(["musique"]),
      countryCode: "US",
    },
  });

  const artistFranzFerdinand = await prisma.artist.upsert({
    where: { id: "artist-franz-ferdinand" },
    update: {},
    create: {
      id: "artist-franz-ferdinand",
      name: "Franz Ferdinand",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  const artistWetLeg = await prisma.artist.upsert({
    where: { id: "artist-wet-leg" },
    update: {},
    create: {
      id: "artist-wet-leg",
      name: "Wet Leg",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  const artistBiffyClyro = await prisma.artist.upsert({
    where: { id: "artist-biffy-clyro" },
    update: {},
    create: {
      id: "artist-biffy-clyro",
      name: "Biffy Clyro",
      disciplines: jsonArr(["musique"]),
      countryCode: "GB",
    },
  });

  // Venues — Rock en Seine 2026
  const resGrandeScene = await prisma.venue.upsert({
    where: { id: "venue-res-grande-scene" },
    update: {},
    create: {
      id: "venue-res-grande-scene",
      festivalId: rockEnSeine.id,
      name: "Grande Scène",
      type: "scène",
      capacity: 30000,
      latitude: 48.8384,
      longitude: 2.2155,
    },
  });

  const resCascade = await prisma.venue.upsert({
    where: { id: "venue-res-cascade" },
    update: {},
    create: {
      id: "venue-res-cascade",
      festivalId: rockEnSeine.id,
      name: "Scène de la Cascade",
      type: "scène",
      capacity: 10000,
      latitude: 48.8376,
      longitude: 2.2143,
    },
  });

  const resPelouse = await prisma.venue.upsert({
    where: { id: "venue-res-pelouse" },
    update: {},
    create: {
      id: "venue-res-pelouse",
      festivalId: rockEnSeine.id,
      name: "Scène de la Pelouse",
      type: "plein_air",
      capacity: 5000,
      latitude: 48.8392,
      longitude: 2.2168,
    },
  });

  // Events — Rock en Seine 2026 (CEST = UTC+2)
  const resEvents = [
    // Mercredi 26 août
    {
      id: "evt-res-tyler-the-creator",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: artistTylerTheCreator.id,
      title: "Tyler, the Creator",
      eventType: "concert",
      startTime: dt("2026-08-26T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-08-26T21:15:00Z"),   // 23h15 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rap", "hip-hop", "têtes_d_affiche"]),
    },
    // Jeudi 27 août
    {
      id: "evt-res-lorde",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: artistLorde.id,
      title: "Lorde",
      eventType: "concert",
      startTime: dt("2026-08-27T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-08-27T21:00:00Z"),   // 23h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["pop", "indépendant", "têtes_d_affiche"]),
    },
    // Vendredi 28 août
    {
      id: "evt-res-wet-leg",
      festivalId: rockEnSeine.id,
      venueId: resCascade.id,
      artistId: artistWetLeg.id,
      title: "Wet Leg",
      eventType: "concert",
      startTime: dt("2026-08-28T16:00:00Z"), // 18h00 CEST
      endTime: dt("2026-08-28T17:15:00Z"),   // 19h15 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["indie-rock", "post-punk"]),
    },
    {
      id: "evt-res-franz-ferdinand",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: artistFranzFerdinand.id,
      title: "Franz Ferdinand",
      eventType: "concert",
      startTime: dt("2026-08-28T17:30:00Z"), // 19h30 CEST
      endTime: dt("2026-08-28T19:00:00Z"),   // 21h00 CEST
      durationMins: 90,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["indie-rock", "post-punk"]),
    },
    {
      id: "evt-res-nick-cave",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: vcArtistNickCave.id,
      title: "Nick Cave & The Bad Seeds",
      eventType: "concert",
      startTime: dt("2026-08-28T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-08-28T21:30:00Z"),   // 23h30 CEST
      durationMins: 120,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "post-punk", "têtes_d_affiche"]),
    },
    // Samedi 29 août
    {
      id: "evt-res-biffy-clyro",
      festivalId: rockEnSeine.id,
      venueId: resCascade.id,
      artistId: artistBiffyClyro.id,
      title: "Biffy Clyro",
      eventType: "concert",
      startTime: dt("2026-08-29T16:30:00Z"), // 18h30 CEST
      endTime: dt("2026-08-29T17:45:00Z"),   // 19h45 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["rock", "alternatif"]),
    },
    {
      id: "evt-res-deftones",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: artistDeftones.id,
      title: "Deftones",
      eventType: "concert",
      startTime: dt("2026-08-29T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-08-29T21:15:00Z"),   // 23h15 CEST
      durationMins: 105,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["metal-alternatif", "rock", "têtes_d_affiche"]),
    },
    // Dimanche 30 août
    {
      id: "evt-res-interpol",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: vcArtistInterpol.id,
      title: "Interpol",
      eventType: "concert",
      startTime: dt("2026-08-30T16:30:00Z"), // 18h30 CEST
      endTime: dt("2026-08-30T17:45:00Z"),   // 19h45 CEST
      durationMins: 75,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["post-punk", "rock"]),
    },
    {
      id: "evt-res-the-cure",
      festivalId: rockEnSeine.id,
      venueId: resGrandeScene.id,
      artistId: artistTheCure.id,
      title: "The Cure",
      eventType: "concert",
      startTime: dt("2026-08-30T19:30:00Z"), // 21h30 CEST
      endTime: dt("2026-08-30T22:00:00Z"),   // 00h00 CEST
      durationMins: 150,
      access: "inclus",
      status: "confirmé",
      tags: jsonArr(["post-punk", "new-wave", "rock", "têtes_d_affiche"]),
    },
  ];

  for (const ev of resEvents) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: {},
      create: ev,
    });
  }

  // News — Rock en Seine 2026
  const resNews = [
    {
      id: "news-res-2026-lineup",
      festivalId: rockEnSeine.id,
      summary: "Rock en Seine 2026 dévoile sa programmation : The Cure, Nick Cave & The Bad Seeds, Tyler the Creator, Deftones et Lorde en têtes d'affiche sur 5 jours au Domaine de Saint-Cloud.",
      urgencyLevel: "normal" as const,
      isPinned: true,
      publishedAt: dt("2026-01-28T10:00:00Z"),
      category: "programmation",
      source: "site_officiel",
    },
    {
      id: "news-res-2026-pass",
      festivalId: rockEnSeine.id,
      summary: "Pass 5 jours disponibles. Billets à la journée de 59 € à 79 €. Accès direct depuis Paris en métro (ligne 10, station Boulogne-Pont de Saint-Cloud) ou Transilien (gare de Saint-Cloud).",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-01-29T09:00:00Z"),
      category: "logistique",
      source: "site_officiel",
    },
    {
      id: "news-res-2026-vague2",
      festivalId: rockEnSeine.id,
      summary: "Nouveaux artistes confirmés : Sparks, Kompromat, Mogwai, Wolf Alice, Peaches et Lykke Li rejoignent l'affiche. Programmation quasi complète avec plus de 40 artistes annoncés.",
      urgencyLevel: "normal" as const,
      isPinned: false,
      publishedAt: dt("2026-03-15T12:00:00Z"),
      category: "programmation",
      source: "instagram",
    },
  ];

  for (const news of resNews) {
    await prisma.newsItem.upsert({
      where: { id: news.id },
      update: {},
      create: news,
    });
  }

  console.log(`  ✓ Festival: ${rockEnSeine.name} (${resEvents.length} events, ${resNews.length} news)`);

  console.log("\n✅ Seed terminé avec succès !");
  console.log("   Utilisateur test : test@mycrewfest.dev / password123");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
