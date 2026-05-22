# Analyse croisée des features — Web app existante × PRD mobile

**Date :** 2026-05-22  
**Contexte :** L'app web (Next.js, déjà développée) et l'app mobile (React Native, en cours de spécification) sont deux produits du même écosystème MyCrewFest. Ce document identifie les opportunités croisées : ce que chaque produit devrait emprunter à l'autre.

---

## Synthèse rapide

| Axe | Web → Mobile | Mobile → Web |
|---|---|---|
| **Planificateur** | Algorithme d'optimisation glouton, recommandations 4 axes, bouton Surprise, notes par rep, vue compacte | Mode déambulation, types d'events multiples |
| **J-day** | Badges temporels détaillés (3 niveaux), FABs, scroll auto | Signaux Waze communauté, plan de site interactif |
| **Crew** | Vue fusionnée colorisée par membre | GPS temps réel, point de ralliement, statuts rapides, WebSocket |
| **Catalogue** | Export ICS, URL publique read-only | Pipeline IA (fin de la saisie JSON manuelle), flux actualités social |
| **Après** | Tags profil (Marathonien·ne, etc.), stats détaillées | Journal photos, album collaboratif crew |

---

## Partie 1 — Ce que le PRD mobile doit emprunter à l'app web

Ces features sont matures, testées et absentes du PRD mobile actuel.

---

### P1 — Algorithme d'optimisation du planning `Haute priorité`

**Ce qu'a l'app web :** un planificateur glouton par jour qui dédoublonne, résout les conflits et génère un programme optimal selon des critères configurables : plage horaire `[hMin, hMax]`, villes prioritaires ordonnées, préférence soirées, marge de confort.

**Ce que le PRD mobile a :** F03 (planning avec détection de conflits) mais sans résolution automatique.

**Opportunité :** ajouter une feature **F-OPT — Optimisation du planning** au PRD mobile.

```
User stories à ajouter à F03 :
- Je peux lancer une optimisation qui résout automatiquement mes conflits
  selon mes critères (plage horaire, villes prioritaires, marge de confort).
- La preview interactive présente 4 sections :
  Programme final · À arbitrer manuellement · Non retenus · Annulés
- Je peux appliquer ou annuler le résultat.
- Un nudge "Optimisation possible · N conflits à résoudre" s'affiche
  dès qu'un conflit existe et que l'optimisation n'a pas encore tourné.
```

---

### P2 — Recommandations adaptatives (4 axes) `Haute priorité`

**Ce qu'a l'app web :** 4 axes de recommandation, visibles dès que la sélection est non vide :
- Genre : "Diversifier · Aucun {genre} (N disponibles)"
- Ville : "Étendre · Villes non explorées : X (N)"
- Créneau : "Équilibrer · X % en matinée"
- Durée : "Varier · Tous les spectacles courts (<45 min)"

Chaque recommandation est dismissible et l'état est persisté.

**Ce que le PRD mobile a :** rien sur les recommandations.

**Opportunité :** ajouter **F-RECO — Recommandations adaptatives** dans la phase Avant du PRD mobile. Particulièrement utile pour Marc (musiques du monde, veut explorer) et Bastien (famille, veut varier).

---

### P3 — Bouton Surprise `Priorité moyenne`

**Ce qu'a l'app web :** sélection aléatoire pondérée (inconnu + nouveau genre > inconnu > aléatoire), avec 3 variantes contextuelles : standard, "Surprise du jour" (filtre par today en J-day), "Commencer au hasard" (si sélection vide). Historique session pour ne pas reproposer le même spectacle.

**Opportunité :** ajouter au PRD mobile pour Théo et Inès (profils spontanés) et comme aide à la découverte pendant la déambulation (F09). Coût d'implémentation faible, valeur UX élevée.

---

### P4 — Export ICS `Priorité moyenne`

**Ce qu'a l'app web :** export `.ics` par festival (VTIMEZONE Europe/Paris) ET export global agrégeant tous les festivals actifs.

**Ce que le PRD mobile a :** export PDF du journal — mais pas de synchronisation calendrier.

**Opportunité :** ajouter l'export ICS au PRD mobile. Utile pour Bastien (gestion famille, agenda partagé) et pour Sophie (contraintes horaires strictes à intégrer dans son calendrier pro).

---

### P5 — URL publique lecture seule `Priorité moyenne`

**Ce qu'a l'app web :** `/p/{token}` lisible sans compte. Le token encode le festivalId + le hash de sélection. Web Share API mobile + fallback clipboard.

