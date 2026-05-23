import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfilView, type ProfilData } from "./_components/profil-view";

export const metadata: Metadata = {
  title: "Mon profil",
};

async function fetchProfilData(userId: string): Promise<ProfilData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      pseudo: true,
      photo: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          festEvents: true,
          followedFestivals: true,
          souvenirs: true,
        },
      },
      festEvents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          mode: true,
          createdAt: true,
          festival: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
              endDate: true,
              city: true,
              country: true,
            },
          },
        },
      },
      followedFestivals: {
        select: {
          festival: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
              endDate: true,
              city: true,
              country: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const vuCount = await prisma.selection.count({
    where: { status: "vu", festEvent: { userId } },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    pseudo: user.pseudo,
    photo: user.photo ?? user.image,
    createdAt: user.createdAt.toISOString(),
    stats: {
      festEventsCount: user._count.festEvents,
      followedFestivalsCount: user._count.followedFestivals,
      souvenirsCount: user._count.souvenirs,
      vuCount,
    },
    festEvents: user.festEvents.map((fe) => ({
      id: fe.id,
      mode: fe.mode,
      createdAt: fe.createdAt.toISOString(),
      festival: {
        id: fe.festival.id,
        name: fe.festival.name,
        slug: fe.festival.slug,
        startDate: fe.festival.startDate.toISOString(),
        endDate: fe.festival.endDate.toISOString(),
        city: fe.festival.city,
        country: fe.festival.country,
      },
    })),
    followedFestivals: user.followedFestivals.map((uf) => ({
      id: uf.festival.id,
      name: uf.festival.name,
      slug: uf.festival.slug,
      startDate: uf.festival.startDate.toISOString(),
      endDate: uf.festival.endDate.toISOString(),
      city: uf.festival.city,
      country: uf.festival.country,
    })),
  };
}

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await fetchProfilData(session.user.id);
  if (!data) {
    redirect("/login");
  }

  return (
    <div
      style={{
        paddingTop: "var(--header-height)",
        paddingBottom: "calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))",
        minHeight: "100dvh",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--max-content)",
          margin: "0 auto",
          paddingLeft: "var(--space-md)",
          paddingRight: "var(--space-md)",
        }}
      >
        <ProfilView data={data} />
      </div>
    </div>
  );
}
