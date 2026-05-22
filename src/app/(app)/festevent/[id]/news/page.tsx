import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewsView, type NewsItemData } from "./_components/news-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchNewsData(
  festEventId: string,
  userId: string,
): Promise<{
  news: NewsItemData[];
  urgentCount: number;
} | null> {
  const fe = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: { festivalId: true },
  });

  if (!fe) return null;

  const newsItems = await prisma.newsItem.findMany({
    where: { festivalId: fe.festivalId },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 50,
  });

  const urgentCount = newsItems.filter((item) => item.urgencyLevel === "critique").length;

  return {
    news: newsItems.map((item) => ({
      id: item.id,
      source: item.source,
      sourceUrl: item.sourceUrl ?? null,
      publishedAt: item.publishedAt.toISOString(),
      category: item.category,
      summary: item.summary,
      urgencyLevel: item.urgencyLevel as "normal" | "critique",
      isPinned: item.isPinned,
    })),
    urgentCount,
  };
}

export default async function NewsPage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchNewsData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <NewsView
      festEventId={id}
      initialNews={data.news}
      initialUrgentCount={data.urgentCount}
    />
  );
}
