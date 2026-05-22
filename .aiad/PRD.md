# Product Requirements Document — MyCrewFest

| Champ | Valeur |
|---|---|
| Version | 0.3 |
| Date | 2026-05-22 |
| Auteur | Steeve |
| Statut | En révision |
| Référence personas | `personas.md` |
| Changelog v0.2 | Q1–Q4 tranchées. Ajout catalogue festivals (F00), flux actualités (F22), pipeline IA (SYS-01). Réécriture F01–F02. |
| Changelog v0.3 | Q5–Q9 tranchées. F10 étendu (signaux Waze-style communauté). F00 étendu (soumission festival). SYS-01 hybride LLM. Modèle économique + métriques de croissance. Disclaimer IA. |

---

## 1. Vision

**MyCrewFest est l'application du festivalier**, pas de l'organisateur. Elle couvre les trois phases d'une expérience festival — avant, pendant et après — pour des festivaliers solo ou en groupe (crew), quel que soit le type de festival : concert, théâtre de rue, musiques du monde, arts du cirque, festival multidisciplinaire.

**Proposition de valeur centrale** : un seul outil qui remplace le Google Sheet de logistique, le groupe WhatsApp, les screenshots de programme, les notes vocales post-festival et les albums photos éparpillés — alimenté par un catalogue de festivals géré et enrichi en continu par des agents IA.

---

## 2. Problème

Aucun outil existant ne couvre la totalité du parcours festivalier. Les festivaliers jonglent aujourd'hui entre :

- L'app officielle du festival (jetable, différente chaque année, souvent inutilisable hors réseau)
- WhatsApp pour coordonner le crew
- Google Maps pour se retrouver
- Un Google Sheet pour la logistique
- Les stories Instagram pour savoir ce qui se passe en temps réel
- Des photos et notes éparses pour le souvenir

De plus, les apps de festival reposent toutes sur le modèle **scène fixe + horaire précis**, qui ne s'applique pas aux festivals de théâtre de rue ou aux festivals culturels investissant une ville entière.

### Frustrations par persona

| Persona | Frustration principale |
|---|---|
| **Léa** | 5 outils pour gérer un crew de 7 aux envies hétéroclites |
| **Inès** | Aucun outil pour les festivals sans programme fixe |
| **Marc** | Les apps ne distinguent pas "concert" de "atelier" ou "défilé" |
| **Yasmine** | Les events spontanés (cyphers, happenings) n'existent pas dans les apps |
| **Bastien** | Impossible de filtrer par tranche d'âge ou par type de réservation |

---

## 3. Utilisateurs cibles

Cinq personas définis dans `personas.md` :

| # | Persona | Univers festival | Mode |
|---|---|---|---|
| 1 | **Léa, 28 ans** | Multidisciplinaire | Crew 7 pers. |
| 2 | **Inès, 36 ans** | Théâtre de rue | Solo / binôme |
| 3 | **Marc, 52 ans** | Musiques du monde | Couple / solo |
| 4 | **Yasmine, 21 ans** | Hip-hop / arts urbains | Crew 4 pers. |
| 5 | **Bastien, 43 ans** | Cirque / spectacle vivant | Famille |

**Non-cibles explicites** : organisateurs, artistes, intervenants, presse, partenaires.

---

## 4. Décisions d'architecture (questions ouvertes résolues)

