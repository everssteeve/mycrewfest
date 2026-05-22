import { redirect } from "next/navigation";

type PageContext = { params: Promise<{ id: string }> };

export default async function FestEventIndexPage({ params }: PageContext) {
  const { id } = await params;
  redirect(`/festevent/${id}/programme`);
}
