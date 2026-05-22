export interface IcsEvent {
  uid: string;
  summary: string;
  location?: string;
  description?: string;
  startIso: string;
  endIso: string;
}

function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > max) {
    parts.push(remaining.slice(0, max));
    remaining = " " + remaining.slice(max);
  }
  parts.push(remaining);
  return parts.join("\r\n");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDateTime(iso: string): string {
  // Convert ISO 8601 to ICS format: 20260715T200000
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`
  );
}

function toUtcDateTime(iso: string): string {
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`
  );
}

export function generateIcs(events: IcsEvent[], calendarName: string): string {
  const now = toUtcDateTime(new Date().toISOString());

  const vevents = events.map((ev) => {
    const lines = [
      "BEGIN:VEVENT",
      foldLine(`UID:${ev.uid}@mycrewfest.app`),
      `DTSTAMP:${now}`,
      foldLine(`DTSTART;TZID=Europe/Paris:${toIcsDateTime(ev.startIso)}`),
      foldLine(`DTEND;TZID=Europe/Paris:${toIcsDateTime(ev.endIso)}`),
      foldLine(`SUMMARY:${escapeText(ev.summary)}`),
    ];
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeText(ev.location)}`));
    if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeText(ev.description)}`));
    lines.push("END:VEVENT");
    return lines.join("\r\n");
  });

  const tzBlock = [
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Paris",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
    "END:STANDARD",
    "END:VTIMEZONE",
  ].join("\r\n");

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyCrewFest//MyCrewFest//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "X-WR-TIMEZONE:Europe/Paris",
  ].join("\r\n");

  const footer = "END:VCALENDAR";

  const parts = [header, tzBlock, ...vevents, footer];
  return parts.join("\r\n") + "\r\n";
}
