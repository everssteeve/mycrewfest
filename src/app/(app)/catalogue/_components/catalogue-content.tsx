import type { FestivalSummary } from "@/lib/types";
import { FestivalList } from "./festival-list";

interface FestivalsApiResponse {
  data: FestivalSummary[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

async function fetchFestivals(): Promise<FestivalSummary[]> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/festivals?pageSize=100`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Impossible de charger les festivals.");
  }

  const json = (await res.json()) as FestivalsApiResponse | FestivalSummary[];

  // Support both paginated { data, meta } and flat array shapes
  if (Array.isArray(json)) return json;
  return json.data ?? [];
}

export async function CatalogueContent() {
  const festivals = await fetchFestivals();
  return <FestivalList initialFestivals={festivals} />;
}
