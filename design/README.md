# MyCrewFest — Design System

**Thème :** "Electric Camp" — UI sombre haute-contraste conçue pour une utilisation outdoor et en festival.  
**Source :** UI Kit extrait du fichier `MyCrewFest App.html` (2026-05-22).

---

## Polices

| Rôle | Famille | Poids | Usage |
|---|---|---|---|
| **Display** | Archivo Black | 900 | Titres, noms d'artistes, headings. Uppercase systématique. |
| **Body** | Space Grotesk | 400 / 500 / 700 | Tout le corps de texte, labels, UI copy. |
| **Mono** | Space Mono | 400 / 700 | Horaires, comptes à rebours, codes, temps restant. |

Import Google Fonts : voir `tokens.css` ligne 1.

---

## Palette de couleurs

### Backgrounds (du plus profond au plus clair)

| Token | Valeur | Usage |
|---|---|---|
| `--bg-darker` | `#0D0E12` | Fond principal de l'app, calque le plus profond |
| `--bg-surface` | `#161820` | Cards, rows, listes |
| `--bg-surface-elevated` | `#222531` | Modals, toasts, sheets élevées |
| `--bg-overlay` | `rgba(13,14,18,0.72)` | Scrim derrière les bottom sheets |

### Accents — chaque couleur a un rôle sémantique précis

| Token | Valeur | Rôle |
|---|---|---|
| `--primary-neon` | `#00FF66` | CTA primaires, succès, messages envoyés |
| `--secondary-cyan` | `#00E5FF` | Crew, position, amis |
| `--accent-pink` | `#FF007A` | Concerts, favoris, alertes programme |
| `--warning-orange` | `#FF9900` | Clashes, batterie faible, avertissements |
| `--danger-red` | `#FF3355` | Annulations, erreurs, SOS |

### Tints (14 % d'opacité)

Utiliser comme fond de chips, tags et badges.

| Token | Usage |
|---|---|
| `--neon-soft` | Chips "vu" / "must-see" |
| `--cyan-soft` | Chips crew / position |
| `--pink-soft` | Chips artiste / favoris |
| `--orange-soft` | Chips clash / alerte |

### Texte

| Token | Valeur | Usage |
|---|---|---|
| `--text-main` | `#FFFFFF` | Texte principal |
| `--text-muted` | `#8F95B2` | Labels secondaires, meta |
| `--text-dim` | `#5A607A` | Placeholders, timestamps |
| `--text-on-neon` | `#0D0E12` | Texte sur fond `--primary-neon` |

---

## Typographie — classes utilitaires

```css
/* Headings — Archivo Black, uppercase */
.t-h1         /* 32px */
.t-h2         /* 24px */
.t-h3         /* 20px */
.t-display    /* générique, taille libre via fontSize */
.fest-heading /* même style que .t-display */

/* Body — Space Grotesk */
.t-body       /* 16px regular */
.t-body-md    /* 18px medium */

/* Meta / labels */
.t-meta       /* 12px bold uppercase, --text-muted */
.t-caption    /* 14px medium, --text-muted */

/* Mono — horaires, codes */
.t-mono       /* 16px regular */
.t-countdown  /* 24px bold, letter-spacing tight */
```

---

## Spacing

Grille de 4 px.

| Token | Valeur |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 64px |

---

## Border radii

| Token | Valeur | Usage |
|---|---|---|
| `--radius-sm` | 6px | Petits éléments inline (badges CLASH) |
| `--radius-md` | 12px | Cards, inputs, boutons |
| `--radius-lg` | 20px | Grandes cards, panels |
| `--radius-xl` | 28px | Bottom sheets |
| `--radius-full` | 9999px | Pills, avatars, chips |

---

## Glows & shadows

Les glows néon sont la signature visuelle de l'app. Les utiliser uniquement sur les éléments interactifs actifs ou les CTA.

```css
--glow-neon   /* vert — bouton primaire actif */
--glow-cyan   /* cyan — éléments crew actifs */
--glow-pink   /* rose — artistes favoris, alertes */
--glow-orange /* orange — warnings actifs */

--shadow-sm   /* subtle separation */
--shadow-md   /* cards, dropdowns */
--shadow-lg   /* modals, bottom sheets */
```