| # | Question | Décision | Conséquences |
|---|---|---|---|
| Q1 | Flux d'events spontanés : crew-only ou communautaire ? | **Crew-only** | Modération simplifiée. Les signaux de découverte ne sortent jamais du crew. Exception : signaux de situation prédéfinis (Q5). |
| Q2 | Sync crew temps réel : WebSocket ou P2P local ? | **Serveur central (WebSocket)** | Infrastructure backend requise, latence maîtrisée, pas de Bluetooth. |
| Q3 | Import programme : utilisateurs ou équipe ? | **Équipe MyCrewFest via agents IA** | Les utilisateurs ne créent pas de festivals. Catalogue géré via SYS-01. Les users peuvent soumettre un festival (Q6). |
| Q4 | Profil : local-only ou compte cloud ? | **Compte cloud** | Sync multi-devices, collaboration asynchrone, historique persistant côté serveur. |
| Q5 | Changements de programme non détectés par Agent 3 ? | **Signaux prédéfinis Waze-style (communauté)** | Phrases génériques sélectionnables (ex. "Artiste en retard", "Changement de scène"). Visibles de tous les festivaliers du même festival dans l'app. Distinct des signaux de découverte crew-only (F10). |
| Q6 | Que faire si un festival est absent du catalogue ? | **Soumission par les utilisateurs** | L'utilisateur soumet nom + URL officielle. SYS-01 prend le relais pour ingestion et validation. L'utilisateur est notifié de l'ajout. |
| Q7 | Agents IA : LLM ou règles déterministes ? | **Hybride** | Règles déterministes pour les extractions structurées (tableaux de programme, dates, lieux). LLM pour la classification sémantique (type d'event, catégorie de news, déduplication floue). Optimise coût et qualité. |
| Q8 | Modèle économique ? | **Gratuit — acquisition — revente** | App 100 % gratuite. Objectif : masse critique d'utilisateurs. Stratégie de sortie : revente à un acteur de la billetterie, du voyage ou de la découverte musicale une fois la taille critique atteinte. |
| Q9 | Responsabilité sur les données IA incorrectes ? | **Disclaimer systématique** | Tout contenu auto-extrait porte un badge "IA". Les données critiques (annulations, changements) affichent un avertissement explicite. CGU incluent une clause de non-responsabilité sur l'exactitude. |

---

## 5. Objectifs produit & métriques de succès

### Objectifs qualitatifs
- Réduire à **un seul outil** ce qui se fait aujourd'hui sur 4-6 apps
- Fonctionner de manière fiable **sans réseau** (priorité absolue)
- Adapter l'expérience au **type de festival** sans forcer le modèle "scène + horaire"
- Offrir un catalogue de festivals **vivant** : enrichi avant le festival, mis à jour en temps réel pendant
- Survivre d'une année à l'autre : l'historique et les templates restent
- Atteindre la **masse critique d'utilisateurs** nécessaire à une revente attractive

### Modèle économique

App **100 % gratuite**, sans publicité, sans freemium. L'objectif est l'acquisition rapide de la masse critique d'utilisateurs. La stratégie de sortie est la **revente** à un acteur stratégique (billetterie, streaming musical, voyage) dès que la taille et l'engagement le rendent attractifs.

Conséquences sur le produit :
- Aucune feature de monétisation à concevoir
- Priorité aux **boucles de croissance virale** : invitation de crew, partage de journal, soumission de festival
- Catalogue riche et de qualité = différenciateur clé pour la valorisation
- Métriques d'engagement > métriques de revenus

### Métriques (post-lancement)

**Engagement**
| Métrique | Cible à 6 mois |
|---|---|
| Rétention J30 | > 40 % |
| % users ayant utilisé l'app **pendant** un festival | > 70 % |
| % users avec au moins un crew actif | > 50 % |
| NPS | > 40 |
| % sessions offline réussies | > 95 % |

**Croissance**
| Métrique | Cible à 6 mois |
|---|---|
| Utilisateurs actifs mensuels (MAU) | > 10 000 |
| % nouveaux users via invitation crew | > 30 % |
| Festivals soumis par les users et validés | > 50 |
| Festivals dans le catalogue avec programme complet | > 200 |

**Pipeline IA**
| Métrique | Cible à 6 mois |
|---|---|
| Latence news festival → affichage dans l'app | < 15 min |
| Précision classification Agent 3 (faux positifs critiques) | < 5 % |
| % events avec niveau de confiance `vérifié_humain` | > 20 % |

---

## 6. Périmètre

### Dans le périmètre — app mobile (festivaliers)
- Catalogue de festivals curé, navigable et suivable
- Flux d'actualités du festival (news sociale + officielle)
- Gestion du cycle complet avant / pendant / après
- Mode solo et mode crew
- Festivals structurés (scènes + horaires) et déambulatoires (compagnies itinérantes)
- Types d'événements : concert, spectacle, théâtre, atelier, conférence, défilé, cypher, installation, autre
- Plan du site interactif
- Coordination crew en temps réel (WebSocket)
- Signalement d'événements spontanés (crew-only)
- Journal et mémoires post-festival
- Checklist logistique réutilisable
- Compte utilisateur cloud (multi-devices)

### Dans le périmètre — système back-office (équipe MyCrewFest)
- Pipeline IA de détection et d'ingestion de festivals (voir SYS-01)
- Interface d'administration pour révision et validation des données
- Monitoring des agents IA

### Hors périmètre (v1)
- Achat de billets / billetterie
- Streaming ou écoute musicale intégrée
- Réseaux sociaux publics (pas de feed global, pas de followers entre utilisateurs)
- Contenu généré par les organisateurs / artistes
- Monétisation (v1 gratuite)
- Chatbot ou recommandations IA côté festivalier

---

## 7. Architecture système

```
┌────────────────────────────────────────────────────────────────┐
│  APP MOBILE  (React Native / Flutter)                          │
│  Festivalier : catalogue, FestEvent, crew, journal             │
│  Offline-first : SQLite local + sync delta                     │
└─────────────────────────┬──────────────────────────────────────┘
                          │ HTTPS + WebSocket
┌─────────────────────────▼──────────────────────────────────────┐
│  API BACKEND                                                   │
│  Auth, comptes, crews, FestEvents, signaux crew, sync          │
│  WebSocket gateway pour la coordination crew temps réel        │
└────────┬──────────────────────────────────┬────────────────────┘
         │                                  │
┌────────▼──────────────┐    ┌──────────────▼──────────────────┐
│  BASE DE DONNÉES       │    │  PIPELINE IA  (SYS-01)          │
│  FESTIVALS             │    │  Agents de détection            │
│  Catalogue partagé     │◄───│  Agents d'ingestion programme   │
│  (référentiel global)  │    │  Agents de monitoring social    │
└────────────────────────┘    └──────────────────────────────────┘
                                          │
                              ┌───────────▼──────────────────────┐
                              │  BACK-OFFICE  (équipe MCF)        │
                              │  Révision, validation, correction │
                              │  Dashboard agents, quality score  │
                              └──────────────────────────────────┘
```

---

## 8. Features détaillées

**Priorités MoSCoW :**
- **M** — Must have (MVP)
- **S** — Should have (V1.1)
- **C** — Could have (V2)

---

### CATALOGUE & DÉCOUVERTE

---

#### F00 — Catalogue de festivals `M`

Point d'entrée de l'application. Les festivals ne sont pas créés par les utilisateurs : ils sont issus du pipeline IA (SYS-01) et validés par l'équipe MyCrewFest.

**User stories**
- Je peux rechercher un festival par : nom, ville, pays, dates, type (musique / théâtre / cirque / world / multidisciplinaire / autre).
- Je vois une fiche festival avec : nom, dates, lieu, description, type, statut du programme (complet · partiel · bientôt disponible), dernière mise à jour.
- Je peux **suivre** un festival pour recevoir des notifications quand son programme est mis à jour ou quand une actualité importante est publiée.
- Je peux **lancer un FestEvent** depuis la fiche d'un festival.
- Si un festival que je cherche n'existe pas dans le catalogue, je peux le **soumettre** : je renseigne le nom et l'URL officielle, et les agents IA prennent le relais pour ingestion et validation. Je reçois une notification quand le festival est ajouté.
- Les données extraites automatiquement par les agents sont marquées d'un **badge "IA"** discret. Les informations critiques (annulations, changements de programme) affichent un avertissement explicite invitant à vérifier la source officielle.

**Critères d'acceptation**
- Résultats de recherche en < 300ms
- La recherche fonctionne offline sur les festivals déjà consultés (cache local)
- Les festivals "suivis" sont synchronisés sur tous les devices du compte
- Une soumission crée une tâche dans la file SYS-01 et envoie un accusé de réception à l'utilisateur
- Le badge "IA" est présent sur tout event ou news dont `source_confiance = auto`
- L'utilisateur reçoit une notification push quand un festival soumis est ajouté au catalogue

---

#### F22 — Flux d'actualités du festival `S`

Centralise les informations officielles publiées autour d'un festival : annonces de programmation, changements d'horaire, news de l'équipe organisatrice.

**User stories**
- Dans la fiche d'un festival (et dans mon FestEvent), je vois un **fil d'actualités** alimenté automatiquement par les agents de monitoring social (SYS-01).
- Chaque actualité indique : source (Instagram / Facebook / site officiel / X), date de publication, résumé.
- Je peux filtrer les actualités : tous · line-up · logistique · urgences · programme.
- Pendant le festival, les actualités critiques (annulation, retard de scène, changement de lieu) génèrent une **notification push** prioritaire.
- Je peux épingler une actualité importante dans mon FestEvent pour la retrouver facilement.

**Critères d'acceptation**
- Délai entre publication officielle sur les réseaux et apparition dans l'app ≤ 15 min
- Les actualités sont consultables offline (dernière sync)
- Les notifications "critiques" passent en priorité haute même en mode "festival mode"
- Une actualité peut être marquée "non pertinente" par l'utilisateur (feedback aux agents)

---

### PHASE AVANT

---

#### F01 — Création d'un FestEvent `M`

Un **FestEvent** est l'instance de participation d'un utilisateur à un festival existant dans le catalogue. Les utilisateurs ne créent pas de festival : ils se greffent sur une fiche existante.

**User stories**
- Depuis la fiche d'un festival, je tape **"Je participe"** pour créer mon FestEvent.
- Je renseigne : quels jours je serai présent (si le festival dure plusieurs jours), mode solo ou crew.
- Le **type de programme** (structuré / déambulatoire / hybride) est hérité du festival — je peux l'ajuster si besoin.
- Je retrouve tous mes FestEvents passés et futurs depuis mon profil.
- Si le programme n'est pas encore disponible dans le catalogue : mon FestEvent est créé mais en **mode "programme à venir"** avec une alerte dès que les données arrivent.

**Critères d'acceptation**
- FestEvent créé en 2 taps depuis la fiche festival
- Le type de programme hérité peut être surchargé sans modifier la fiche du festival
- Un FestEvent sans programme disponible reste utilisable (checklist, crew, journal vierge)
- La suppression d'un FestEvent ne supprime pas les souvenirs associés

---

#### F02 — Navigation et sélection du programme `M`

Le programme est déjà disponible dans le catalogue, alimenté par les agents IA. L'utilisateur le parcourt et construit sa sélection.

**User stories**
- Je peux naviguer dans le programme avec des filtres cumulables : **type** (concert / spectacle / atelier / défilé / cypher / conférence / installation / famille), **jour**, **scène ou lieu**, **durée**, **tranche d'âge recommandée**, **accès** (inclus / réservation séparée).
- Je peux marquer un event : `intéressé` · `must-see` · `vu`.
- Un event marqué `must-see` s'ajoute automatiquement à mon planning.
- Si le programme est partiel (tous les events ne sont pas encore connus), les sections non renseignées sont clairement indiquées comme "à venir".
- Quand le programme est mis à jour par les agents, je reçois une notification et les nouveaux events sont mis en évidence.

**Critères d'acceptation**
- Affichage correct avec 0, 50 et 500+ events
- Les filtres sont persistants entre les sessions
- Programme consultable offline après premier chargement
- Les events mis à jour depuis ma dernière visite sont marqués visuellement ("Nouveau" · "Modifié" · "Annulé")

---

#### F03 — Planning personnalisé `M`

Vue agenda du festivalier avec son programme sélectionné, détection et résolution des conflits.

**User stories**
- Je vois mon planning sous forme de timeline jour par jour.
- L'app détecte les conflits selon **3 niveaux de sévérité**, calculés à partir des durées ET des temps de trajet entre lieux (données `trajets` du festival quand disponibles) :
  - ⚠ **Chevauchement** : les durées se chevauchent directement
  - ~ **Serré** : le battement entre deux events est inférieur au trajet + la marge de confort
  - ◌ **Limite** : le battement est inférieur à 2 × la marge de confort
- Je peux configurer une **marge de confort** (5 / 15 / 30 / 45 / 60 min) persistée entre les sessions.
- Je peux contraindre mon planning : heure d'arrivée et heure de départ obligatoire.
- Si un event de mon planning est annulé ou déplacé (via F22), je reçois une alerte immédiate avec les alternatives disponibles.
- Le planning est offline-first : disponible sans réseau dès qu'il est construit.

**F03-OPT — Optimisation automatique** `S`
- Je peux lancer une **optimisation** qui résout mes conflits selon des critères configurables : plage horaire `[hMin, hMax]`, lieux/villes prioritaires ordonnés, préférence pour les soirées, marge de confort.
- L'algorithme (glouton par jour, interval scheduling) génère une **preview interactive** en 4 sections : Programme final · À arbitrer manuellement · Non retenus (avec picker inline) · Annulés retirés.
- Je peux appliquer ou annuler le résultat.
- Un nudge "Optimisation possible · N conflits à résoudre" s'affiche dès qu'un conflit existe et que l'optimisation n'a pas tourné.

**Critères d'acceptation**
- Les 3 niveaux de conflit sont visuellement distincts (icône + couleur)
- Si les données `trajets` sont absentes, les niveaux "Serré" et "Limite" sont désactivés silencieusement
- Les contraintes horaires masquent les créneaux indisponibles
- L'optimisation fonctionne offline (algorithme local)
- Un event annulé dans mon planning est barré avec une suggestion d'alternative

---

#### F04 — Planning collaboratif crew `M`

Partage et superposition des plannings au sein d'un crew.

**User stories**
- Je peux créer un crew pour ce FestEvent et inviter des membres par lien ou code.
- Je vois les sélections de chaque membre du crew superposées sur la timeline.
- L'app identifie les **créneaux communs** : moments où plusieurs membres veulent voir la même chose, ou au contraire ont les mains libres pour se retrouver.
- Je peux suggérer un "moment crew" (repas, event commun) qui apparaît dans le planning de tous.
- La synchronisation des plannings crew est en temps réel via WebSocket quand le réseau est disponible.

**Critères d'acceptation**
- Vue "superposition crew" lisible jusqu'à 8 membres
- Notification quand un membre rejoint le crew ou modifie sa sélection
- Un membre peut masquer ses sélections pour les autres (mode privé)
- Les modifications hors-ligne sont synchronisées au retour du réseau sans conflit destructif

---

#### F05 — Checklist logistique `S`

Checklist personnalisable et réutilisable pour préparer la logistique d'un festival.

**User stories**
- Je peux créer une checklist depuis zéro ou depuis un **template** (camping multi-jours, day trip, festival famille, festival urbain, etc.).
- Je peux assigner des items à des membres du crew ("Léa apporte la glacière").
- Je peux sauvegarder ma checklist comme nouveau template pour mes festivals futurs.
- Les items peuvent avoir un coût associé (suivi de budget global).

**Critères d'acceptation**
- Templates livrés : camping, day trip, festival urbain, festival famille
- Partage avec le crew, statut de complétion visible par personne
- Un template peut être dupliqué sans écraser l'original

---

#### F06 — Logistique voyage `C`

**User stories**
- Je peux signaler que je propose ou cherche une place en covoiturage.
- Je peux renseigner mon heure d'arrivée et de départ, visible par le crew.
- Je peux définir un point de RDV d'arrivée partagé avec le crew.

---

### PHASE PENDANT

---

#### F07 — Vue programme temps réel `M`

**User stories**
- Je vois en permanence : **l'event en cours** et **le prochain event** avec compte à rebours.
- L'event en cours porte un badge **"▶ En cours · {lieu}"** avec un ring visuel.
- La prochaine rep porte un badge **"● Prochain · {heure} · dans X min"** avec ring visuel.
- Les reps passées du jour courant sont marquées **"✓ Fini"**.
- Le header affiche un badge contextuel : **J-N** / **"Demain !"** / **"Jour N/X"** / **"Festival terminé"**.
- Quand j'ouvre le planning pendant le festival, l'écran scrolle automatiquement vers la rep en cours (priorité) ou la prochaine rep — une fois par session.
- Un **FAB "↓ Prochain"** s'affiche quand la prochaine rep est hors de l'écran (IntersectionObserver). Un **FAB "↑ Haut"** s'affiche après un long scroll.
- L'état temps réel se rafraîchit toutes les 30 s en arrière-plan.
- Je reçois des alertes avant chaque must-see (délai configurable : 5 / 10 / 15 / 30 min).
- Si un event est annulé ou retardé (via F22), une alerte push **prioritaire** remplace l'alerte standard.
- La vue fonctionne **entièrement offline** (programme en cache).

**Critères d'acceptation**
- Aucun contenu bloqué par absence de réseau
- Alerte configurable par event
- Maximum 2 alertes non-urgentes simultanément (les alertes critiques passent toujours)
- Le scroll auto ne se déclenche qu'une fois par session (pas à chaque retour sur l'écran)
- Les FABs se masquent à l'approche du bas de page

