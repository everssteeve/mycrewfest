/** Returns every Date between startIso and endIso inclusive (midnight local). */
export function getDatesInRange(startIso: string, endIso: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(startIso);
  const end = new Date(endIso);
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Format a Date as "yyyy-MM-dd" (sv-SE locale trick). */
export function toYMD(d: Date): string {
  return d.toLocaleDateString("sv-SE");
}
