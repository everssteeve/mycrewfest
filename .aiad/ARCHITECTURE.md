# ARCHITECTURE — MyCrewFest

> Contexte technique permanent. Injecté dans chaque session agent.
> Mainteneur : Tech Lead (IA) — mis à jour 2026-05-22

## 1. Principes Architecturaux

1. **Mobile-first PWA** : UI conçue pour 480px, dark mode only, accessible en plein soleil (WCAG 2.1 AA).
2. **Offline-first** : données critiques en cache local (Dexie/IndexedDB), sync delta au retour réseau.
3. **Server Components by default** : `"use client"` uniquement pour l'état interactif. Les données initiales sont fetchées côté serveur.
4. **Design system strict** : toutes les couleurs, espacements et typos viennent des tokens CSS `design/tokens.css`. Zéro couleur hardcodée.
5. **Sécurité par défaut** : validation Zod sur toutes les API routes, auth via Auth.js v5, pas de secret en clair.

## 2. Vue d'Ensemble

```
Browser (PWA)
  └── Next.js App Router (Vercel Edge/Serverless)
        ├── Server Components (page data)
        ├── Client Components (interactive UI + Zustand store)
        ├── API Routes (REST, auth-protected)
        ├── WebSocket gateway (Pusher for crew realtime)
        └── IndexedDB (Dexie.js — offline cache)
              │
              ├── Prisma v7 + PrismaLibSql adapter
              └── SQLite (dev) / Turso cloud (prod)
```

## 3. Stack Technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| **Framework** | Next.js 16 (App Router) | Vercel-native, SSR+SSG+API routes |
| **Language** | TypeScript 5 strict | Type safety end-to-end |
| **ORM** | Prisma v7 + PrismaLibSql | Driver adapter, serverless-ready |
| **Database dev** | SQLite via libSQL | Zéro serveur local requis |
| **Database prod** | Turso (libSQL cloud) | Compatible SQLite, serverless |
| **Auth** | Auth.js v5 (NextAuth) | Credentials + Google OAuth |
| **State** | Zustand 5 | Léger, offline-friendly |
| **Offline** | Dexie.js (IndexedDB) | Offline-first, sync delta |
| **Realtime** | Pusher | WebSocket managé pour crew |
| **Linting** | Biome | Lint + format unifié |
| **Tests unit** | Vitest + Testing Library | Rapide, compatible Next.js |
| **Tests E2E** | Playwright | Chromium, screenshots on failure |
| **CI/CD** | GitHub Actions + Vercel | Deploy auto sur push main |
| **Fonts** | Archivo Black / Space Grotesk / Space Mono | Design system "Electric Camp" |

## 4. Structure du Projet

```
src/
  app/
    (auth)/          — pages non-authentifiées (login, register)
    (app)/           — zone authentifiée
      layout.tsx     — session check + BottomNav
      catalogue/     — F00: liste festivals
      festival/
        [slug]/      — fiche festival + follow + JE PARTICIPE
        soumettre/   — soumission festival manquant
      festevent/
        [id]/        — FestEvent
          planning/  — F03: timeline + conflits
          crew/      — F04: crew management
          journal/   — F14: souvenirs timeline
          mode-deambuloire/ — F09: journal + carte
    api/
      auth/          — NextAuth routes
      festivals/     — CRUD festivals + follow + news
      festevents/    — CRUD + programme + selections
      crews/         — crew management + WebSocket signals
      signals/       — F10-A/B: signaux
      souvenirs/     — F12/F14: souvenirs
  components/
    ui/              — design system components
    festival/        — FestivalCard, FestivalHero, etc.
    festevent/       — PlanningTimeline, ConflictBadge, etc.
    crew/            — CrewMap, MemberList, SignalCard, etc.
  lib/
    prisma.ts        — singleton PrismaClient
    api.ts           — types + fetcher + constantes
    offline.ts       — Dexie DB instance + sync helpers
  store/
    use-festevent.ts — Zustand store pour FestEvent actif
    use-crew.ts      — Zustand store pour crew + WS
  auth.ts            — Auth.js config
```

## 5. Modèles de données clés

Voir `prisma/schema.prisma` pour le schéma complet (19 modèles).
Raccourcis importants :
- `Festival` ← géré par SYS-01, pas créable par users
- `FestEvent` ← instance de participation user → festival
- `Selection` ← statut (intéressé|must-see|vu) d'un Event par FestEvent
- `Signal` ← F10-A (crew) ou F10-B (communauté), scope différent
- `Crew` ← groupe lié à un FestEvent, coordonnées GPS temps réel

## 6. Décisions d'architecture importantes

- **Prisma v7** : `url` n'est plus dans le schéma, configuré via `prisma.config.ts` + `datasource.url: env("DATABASE_URL")`
- **Auth.js v5** : JWT strategy (pas de sessions DB), `auth()` dans Server Components
- **SQLite vs Postgres** : provider `sqlite` partout via libSQL adapter. Pour prod Postgres : changer provider en `postgresql` + adapter Neon.
- **WebSocket** : Pusher channels. Pour local dev : mock en polling 5s.
- **Offline** : Dexie stores `festivals`, `events`, `festevents`, `selections` — sync au retour réseau via PUT delta.