---

#### F08 — Coordination crew temps réel `M`

**User stories**
- Je peux partager ma **position GPS** avec mon crew (opt-in, désactivable à tout moment).
- Je vois la position des membres de mon crew sur le plan du site.
- Un **point de ralliement permanent** est épinglé par le crew : visible en un tap depuis n'importe quel écran.
- Je peux envoyer un **statut rapide** : `"Je suis en fosse"` · `"Je cherche à manger"` · `"RDV au point de ralliement"` · `"Je rentre dormir"`.
- La synchronisation passe par WebSocket (serveur central).

**Critères d'acceptation**
- Désactivation de la géoloc sans quitter le crew
- Mode économique (maj toutes les 2 min) en arrière-plan
- Le point de ralliement s'affiche offline (coordonnées en cache)
- Reconnexion WebSocket automatique en cas de coupure réseau

---

#### F09 — Mode déambulation `M`

Pour les festivals sans programme fixe (théâtre de rue, festivals itinérants).

**User stories**
- En mode déambulatoire, l'interface principale est un **journal + carte** plutôt qu'une timeline.
- Je peux **logger rapidement** ce que je suis en train de voir : compagnie depuis la liste (pré-chargée par SYS-01), ou texte libre, avec heure automatique et position optionnelle.
- Je peux envoyer un **signal de découverte crew** : "Il se passe quelque chose d'incroyable ici" + ma position.
- Je peux accéder aux **fiches compagnies** offline.

