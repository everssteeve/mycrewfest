export interface FestivalIcsInput {
  name: string;
  slug: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  city: string;
  country: string;
  description?: string;
  siteUrl?: string;
}

function fmtDate(iso: string): string {
  // All-day event: YYYYMMDD (no time component)
  return iso.replace(/[-:]/g, "").slice(0, 8);
}

function fmtDateTime(iso: string): string {
  // UTC datetime: YYYYMMDDTHHmmssZ
  return iso.replace(/[-:.]/g, "").replace("000Z", "00Z").slice(0, 15) + "Z";
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545: fold at 75 chars
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(0, 75));
  i = 75;
  while (i < line.length) {
    parts.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join("\r\n");
}

export function buildFestivalIcs(festival: FestivalIcsInput, baseUrl = ""): string {
  // Use all-day dates (DTSTART;VALUE=DATE) — endDate is exclusive in iCal
  const startDay = fmtDate(festival.startDate);
  // End date for all-day: day after the last day
  const endDt = new Date(festival.endDate);
  endDt.setUTCDate(endDt.getUTCDate() + 1);
  const endDay = fmtDate(endDt.toISOString());

  const uid = `${festival.slug}@mycrewfest.com`;
  const now = fmtDateTime(new Date().toISOString());
  const url = baseUrl ? `${baseUrl}/festival/${festival.slug}` : `/festival/${festival.slug}`;
  // LOCATION is a geographic value — comma between city and country is part of the format
  const location = `${festival.city}, ${festival.country}`;
  const description = festival.description
    ? escapeIcs(festival.description)
    : `Festival · ${festival.city}, ${festival.country}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyCrewFest//MyCrewFest//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDay}`,
    `DTEND;VALUE=DATE:${endDay}`,
    foldLine(`SUMMARY:${escapeIcs(festival.name)}`),
    foldLine(`DESCRIPTION:${description}`),
    foldLine(`LOCATION:${location}`),
    foldLine(`URL:${url}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

export function festivalIcsFilename(slug: string): string {
  return `${slug}.ics`;
}
