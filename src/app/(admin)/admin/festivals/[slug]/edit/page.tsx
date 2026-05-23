import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  computeDataQualityScore,
  type FestivalQualityInput,
  getQualityGrade,
  getQualityGradeColor,
  runQualityChecks,
} from "@/lib/festival-data-quality";
import { prisma } from "@/lib/prisma";
import { FestivalForm } from "../../_components/festival-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditFestivalPage({ params }: Props) {
  const { slug } = await params;

  const festival = await prisma.festival.findUnique({
    where: { slug },
    include: { _count: { select: { events: true } } },
  });
  if (!festival) notFound();

  const qualityInput: FestivalQualityInput = {
    name: festival.name,
    description: festival.description,
    city: festival.city,
    latitude: festival.latitude,
    longitude: festival.longitude,
    capacity: festival.capacity,
    siteUrl: festival.siteUrl,
    instagramHandle: festival.instagramHandle,
    programStatus: festival.programStatus,
    ingestionStatus: festival.ingestionStatus,
    eventCount: festival._count.events,
  };
  const qualityScore = computeDataQualityScore(qualityInput);
  const qualityGrade = getQualityGrade(qualityScore);
  const qualityColor = getQualityGradeColor(qualityGrade);
  const qualityChecks = runQualityChecks(qualityInput);
  const failedChecks = qualityChecks.filter((c) => !c.passed);

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
          margin: "0 0 var(--space-md)",
        }}
      >
        Éditer — {festival.name}
      </h1>

      {/* Quality score panel */}
      <div
        data-testid="festival-edit-quality-panel"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-md)",
          backgroundColor: "var(--bg-surface)",
          border: `1px solid ${qualityColor}44`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-md)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {/* Grade badge */}
        <div
          data-testid="festival-edit-quality-grade"
          style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--fs-xl)",
            color: qualityColor,
            border: `2px solid ${qualityColor}`,
            borderRadius: "var(--radius-md)",
          }}
        >
          {qualityGrade}
        </div>

        {/* Score + failed checks */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              marginBottom: 6,
            }}
          >
            <span
              data-testid="festival-edit-quality-score"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-lg)",
                fontWeight: 700,
                color: qualityColor,
              }}
            >
              {qualityScore}/100
            </span>
            <Link
              href="/admin/festivals/qualite"
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--text-dim)",
                textDecoration: "none",
              }}
            >
              ↗ Voir toutes les qualités
            </Link>
          </div>

          {failedChecks.length === 0 ? (
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--primary-neon)", margin: 0 }}>
              ✓ Tous les critères sont remplis
            </p>
          ) : (
            <div
              data-testid="festival-edit-quality-failed"
              style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
            >
              {failedChecks.map((check) => (
                <span
                  key={check.key}
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--danger-red)",
                    background: "rgba(255,51,85,0.08)",
                    border: "1px solid rgba(255,51,85,0.25)",
                    borderRadius: "var(--radius-sm)",
                    padding: "2px 8px",
                  }}
                >
                  ✗ {check.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <FestivalForm action={updateFestival} defaultValues={festival} />
    </div>
  );
}
