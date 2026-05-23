export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

export function buildCsvContent(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerRow = buildCsvRow(headers);
  const dataRows = rows.map(buildCsvRow);
  return [headerRow, ...dataRows].join("\n");
}

export interface FestivalExportRow {
  id: string;
  name: string;
  slug: string;
  festivalType: string;
  startDate: Date | string;
  endDate: Date | string;
  city: string;
  country: string;
  ingestionStatus: string;
  confidenceLevel: string;
}

export function festivalsToCsv(festivals: FestivalExportRow[]): string {
  const headers = ["ID", "Nom", "Slug", "Type", "Date début", "Date fin", "Ville", "Pays", "Statut", "Confidence"];
  const rows = festivals.map((f) => [
    f.id,
    f.name,
    f.slug,
    f.festivalType,
    new Date(f.startDate).toLocaleDateString("fr-FR"),
    new Date(f.endDate).toLocaleDateString("fr-FR"),
    f.city,
    f.country,
    f.ingestionStatus,
    f.confidenceLevel,
  ]);
  return buildCsvContent(headers, rows);
}

export interface UserExportRow {
  id: string;
  email: string;
  pseudo: string | null;
  name: string | null;
  role: string;
  createdAt: Date | string;
}

export function usersToCsv(users: UserExportRow[]): string {
  const headers = ["ID", "Email", "Pseudo", "Nom", "Rôle", "Inscrit le"];
  const rows = users.map((u) => [
    u.id,
    u.email,
    u.pseudo,
    u.name,
    u.role,
    new Date(u.createdAt).toLocaleDateString("fr-FR"),
  ]);
  return buildCsvContent(headers, rows);
}
