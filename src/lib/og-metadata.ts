export function formatFestivalDateRange(
  startDate: string,
  endDate: string,
  locale = "fr-FR",
): string {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const optsWithYear: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

  if (sameMonth) {
    return `${s.toLocaleDateString(locale, { day: "numeric" })}–${e.toLocaleDateString(locale, optsWithYear)}`;
  }
  return `${s.toLocaleDateString(locale, opts)} – ${e.toLocaleDateString(locale, optsWithYear)}`;
}

export function buildFestivalOgDescription(params: {
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  description?: string | null;
}): string {
  const dateRange = formatFestivalDateRange(params.startDate, params.endDate);
  const location = `${params.city}, ${params.country}`;
  const base = `${location} · ${dateRange}`;
  if (params.description) {
    const excerpt = params.description.length > 120
      ? `${params.description.slice(0, 120).trimEnd()}…`
      : params.description;
    return `${base} — ${excerpt}`;
  }
  return base;
}

export function buildArtistOgDescription(params: {
  disciplines: string[];
  countryCode?: string | null;
  description?: string | null;
}): string {
  const parts: string[] = [];
  if (params.disciplines.length > 0) parts.push(params.disciplines.join(", "));
  if (params.countryCode) parts.push(params.countryCode);
  const base = parts.join(" · ");
  if (params.description) {
    const excerpt = params.description.length > 140
      ? `${params.description.slice(0, 140).trimEnd()}…`
      : params.description;
    return base ? `${base} — ${excerpt}` : excerpt;
  }
  return base || "Artiste sur MyCrewFest";
}

export function truncateOgTitle(title: string, suffix = "MyCrewFest", maxLen = 60): string {
  const full = `${title} — ${suffix}`;
  if (full.length <= maxLen) return full;
  const allowedTitle = maxLen - suffix.length - 4; // " — " + "…"
  return `${title.slice(0, allowedTitle).trimEnd()}… — ${suffix}`;
}