**Critères d'acceptation**
- Log en 2 taps maximum
- Signal de découverte reçu par le crew même si l'app est en arrière-plan
- Fiches compagnies pré-chargées à l'ouverture du FestEvent

---

#### F10 — Signaux temps réel `S`

Deux types de signaux coexistent avec des portées différentes.

##### F10-A — Signal de découverte (crew-only)

"Il se passe quelque chose de cool ici." Pour alerter son crew d'un event spontané off-programme.

**User stories**
- Je peux signaler un event spontané à mon crew : description courte, position, durée estimée, type (cypher / happening / performance de rue / autre).
- Le signal apparaît sur la carte du crew et génère une notification push à tous les membres.
- Un signal expire automatiquement après sa durée estimée + 30 min.

**Critères d'acceptation**
- Signal créé en < 10 secondes
- Notification crew reçue en < 5 secondes (WebSocket)
- Un seul signal actif par membre à la fois

---

##### F10-B — Signal de situation (communauté du festival, Waze-style) `S`

"Heads-up pour tous." Pour signaler une condition ou un incident à l'ensemble des festivaliers présents au même festival dans l'app. Fonctionne sur le modèle des signalements GPS communautaires.

**User stories**
- Je peux signaler une situation via une **phrase prédéfinie** sélectionnable :
  - `Artiste en retard (estimé X min)`
  - `Changement de scène — [artiste] joue maintenant à [lieu]`
  - `Annulation non officielle — [artiste]`
  - `Foule très dense à [lieu]`
  - `File d'attente longue (entrée / bar / sanitaires)`
  - `Problème technique en cours à [scène]`
  - `Scène ouverte / jam session improvisée à [lieu]`
- Je peux associer le signal à un lieu du plan ou à un event du programme.
- Le signal est visible de **tous les utilisateurs MyCrewFest présents au même festival** (périmètre : FestEvents actifs sur ce festival à cette date).
- Un signal est confirmé ou infirmé par les autres festivaliers (👍 / ❌). Après 5 infirmations, il est masqué automatiquement.
- Un signal expire automatiquement après 45 min (sauf confirmation active qui prolonge de 20 min).
- Les signaux de type `Annulation` ou `Changement de scène` sont remontés comme alerte prioritaire aux festivaliers ayant cet event dans leur planning.

**Critères d'acceptation**
- Sélection de la phrase et envoi en < 8 secondes
- Aucun champ texte libre pour limiter les abus (uniquement phrases prédéfinies + lieu/event en option)
- Maximum 3 signaux actifs par utilisateur simultanément
- Les signaux infirmés disparaissent sans notification
- Un utilisateur ayant émis > 10 signaux infirmés sur 7 jours est mis en observation (back-office)

