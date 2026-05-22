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