**Ce que le PRD mobile a :** export PDF du journal (F14) mais pas de partage live de son programme en cours.

**Opportunité :** ajouter une URL de partage live `/p/{token}` au PRD mobile. Cas d'usage : Inès partage son journal de déambulation avec ses collègues professionnels en temps réel, Yasmine partage son programme avec ses followers.

---

### P6 — Badges temporels J-day enrichis `Priorité moyenne`

**Ce qu'a l'app web (très mature) :**
- Header badge : J-N / "Demain !" / "Jour N/X" / "Festival terminé"
- "● Aujourd'hui" sur le jour courant
- "▶ En cours · {ville}" avec ring visuel sur la rep en cours
- "● Prochain · {heure} · dans X min" avec ring visuel
- "✓ Fini" sur les reps passées
- Scroll auto au mount vers la rep en cours (une fois par session)
- FAB "↓ Prochain" si la prochaine rep est hors viewport (IntersectionObserver)
- FAB "↑ Haut" si scrollY > 800
- Refresh setInterval 30 s, aria-live="polite"

**Ce que le PRD mobile a :** F07 mentionne "l'event en cours" et "le prochain event" mais pas ce niveau de détail.

**Opportunité :** enrichir F07 avec ces patterns J-day. L'app mobile est utilisée **in situ** donc l'expérience J-day est encore plus critique que sur web.

---

### P7 — Notes par représentation `Priorité moyenne`

**Ce qu'a l'app web :** champ texte libre par rep, persisté en DB dans `prefs.notes`.

**Ce que le PRD mobile a :** F12 (capture rapide de souvenir) permet d'ajouter une note, mais elle est liée au souvenir post-coup, pas à la rep planifiée.

**Opportunité :** ajouter la note persistante sur la rep dans le planning (avant et pendant), distincte du souvenir post-festival (F12). Marc (notes de veille culturelle) et Inès (notes professionnelles sur les compagnies) en ont particulièrement besoin.

---

### P8 — Détection de conflits à 3 niveaux avec temps de trajet `Priorité moyenne`

**Ce qu'a l'app web :** 3 niveaux de sévérité calculés à partir des durées ET des trajets entre villes :
- ⚠ Chevauchement : durées qui empiètent
- ~ Serré : battement < trajet + marge confort
- ◌ Limite : battement < 2 × marge confort

**Ce que le PRD mobile a :** F03 détecte les conflits horaires mais ne mentionne pas les 3 niveaux ni l'intégration des temps de trajet.

**Opportunité :** enrichir F03 avec ces 3 niveaux, en s'appuyant sur la donnée `trajets` du festival quand disponible. Alignement avec le modèle de données existant (`trajets: {"VilleA→VilleB": 45}`).

---

### P9 — Tags profil post-festival `Priorité basse`

**Ce qu'a l'app web :** la rétrospective génère des tags de personnalité basés sur les stats du festival : "Marathonien·ne" (densité élevée), "Curieux·se" (diversité genres), "Voyageur·se" (km parcourus), etc. Ces tags alimentent le profil global.

**Ce que le PRD mobile a :** F14 a des stats mais pas de tags de personnalité.

**Opportunité :** enrichir F14 avec les tags profil. Ils sont viraux (partagés sur les réseaux) et contribuent à la stratégie de croissance (Q8).

---

### P10 — Undo bulk select `Priorité basse`

**Ce qu'a l'app web :** toast de 8 s avec undo après un "Tout sélect. / désélect.", stack de 5 niveaux.

**Opportunité :** ajouter à F02 du PRD mobile. Particulièrement important sur mobile où les gros taps accidentels sont fréquents.

---

## Partie 2 — Ce que l'app web doit emprunter au PRD mobile

Ces features sont dans le PRD mobile et comblent des lacunes importantes de l'app web.

---

### W1 — Pipeline IA pour alimenter le catalogue `Impact majeur`

**Lacune de l'app web :** le programme d'un festival est uploadé manuellement sous forme de JSON. C'est le principal frein à l'onboarding — seulement les créateurs capables de formater du JSON peuvent ajouter un festival. L'app est déclarée hors-scope pour "❌ Scraping automatique des programmes."

**Ce qu'apporte le PRD mobile :** SYS-01 avec 3 agents :
- Agent 1 : détection de nouveaux festivals
- Agent 2 : ingestion du programme (hybride LLM + règles)
- Agent 3 : monitoring social pour les actualités et changements

**Opportunité :** implémenter SYS-01 côté web en priorité — c'est l'infrastructure partagée entre web et mobile. Cela transforme l'app web d'un outil pour power-users JSON en un produit grand public. **C'est la feature la plus impactante disponible.**

