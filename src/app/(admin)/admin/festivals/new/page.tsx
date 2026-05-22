import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FestivalForm } from "../_components/festival-form";

export default async function NewFestivalPage() {
  async function createFestival(formData: FormData) {
    "use server";

    const slug = formData.get("slug") as string;

    await prisma.festival.create({
      data: {
        name: formData.get("name") as string,
        slug,
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
        ingestionStatus: (formData.get("ingestionStatus") as string) || "détecté",
        confidenceLevel: (formData.get("confidenceLevel") as string) || "auto",
      },
    });

    redirect(`/admin/festivals/${slug}/edit`);
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
        Nouveau festival
      </h1>
      <FestivalForm action={createFestival} />
    </div>
  );
}