---

## Motion

```css
--transition-fast  /* 0.18s ease-in-out — press states, hover */
--transition-base  /* 0.28s cubic-bezier(.2,.7,.2,1) — standard transitions */
--transition-slow  /* 0.45s cubic-bezier(.2,.7,.2,1) — page transitions */
```

---

## Composants

### Button

4 variantes :

| Variant | Fond | Texte | Glow | Usage |
|---|---|---|---|---|
| `primary` | `--primary-neon` | `--text-on-neon` | `--glow-neon` | Action principale |
| `pink` | `--accent-pink` | blanc | `--glow-pink` | Favoris, alertes |
| `cyan` | transparent | `--secondary-cyan` | aucun | Actions crew, secondaires |
| `ghost` | transparent | `--text-main` | aucun | Actions tertiaires |

Comportement : scale 0.98 au press, transition `--transition-fast`.

### Card

- Fond `--bg-surface`, border `--border-color`, radius `--radius-md`
- Prop `clash={true}` : border orange + badge "CLASH" en position absolue
- Prop `accent={color}` : remplace la border par la couleur d'accent

### Chip

Pill (radius-full) avec 3 états :
- Inactif : fond transparent, border accent
- Soft : fond `--*-soft` (14 % tint), border accent
- Actif : fond plein accent, texte `--text-on-neon`

### Avatar

Cercle plein avec initiale, en Archivo Black. Support d'un `border` pour l'empilement (`AvatarStack`).

### Icon

SVG inline Lucide, strokeWidth configurable. Icônes disponibles : `calendar`, `map`, `users`, `home`, `heart`, `heartFill`, `pin`, `navigation`, `battery`, `alert`, `flame`, `chevronRight`, `arrowLeft`, `search`, `plus`, `share`, `qrcode`, `bell`, `settings`, `ticket`, `logo`.

---

## Navigation & structure

### Bottom Navigation (4 onglets)

| Tab | Label | Couleur active | Écran |
|---|---|---|---|
| `lineup` | Line-up | `--accent-pink` | Programme / artistes |
| `map` | La Carte | `--primary-neon` | Crew Compass + carte |
| `crew` | Mon Crew | `--secondary-cyan` | Chat + votes crew |
| `hq` | Le QG | blanc | Profil + settings + ticket |

Bottom nav : fond `rgba(22,24,32,0.85)` + backdrop-blur(14px), hauteur 72px, padding-bottom 18px (safe area).

### Top Header

Sticky, fond `rgba(13,14,18,0.92)` + backdrop-blur(10px), hauteur 56px. Composition : meta label (uppercase, muted) + Display title + slot right optionnel.

### Screen wrapper

- Padding top : 54px (status bar)
- Padding bottom : 82px (bottom nav)
- Fond : `--bg-darker`
- Scroll vertical

---

## Layout

```css
--nav-height:   72px   /* bottom tab bar */
--header-height: 56px  /* top header */
--max-content:  480px  /* max-width pour mobile */
```

---

## Règles d'usage

1. **Ne jamais utiliser de fond blanc** — l'app est 100 % dark mode, optimisée OLED.
2. **Les glows sont réservés aux états actifs** — un glow permanent sur un élément passif nuit à la lisibilité en plein soleil.
3. **Archivo Black = uppercase obligatoire** — la police n'a pas été conçue pour la casse mixte.
4. **Space Mono pour tout ce qui est temporel** — horaires, comptes à rebours, durées. Jamais de chiffres de timing en Space Grotesk.
5. **Chaque couleur d'accent a un domaine** — ne pas mélanger le cyan sur des éléments de programme (rose) ou le rose sur des éléments crew (cyan). La cohérence sémantique aide l'utilisateur en conditions dégradées (nuit, écran mouillé).
6. **Contrastes outdoor** — le minimum acceptable en plein soleil est un ratio de contraste de 4.5:1. Toujours vérifier `--text-muted` sur `--bg-surface` avant utilisation.