---

#### F11 — Plan du site interactif `S`

**User stories**
- Le plan du site est pré-chargé depuis le catalogue (fourni par SYS-01 si disponible), ou importable manuellement en secours.
- Je peux ajouter des **points d'intérêt** : scènes, sanitaires, eau, food, premiers secours, camping, zone repos.
- Je vois ma position et celles de mon crew sur le plan.
- Je peux épingler le point de ralliement directement sur le plan.

**Critères d'acceptation**
- Plan fonctionnel offline
- Zoom fluide sur un plan de 5000×5000px
- Points d'intérêt du crew synchronisés via WebSocket

---

#### F12 — Capture rapide de souvenirs `M`

**User stories**
- Un bouton "j'ai vu ça" accessible en 1 tap depuis l'écran principal ouvre un formulaire minimal : event (recherche dans le programme ou texte libre), note courte optionnelle, photo optionnelle.
- Si le log correspond à un event du planning, il est automatiquement lié.
- Les logs créés offline sont synchronisés au retour du réseau.

**Critères d'acceptation**
- Formulaire complété en < 15 secondes (cas standard)
- Un log peut être rétroactif (heure modifiable)
- Photos compressées côté client avant upload

---

#### F13 — Gestion des réservations in-festival `S`

**User stories**
- Je peux marquer un event comme "nécessite réservation" avec une heure limite.
- Je reçois un rappel 1h avant la fermeture des réservations.
- Je peux enregistrer une confirmation de réservation (numéro, QR code).
- Le statut est visible par le crew.

---

### PHASE APRÈS

---

#### F14 — Journal & historique personnel `M`

**User stories**
- À la fin du festival, je vois une timeline complète (événements loggés + events marqués "vu").
- Je peux enrichir chaque entrée : notes plus longues, photos, liens vers artistes ou compagnies.
- Je peux exporter mon journal en PDF ou le partager via un lien.
- Mon journal est conservé indéfiniment dans mon profil cloud.

**Critères d'acceptation**
- Timeline construite automatiquement sans action supplémentaire
- Export PDF généré côté client (offline) avec mise en forme propre
- Les entries peuvent être réorganisées manuellement

---

#### F15 — Souvenir collaboratif du crew `S`

**User stories**
- Les photos loggées par les membres du crew sont rassemblées dans un **album partagé** (partage opt-in par photo).
- Je vois une timeline collective distinguant moments partagés et expériences individuelles.
- Un "bilan du crew" est généré automatiquement : events en commun, events solo, stats diverses.

**Critères d'acceptation**
- Partage de photo = action explicite (pas automatique)
- Bilan consultable jusqu'à 6 mois après le festival
- Album synchronisé multi-devices via compte cloud

---

#### F16 — Carte des découvertes `C`

**User stories**
- Je vois une carte du monde avec les pays d'origine des artistes et compagnies vus.
- Je peux filtrer par festival, année, discipline.
- Je peux voir l'évolution de mes genres explorés d'une année à l'autre.

---

#### F17 — Checklist rétrospective `C`

**User stories**
- À la fin d'un festival, je peux remplir une rétro courte : ce qui a bien marché, à améliorer, à ne pas oublier.
- Ces notes sont accessibles lors de la création d'un prochain FestEvent du même type.

---

#### F23 — Recommandations adaptatives `S`

Visibles dans l'écran de navigation du programme (F02), dès que la sélection est non vide. Chaque recommandation est dismissible et l'état est persisté.

**4 axes de recommandation**

| Axe | Exemple de message | Condition de déclenchement |
|---|---|---|
| **Genre** | "Diversifier · Aucun {genre} parmi tes sélections (N dispos)" | Un genre représenté dans le programme mais absent de la sélection |
| **Lieu / Ville** | "Explorer · {N} lieux non visités dans ta sélection" | Des scènes/villes du festival sans aucune sélection |
| **Créneau** | "Équilibrer · {X}% de tes reps en soirée (aucune en journée)" | Déséquilibre fort entre les plages horaires |
| **Durée** | "Varier · Toutes tes sélections font moins de 45 min" | Distribution trop homogène des durées |

**User stories**
- Je vois les recommandations actives sous forme de chips dismissibles.
- Un tap sur une recommandation ouvre le programme pré-filtré pour faciliter la découverte.
- Une recommandation dismissée disparaît jusqu'à ce que ma sélection double de taille.

**Critères d'acceptation**
- Maximum 2 recommandations affichées simultanément (les plus pertinentes)
- L'état "dismissed" est persisté par type dans le profil cloud
- Aucune recommandation n'est affichée si la sélection est vide

---

#### F24 — Partage et export `S`

**URL publique lecture seule**
- Je peux générer un **lien public** de mon programme pour ce festival : `/p/{token}` lisible sans compte.
- Le token encode l'identifiant du FestEvent et l'état de ma sélection.
- Je partage via le système de partage natif (mobile) ou clipboard (fallback).
- Un visiteur sans compte voit mon programme en lecture seule avec le design MyCrewFest.

**Export ICS**
- Je peux exporter mon planning en fichier `.ics` compatible avec tous les calendriers (Google Calendar, Apple Calendar, Outlook).
- Chaque représentation sélectionnée devient un événement avec : titre, lieu, heure de début/fin, description.

**Critères d'acceptation**
- Le lien public fonctionne sans authentification
- L'ICS inclut VTIMEZONE correct (Europe/Paris par défaut, timezone du festival si disponible)
- L'export ICS fonctionne offline (généré côté client)
- Un toast distingue "Programme partagé" (Web Share API) de "Lien copié" (clipboard)

---

#### F25 — Bouton Surprise `C`

Sélection aléatoire pondérée pour aider à découvrir le programme ou démarrer une sélection vide.

**3 variantes contextuelles**

| Variante | Déclencheur | Comportement |
|---|---|---|
| **Standard** | Depuis le catalogue, sélection non vide | Pick pondéré : inconnu + nouveau genre > inconnu > aléatoire |
| **Surprise du jour** | Pendant le festival (J-day) | Filtre d'abord sur les events d'aujourd'hui, puis pondération standard |
| **Commencer au hasard** | Sélection vide | Propose un premier event pour amorcer la découverte |

