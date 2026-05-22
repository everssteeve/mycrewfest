import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FestivalForm } from "../../_components/festival-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditFestivalPage({ params }: Props) {
  const { slug } = await params;

  const festival = await prisma.festival.findUnique({ where: { slug } });
  if (!festival) notFound();

  async function updateFestival(formData: FormData) {
    "use server";
    const { slug: currentSlug } = await params;

    await prisma.festival.update({
      where: { slug: currentSlug },
      data: {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        description: (formData.get("description") as string) || null,
        city: formData.get("city") as string,
        country: formData.get("country") as string,
        address: (formData.get("address") as string) || null,
        startDate: new Date(formData.get("startDate") as string),
        endDate: new Date(formData.get("endDate") as string),
        festivalType: formData.get("festivalType") as string,
        programType: formData.get("programType") as string,
        siteUrl: (formData.get("siteUrl") as string) || null,
        instagramHandle: (formData.get("instagramHandle") as string) || null,
        ingestionStatus: formData.get("ingestionStatus") as string,
        confidenceLevel: formData.get("confidenceLevel") as string,
      },
    });

    const newSlug = formData.get("slug") as string;
    redirect(`/admin/festivals/${newSlug}/edit`);
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-xl)",
        }}
      >
        Éditer — {festival.name}
      </h1>
      <FestivalForm action={updateFestival} defaultValues={festival} />
    </div>
  );
}
