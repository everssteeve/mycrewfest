export interface AdminSearchResult {
  type: "festival" | "user" | "submission";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export function scoreSearchResult(
  result: { label: string; sublabel: string },
  query: string,
): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const label = result.label.toLowerCase();
  const sub = result.sublabel.toLowerCase();

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (sub.includes(q)) return 40;
  return 0;
}

export function rankSearchResults(
  results: AdminSearchResult[],
  query: string,
): AdminSearchResult[] {
  return results
    .map((r) => ({ result: r, score: scoreSearchResult(r, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ result }) => result);
}

export function formatFestivalSearchResult(festival: {
  id: string;
  name: string;
  slug: string;
  ingestionStatus: string;
}): AdminSearchResult {
  return {
    type: "festival",
    id: festival.id,
    label: festival.name,
    sublabel: `${festival.slug} · ${festival.ingestionStatus}`,
    href: `/admin/festivals/${festival.slug}/edit`,
  };
}

export function formatUserSearchResult(user: {
  id: string;
  pseudo: string | null;
  name: string | null;
  email: string;
  role: string;
}): AdminSearchResult {
  return {
    type: "user",
    id: user.id,
    label: user.pseudo ?? user.name ?? user.email,
    sublabel: `${user.email} · ${user.role}`,
    href: `/admin/users`,
  };
}

export function formatSubmissionSearchResult(submission: {
  id: string;
  nameProposed: string;
  status: string;
  author: { email: string };
}): AdminSearchResult {
  return {
    type: "submission",
    id: submission.id,
    label: submission.nameProposed,
    sublabel: `${submission.author.email} · ${submission.status}`,
    href: `/admin/submissions?status=${submission.status}`,
  };
}