---

### W2 — Coordination crew GPS temps réel `Impact majeur`

**Lacune de l'app web :** le mode crew est une vue statique des sélections fusionnées. Pas de position en temps réel, pas de point de ralliement, pas de statuts rapides. Le "❌ Partage de la sélection en temps réel (WebSocket / SSE)" est en hors-scope.

**Ce qu'apporte le PRD mobile :** F08 — position GPS partagée (opt-in), point de ralliement permanent, statuts rapides ("Je suis en fosse", "RDV dans 10 min"), WebSocket.

**Opportunité :** promouvoir du backlog vers V2 web. À minima : point de ralliement (texte ou coordonnées) et statuts rapides sans GPS. La géoloc complète peut rester dans l'app mobile uniquement.

---

### W3 — Flux d'actualités sociales du festival `Impact majeur`

**Lacune de l'app web :** le bandeau "Vérifiez les changements officiels →" est une simple redirection vers une URL externe fournie manuellement dans le JSON. Il n'y a pas d'agrégation automatique des news officielles.

**Ce qu'apporte le PRD mobile :** F22 — flux alimenté par Agent 3, classifié (line-up / logistique / annulation / urgence), avec notification push prioritaire pour les annulations et changements de scène. Délai ≤ 15 min.

**Opportunité :** une fois Agent 3 opérationnel (W1), brancher F22 côté web aussi. Résout directement la frustration de Léa sur les changements de dernière minute. L'app web devient la source d'info la plus réactive du festival.

---

### W4 — Signaux Waze communauté `Impact moyen`

