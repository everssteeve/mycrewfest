import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type SignalData, SignauxView } from "./_components/signaux-view";

type PageContext = { params: Promise<{ id: string }> };

async function fetchSignauxData(
  festEventId: string,
  userId: string,
): Promise<{ festivalId: string; signals: SignalData[] } | null> {
  const fe = await prisma.festEvent.findFirst({
    where: { id: festEventId, userId },
    select: { festivalId: true },
  });

  if (!fe) return null;

  const now = new Date();
  const signals = await prisma.signal.findMany({
    where: {
      festivalId: fe.festivalId,
      scope: "communauté",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, pseudo: true } },
    },
  });

  return {
    festivalId: fe.festivalId,
    signals: signals.map((s) => ({
      id: s.id,
      authorId: s.authorId,
      authorName: s.author.pseudo ?? s.author.name ?? "Anonyme",
      scope: s.scope as "crew" | "communauté",
      latitude: s.latitude,
      longitude: s.longitude,
      predefinedPhrase: s.predefinedPhrase ?? null,
      description: s.description ?? null,
      discoveryType: s.discoveryType ?? null,
      confirmations: s.confirmations,
      infirmations: s.infirmations,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    })),
  };
}

export default async function SignauxPage({ params }: PageContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchSignauxData(id, session.user.id);
  if (!data) {
    redirect("/catalogue");
  }

  return (
    <SignauxView festEventId={id} festivalId={data.festivalId} initialSignals={data.signals} />
  );
}