**User stories**
- Un tap sur "Surprise" scroll vers la carte proposée, avec un flash visuel de 1,8 s.
- Les events déjà proposés dans la session sont exclus (historique remis à zéro si le pool est épuisé).
- Je peux accepter (l'event est marqué must-see) ou passer (prochain pick aléatoire).

---

### TRANSVERSALES

---

#### F18 — Modèle de festival flexible `M`

Le cœur technique : deux paradigmes coexistent.

| Attribut | Structuré | Déambulatoire | Hybride |
|---|---|---|---|
| Programme | Scènes + horaires | Liste de compagnies | Les deux |
| Interface principale | Timeline | Carte + journal | Mixte |
| Alertes | Oui (horaires fixes) | Non / signal manuel | Selon type d'event |
| Log | Event du programme | Texte libre + compagnie | Les deux |

**Critères d'acceptation**
- Type hérité du catalogue, surchargeable sans modifier la fiche globale
- Migration des données si le type est modifié en cours de FestEvent

---

#### F19 — Mode offline `M`

**Ce qui fonctionne offline**
- Navigation du programme complet et filtres
- Planning personnel et crew (lecture seule)
- Plan du site
- Fiches artistes / compagnies
- Capture de souvenirs (logs, photos)
- Vue "prochain event" et alertes locales
- Point de ralliement (coordonnées en cache)
- Journal et historique

**Ce qui nécessite du réseau**
- Sync positions crew (WebSocket)
- Signaux d'events spontanés (crew-only, WebSocket)
- Actualités festival (F22)
- Invitation de nouveaux membres dans le crew
- Upload photos et sync inter-devices

**Critères d'acceptation**
- Bannière discrète (non bloquante) en mode offline
- Logs offline synchronisés à la reconnexion sans perte ni doublon
- Aucune feature offline ne plante silencieusement

---

#### F20 — Compte utilisateur cloud `M`

*(Anciennement "Profil festivalier local" — promu Must have suite à la décision Q4)*

**User stories**
- Je crée un compte avec email + mot de passe (ou OAuth Google/Apple).
- Mes données (FestEvents, souvenirs, plannings, checklists) sont synchronisées sur tous mes devices.
- Je peux supprimer mon compte et toutes mes données (RGPD).
- Les festivals suivis et les crews rejoints sont persistants cross-device.

**Critères d'acceptation**
- Inscription en < 2 minutes
- Sync multi-devices transparente et silencieuse
- Mode invité disponible pour découvrir l'app sans créer de compte (données locales uniquement)

---

#### F21 — Notifications intelligentes `S`

**Règles**
- Maximum 3 notifications non-urgentes actives simultanément
- Les alertes critiques (annulation, changement de programme via F22, signal crew via F10) passent toujours
- Un mode **"festival mode"** (activé manuellement) groupe les notifications non-urgentes en résumés toutes les 30 min
- Zéro notification marketing

---

### SYSTÈME BACK-OFFICE

---

#### SYS-01 — Pipeline IA de gestion du catalogue `M`

Ce système est opéré par l'équipe MyCrewFest. Il n'est pas visible des festivaliers mais conditionne la qualité de toute l'expérience.

##### Agent 1 — Détection de festivals

**Objectif** : découvrir les festivals existants et à venir, avant même que les festivaliers les cherchent.

**Sources surveillées**
- Bases de données d'événements (Songkick, Bandsintown, Eventbrite, Facebook Events)
- Sites de presse spécialisée (Tsugi, Les Inrocks, Rock&Folk, Resident Advisor)
- Résultats de recherche ciblés ("festival [discipline] [pays] [année]")
- Listes consolidées de festivals (Wikipedia, sites de référence par genre)

**Comportement**
- Crawl périodique (quotidien minimum, hebdomadaire hors saison)
- Création d'une fiche festival avec niveau de confiance : `détecté` → `vérifié` → `enrichi`
- Déduplication automatique (même festival avec variantes de nom ou d'URL)
- Alerte back-office pour validation humaine avant publication dans le catalogue

**Données extraites** : nom, dates, lieu (ville, pays, coordonnées GPS), site officiel, comptes sociaux détectés, type estimé, capacité estimée.

---

##### Agent 2 — Ingestion du programme

**Objectif** : extraire et structurer le programme officiel depuis le site du festival.

**Sources**
- Site officiel du festival (page programme, PDF, iCal)
- APIs publiques si disponibles (Bandsintown, Festicket)
- Soumissions utilisateurs (Q6) : l'URL fournie par un utilisateur déclenche ce même agent

**Approche hybride (Q7)**
| Tâche | Méthode | Raison |
|---|---|---|
| Parsing HTML de tableaux/grilles de programme | Règles déterministes | Structure prévisible, coût négligeable |
| Extraction PDF non structuré | LLM | Layouts variables, extraction sémantique nécessaire |
| Classification du type d'event (concert vs atelier vs défilé...) | LLM | Contexte sémantique requis |
| Déduplication artiste (variantes de noms) | LLM | Comparaison floue sur entités nommées |
| Enrichissement artiste (instruments, pays, bio) | API tierces (MusicBrainz, Wikidata) + LLM en fallback | Données structurées prioritaires |
| Détection de changement (diff entre deux crawls) | Règles déterministes | Comparaison structurelle |

**Comportement**
- Structuration en objets `Event` normalisés (titre, type estimé, artiste/compagnie, lieu/scène, horaire, durée)
- Mise à jour incrémentale : seuls les events modifiés sont re-publiés
- Niveau de confiance par event : `auto` · `vérifié-humain`
- Tout event `auto` reçoit le badge "IA" dans l'app (Q9)

**Déclencheurs de re-crawl**
- Changement détecté sur la page programme du festival
- Alerte de l'agent de monitoring social (annonce de nouveau line-up)
- Soumission utilisateur (Q6)
- Demande manuelle depuis le back-office

---

##### Agent 3 — Monitoring social

**Objectif** : surveiller les comptes officiels des festivals pour détecter les actualités importantes et les changements de programme.

**Plateformes surveillées** : Instagram, Facebook, X (Twitter), Threads, site officiel (flux RSS si disponible).

**Approche hybride (Q7)**
| Tâche | Méthode |
|---|---|
| Classification du post (line-up / annulation / urgence / autre) | LLM (contexte sémantique variable) |
| Extraction d'entités (artiste, scène, horaire) dans le texte | LLM |
| Détection de changement vs programme en base | Règles déterministes |
| Filtrage anti-spam / posts promotionnels | Règles déterministes (score de pertinence) + LLM en fallback |

**Comportement**
- Abonnement aux comptes officiels identifiés lors de la détection
- Classification automatique des posts : `line-up` · `logistique` · `programme-change` · `annulation` · `urgence` · `autre`
- Extraction du résumé et des entités mentionnées (artiste, scène, horaire)
- Pour les posts classés `programme-change` ou `annulation` : déclenchement immédiat de l'agent 2 pour re-crawl + notification push aux festivaliers concernés (F22)
- Pour les posts `line-up` et `logistique` : publication dans le flux F22 dans les 15 min
- Tout contenu publié via cet agent porte le badge "IA" avec lien vers le post source (Q9)

**Critères de qualité**
- Faux positifs (posts non pertinents classés comme critiques) < 5 %
- Taux de détection des annulations réelles > 90 %

---

##### Interface back-office

- Dashboard des agents : état, dernière exécution, taux d'erreur
- File de validation : festivals détectés en attente de confirmation
- Éditeur de fiche festival : correction manuelle des données extraites
- Historique des mises à jour par festival
- Gestion des signalements utilisateurs (festivals manquants)
- Tableau de bord qualité : % festivals avec programme complet, % events avec artiste enrichi

---

## 9. Modèle de données (haut niveau)

```
User
  ├── id, email, auth_provider
  ├── profil : {pseudo, préférences_disciplines[], photo}
  ├── festivals_suivis : Festival[]
  └── FestEvent[]
        ├── festival_id : ref Festival
        ├── mode : solo | crew
        ├── type_programme_override : structuré|déambulatoire|hybride|null
        ├── dates_présence : DateRange[]
        ├── contraintes : {arrivée, départ}
        ├── crew_id : ref Crew?
        ├── planning : Selection[]    (event_id, statut: intéressé|must-see|vu)
        ├── checklist : ChecklistItem[]
        └── souvenirs : Souvenir[]

Festival                              ← géré par SYS-01, non créable par les users
  ├── nom, dates, lieu : GeoAddress
  ├── type : musique|théâtre_rue|cirque|world|multidisciplinaire|autre
  ├── type_programme : structuré|déambulatoire|hybride
  ├── site_url, comptes_sociaux : {instagram, facebook, x}
  ├── statut_ingestion : détecté|vérifié|enrichi
  ├── niveau_confiance_programme : auto|vérifié_humain
  ├── events : Event[]
  ├── lieux : Lieu[]
  ├── plan : Plan?
  └── news : NewsItem[]

Event
  ├── titre
  ├── type : concert|spectacle|atelier|défilé|cypher|conférence|installation|autre
  ├── artiste_ou_compagnie : ref Artiste|Compagnie
  ├── lieu_id : ref Lieu?
  ├── horaire_debut : DateTime?       ← null si festival déambulatoire
  ├── horaire_fin : DateTime?
  ├── durée_estimée_min : int?
  ├── tranche_age : {min, max}?
  ├── accès : inclus|réservation_séparée
  ├── statut : confirmé|annulé|modifié
  ├── source_confiance : auto|vérifié_humain
  └── tags : string[]

Artiste / Compagnie
  ├── nom, description, disciplines[]
  ├── pays_origine
  ├── liens : {site, instagram, spotify, musicbrainz_id}
  └── instruments[]?

Lieu
  ├── nom, type : scène|espace|rue|salle|plein_air
  ├── coordonnées : GeoPoint?
  └── capacité?

NewsItem                              ← généré par Agent 3
  ├── festival_id
  ├── source : instagram|facebook|x|site_officiel
  ├── source_url
  ├── publié_le : DateTime
  ├── catégorie : line-up|logistique|programme-change|annulation|urgence|autre
  ├── résumé : string
  ├── entités_mentionnées : string[]
  └── niveau_urgence : normal|critique

Crew
  ├── membres : CrewMember[]    (user_id, rôle: admin|membre, statut_géoloc)
  ├── point_ralliement : {coordonnées: GeoPoint?, description: string?}
  └── signaux_actifs : Signal[]

Signal  (deux types, voir F10)
  ├── auteur_id : ref User
  ├── portée : crew | communauté
  ├── crew_id : ref Crew?          ← renseigné si portée=crew
  ├── festival_id : ref Festival?  ← renseigné si portée=communauté
  ├── position : GeoPoint
  │
  │   -- F10-A (découverte, crew-only) --
  ├── description : string?
  ├── type_découverte : cypher|happening|performance_rue|autre
  │
  │   -- F10-B (situation, Waze-style) --
  ├── phrase_prédéfinie : enum SituationPhrase?
  ├── event_ref : ref Event?
  ├── lieu_ref : ref Lieu?
  ├── confirmations : int           ← 👍
  ├── infirmations : int            ← ❌
  │
  ├── créé_le : DateTime
  └── expire_le : DateTime

FestivalSubmission                  ← soumission par un utilisateur (Q6)
  ├── auteur_id : ref User
  ├── nom_proposé : string
  ├── url_officielle : string
  ├── statut : en_attente|en_traitement|ajouté|rejeté
  ├── festival_créé_id : ref Festival?
  └── soumis_le : DateTime

Souvenir
  ├── event_ref : ref Event?    ← null si log libre
  ├── texte_libre : string?
  ├── note : string?
  ├── photos : Media[]
  ├── horodatage : DateTime
  └── partage_crew : bool
```

---

## 10. Exigences non fonctionnelles

### Performance
- Affichage du programme (500 events) < 500ms
- Démarrage app (cold start) < 2s
- Transitions entre écrans < 200ms
- Photos compressées côté client avant upload

### Réseau & Offline
- **Offline-first** : SQLite local + sync delta au retour du réseau
- WebSocket auto-reconnect avec backoff exponentiel
- Détection offline avec feedback non bloquant

### Batterie
- Géoloc crew : haute fréquence au premier plan, toutes les 2 min en arrière-plan
- Mode "économie d'énergie" : désactive géoloc, réduit fréquence de sync

### Confidentialité & RGPD
- Position GPS : opt-in explicite, désactivable depuis un widget rapide
- Aucune donnée de position conservée côté serveur au-delà de 24h
- Export complet et suppression définitive disponibles depuis les réglages

### Accessibilité
- WCAG 2.1 niveau AA
- Mode sombre système
- Taille de texte dynamique
- Contrastes lisibles en plein soleil

### Plateformes
- iOS 16+ et Android 10+
- Stack recommandée : React Native (Expo) + backend Node.js/TypeScript ou Python

### Pipeline IA
- Disponibilité agents : 99 % hors maintenance planifiée
- Re-crawl programme en < 30 min après détection d'un changement social
- Données personnelles : les agents ne collectent que des données publiques des festivals (pas de données utilisateurs)

---

## 11. Expériences clés (user flows)

### Flow 1 — Léa prépare son crew pour We Love Green

1. Recherche "We Love Green" dans le catalogue → fiche disponible, programme complet
2. "Je participe" → FestEvent créé, type hybride hérité, dates 6-8 juin
3. Crée un crew, partage le lien à 6 coéquipiers
4. Chacun marque ses must-see (certains concerts, certains spectacles de théâtre)
5. Vue "superposition crew" : dimanche 17h, tout le monde est libre → Léa suggère un "moment crew" au food market
6. Génère une checklist depuis le template "camping" et assigne les items
7. J-3 : elle reçoit une notif "2 nouveaux artistes annoncés" via F22 → elle met à jour son planning

### Flow 2 — Inès déambule à Aurillac

1. Cherche "Aurillac" dans le catalogue → fiche avec liste de 40 compagnies, type déambulatoire, pas d'horaires
2. "Je participe" → interface principale en mode journal + carte
3. Pendant le festival : clique "j'ai vu ça", sélectionne la compagnie dans la liste, écrit deux mots
4. Tombe sur un spectacle de rue non référencé → ajoute une entrée libre avec position
5. Voit quelque chose d'extraordinaire → envoie un signal à son binôme (F10)
6. Après : journal de 12 compagnies vues, exporté en PDF pour sa veille pro

### Flow 3 — Bastien filtre le programme pour sa famille

1. Trouve "Circa Auch" dans le catalogue → programme structuré enrichi par SYS-01
2. Active les filtres : tranche d'âge ≤ 12 ans, durée ≤ 60 min, accès inclus → 8 spectacles
3. Marque 5 "must-see" famille, désactive le filtre âge pour le soir → 2 spectacles adultes
4. Le matin du premier jour : reçoit une notif "Le spectacle 'X' est décalé de 30 min" via F22
5. Alertes 15 min avant chaque spectacle → gère le timing avec les enfants
6. Après : souvenir par spectacle avec photo + phrase pour les enfants

### Flow 4 — Yasmine capte un cypher spontané

1. Est au Dour Festival avec son crew de 4
2. Entend un cypher improviser derrière une scène → crée un signal crew (F10) : "Cypher derrière la Red Bull Stage, ça déchire" + position
3. Son crew reçoit la notif, deux membres rejoignent en 5 min
4. Elle log le moment via "j'ai vu ça" avec une vidéo courte
5. Le soir : son journal liste les 3 cyphers sauvages captés dans la journée

---

## 12. Roadmap

### MVP — V1.0

Objectif : catalogue + FestEvent + crew + mode déambulation opérationnels.

| Feature | Type |
|---|---|
| F00 Catalogue de festivals (lecture) | Mobile |
| F01 Création FestEvent depuis le catalogue | Mobile |
| F02 Navigation et sélection du programme | Mobile |
| F03 Planning personnalisé + conflits | Mobile |
| F04 Planning collaboratif crew | Mobile |
| F07 Vue programme temps réel + alertes | Mobile |
| F08 Coordination crew (WebSocket, géoloc, statuts) | Mobile |
| F09 Mode déambulation | Mobile |
| F12 Capture rapide de souvenirs | Mobile |
| F14 Journal & historique personnel | Mobile |
| F18 Modèle festival flexible | Mobile |
| F19 Mode offline | Mobile |
| F20 Compte utilisateur cloud | Mobile + Backend |
| SYS-01 Agent 1 (détection) + Agent 2 (ingestion) | Back-office |
| SYS-01 Interface back-office minimale | Back-office |

### V1.1

| Feature | Type |
|---|---|
| F05 Checklist logistique | Mobile |
| F10 Signaux d'events spontanés crew-only | Mobile |
| F11 Plan du site interactif | Mobile |
| F13 Gestion des réservations | Mobile |
| F15 Souvenir collaboratif du crew | Mobile |
| F21 Notifications intelligentes | Mobile |
| F22 Flux d'actualités festival | Mobile |
| SYS-01 Agent 3 (monitoring social) | Back-office |

### V2.0

| Feature | Type |
|---|---|
| F06 Logistique voyage | Mobile |
| F16 Carte des découvertes | Mobile |
| F17 Checklist rétrospective | Mobile |
| Intégrations : Setlist.fm, MusicBrainz, Spotify | Back-office |

---

## 13. Questions ouvertes

Toutes les questions Q1–Q9 ont été tranchées (voir Section 4). Le PRD est prêt pour la phase de design et d'architecture technique.

### Points de vigilance identifiés

| Sujet | Risque | Mitigation |
|---|---|---|
| Coût du pipeline LLM (Agent 2 & 3) | Variable et potentiellement élevé à l'échelle | Budgéter dès le MVP, monitorer le coût par festival ingéré, réserver le LLM aux cas non solubles par règles |
| Robustesse du scraping | Les sites de festivals changent leur structure fréquemment | Tests automatisés de régression sur les parsers ; alerte back-office sur taux d'échec |
| Couverture catalogue au lancement | Si trop peu de festivals disponibles, l'app est inutilisable | Pré-remplir le catalogue manuellement avec les 50 festivals les plus connus avant ouverture publique ; mettre en avant la soumission utilisateur dès le J1 |
| Viralité du catalogue | La croissance dépend en partie du catalogue : plus il est riche, plus les users invitent leur crew | Tracker le taux de conversion "festival trouvé dans catalogue → FestEvent créé" comme métrique proxy de la qualité du catalogue |
| Légitimité des signaux Waze (F10-B) | Fausses informations sur des annulations ou changements | Phrases prédéfinies uniquement (pas de texte libre), système de confirmation/infirmation, expiration rapide |