**Lacune de l'app web :** aucun mécanisme de remontée d'info terrain par les utilisateurs eux-mêmes (files d'attente, retards non officiels, problèmes techniques).

**Ce qu'apporte le PRD mobile :** F10-B — phrases prédéfinies (Artiste en retard, Foule très dense, Changement de scène non officiel…), visibles de tous les festivaliers de ce festival dans l'app, avec confirmation/infirmation communautaire.

**Opportunité :** port direct sur le web. Fonctionnerait via WebSocket (ou polling 30 s compatible avec l'archi existante). Pas de texte libre = modération triviale.

---

### W5 — Plan du site interactif `Impact moyen`

**Lacune de l'app web :** la mini-carte SVG montre la position des villes mais pas le plan détaillé du site festival (scènes, sanitaires, food, premiers secours, etc.).

**Ce qu'apporte le PRD mobile :** F11 — plan importé (image ou GeoJSON), points d'intérêt, positions crew, point de ralliement. Fonctionne offline.

**Opportunité :** ajouter au JSON festival un champ `planUrl` (image) et `pointsInteret` (tableau). La mini-carte SVG existante reste pour la vue ville ; le plan de site s'affiche sur un onglet dédié. Bastien (famille) en bénéficierait immédiatement.

---

### W6 — Journal photos post-festival `Impact moyen`

**Lacune de l'app web :** la rétrospective est purement statistique. Aucune trace narrative ou visuelle de l'expérience vécue.

**Ce qu'apporte le PRD mobile :** F14 (journal enrichissable, photos, export PDF) et F15 (album collaboratif crew avec timeline collective).

**Opportunité :** ajouter un onglet "Journal" post-festival dans le planificateur web. Minimum viable : notes libres par festival + photos. L'album crew collaboratif peut être une V2.

---

### W7 — Mode déambulation `Impact moyen — segment niche`

**Lacune de l'app web :** le planificateur assume que tous les festivals ont des spectacles avec horaires fixes. Pas de support pour les festivals de théâtre de rue où le programme est une liste de compagnies itinérantes sans horaires.

**Ce qu'apporte le PRD mobile :** F09 — interface journal + carte, log rapide par compagnie, signal de découverte crew.

**Opportunité :** ajouter un `type_programme: "déambulatoire"` au festival JSON. Quand ce flag est actif, le planificateur web bascule en vue "carnet de bord" au lieu de la vue planning. Faible coût d'implémentation si le flag conditionne simplement l'affichage.

---

### W8 — Notifications push J-day `Impact moyen`

**État actuel :** backlog N1 de l'app web ("Notifications push 30 min avant chaque rep sélectionnée").

**Ce qu'apporte le PRD mobile :** F07 et F21 — alertes configurables par event (5/10/15/30 min), distinction urgence vs non-urgente, mode "festival mode" groupant les notifs.

**Opportunité :** promouvoir N1 en Phase 4 de l'app web. L'infrastructure PWA existante supporte déjà le manifest ; il manque le Service Worker push et un serveur d'envoi (Neon cron + Web Push API).

---

### W9 — Filtres par type de discipline dans le catalogue `Impact faible`

**Lacune de l'app web :** les filtres catalogue sont texte / année / région. Pas de filtre par discipline (musique / théâtre / cirque / world / multidisciplinaire).

**Ce qu'apporte le PRD mobile :** F00 avec filtre par type de festival.

**Opportunité :** ajouter un champ `type` au modèle `festivals` en DB et un filtre pill dans la vue catalogue. Migration non-breaking (valeur nullable avec default "musique").

---

## Partie 3 — Matrice de priorisation

### Pour le PRD mobile (features à ajouter)

| Feature | Impact utilisateur | Effort | Priorité |
|---|---|---|---|
| P1 Algorithme optimisation | ★★★ | Moyen | **Ajouter au MVP** |
| P2 Recommandations 4 axes | ★★★ | Faible | **Ajouter au MVP** |
| P6 Badges J-day enrichis | ★★★ | Faible | **Enrichir F07** |
| P8 Conflits 3 niveaux + trajets | ★★ | Faible | **Enrichir F03** |
| P4 Export ICS | ★★ | Faible | V1.1 |
| P5 URL publique read-only | ★★ | Faible | V1.1 |
| P7 Notes par rep | ★★ | Faible | V1.1 |
| P3 Bouton Surprise | ★★ | Faible | V1.1 |
| P9 Tags profil | ★ | Faible | V2 |
| P10 Undo bulk | ★ | Faible | V2 |

### Pour l'app web (features à ajouter)

| Feature | Impact utilisateur | Effort | Priorité |
|---|---|---|---|
| W1 Pipeline IA (SYS-01) | ★★★★ | Élevé | **Pivot majeur — roadmap dédiée** |
| W3 Flux actualités sociales | ★★★ | Moyen (dépend W1) | **Après W1** |
| W2 Crew GPS / ralliement | ★★★ | Moyen | **V2 web** |
| W4 Signaux Waze | ★★ | Faible | **V2 web** |
| W8 Push notifications | ★★ | Moyen | Promouvoir N1 → Phase 4 |
| W5 Plan du site | ★★ | Faible | V2 |
| W6 Journal photos | ★★ | Moyen | V2 |
| W7 Mode déambulation | ★ | Faible | V2 |
| W9 Filtres type discipline | ★ | Très faible | V1 (quick win) |

---

## Partie 4 — Recommandations concrètes

### Action 1 — Aligner les deux PRDs sur un format de données festival commun

L'app web utilise un JSON `festival.data` avec champs `spectacles`, `trajets`, `villes`, `changementsUrl`. Le PRD mobile (via SYS-01) génère des objets `Event` normalisés avec des champs plus riches (`type`, `tranche_age`, `accès`, `source_confiance`).

**Recommandation :** étendre le format JSON de l'app web pour qu'il soit un sous-ensemble compatible du modèle de données du PRD mobile. Cela permettra à SYS-01 (quand il existera) d'alimenter les deux produits depuis la même base.

Champs à ajouter au JSON festival web :
```json
{
  "spectacles": [{
    ...,
    "type": "concert|spectacle|atelier|défilé|cypher|conférence|installation|autre",
    "annule": false,
    "source_confiance": "auto|vérifié_humain"
  }],
  "type_programme": "structuré|déambulatoire|hybride",
  "comptes_sociaux": { "instagram": "...", "facebook": "..." },
  "planUrl": "https://..."
}
```

### Action 2 — Mettre à jour le PRD mobile pour intégrer P1, P2, P6, P8

Ces 4 features sont à haute valeur et faible effort. Elles comblent les lacunes les plus évidentes du PRD mobile vs l'app web mature.

### Action 3 — Traiter SYS-01 comme infrastructure partagée

Le pipeline IA n'est pas une feature mobile — c'est une infrastructure commune aux deux produits. L'app web en bénéficie autant, voire plus, car c'est elle qui souffre actuellement de la saisie JSON manuelle. SYS-01 devrait être développé en premier et servir les deux surfaces.

### Action 4 — Partager le modèle économique

L'app web existante est aussi 100 % gratuite (hors-scope facturation en MVP). Les deux produits partagent la même stratégie : croissance en nombre d'utilisateurs, revente à un acteur stratégique. Les métriques de croissance définies dans le PRD mobile (MAU, % nouveaux users via invitation crew, festivals soumis) s'appliquent aux deux.
