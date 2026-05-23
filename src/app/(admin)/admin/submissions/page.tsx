import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  buildSubmissionSlug,
  countSubmissionsByStatus,
  filterSubmissionsByStatus,
  getSubmissionStatusColor,
  getSubmissionStatusLabel,
  isSubmissionActionable,
  isSubmissionPendingOnly,
} from "@/lib/admin-submissions";
import { prisma } from "@/lib/prisma";

async function getSubmissions() {
  return prisma.festivalSubmission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      author: { select: { name: true, email: true, pseudo: true } },
    },
  });
}

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const { status: activeStatus } = await searchParams;
  const submissions = await getSubmissions();
  const counts = countSubmissionsByStatus(
    submissions.map((s) => ({
      id: s.id,
      nameProposed: s.nameProposed,
      status: s.status,
      submittedAt: s.submittedAt,
    })),
  );
  const filtered = filterSubmissionsByStatus(submissions, activeStatus ?? null);

  return (
    <div>
      <h1
        data-testid="admin-submissions-title"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-2xl)",
          color: "var(--text-main)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          margin: "0 0 var(--space-lg)",
        }}
      >
        Soumissions
      </h1>

      {/* KPIs (clickable filters) */}
      <div
        data-testid="admin-submissions-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {/* "All" chip */}
        <Link
          href="/admin/submissions"
          data-testid="admin-submissions-filter-all"
          style={{
            background: !activeStatus ? "rgba(255,255,255,0.04)" : "var(--bg-surface)",
            border: !activeStatus ? "1px solid var(--text-dim)" : "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            textAlign: "center",
            textDecoration: "none",
            display: "block",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-2xl)",
              color: "var(--text-main)",
              margin: 0,
              fontWeight: "var(--fw-bold)",
            }}
          >
            {submissions.length}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "4px 0 0",
            }}
          >
            Toutes
          </p>
        </Link>
        {[
          {
            label: "En attente",
            status: "en_attente",
            value: counts.en_attente,
            color: "var(--warning-orange)",
            testid: "admin-submissions-kpi-pending",
          },
          {
            label: "En traitement",
            status: "en_traitement",
            value: counts.en_traitement,
            color: "var(--secondary-cyan)",
            testid: "admin-submissions-kpi-processing",
          },
          {
            label: "Ajoutés",
            status: "ajouté",
            value: counts.ajouté,
            color: "var(--primary-neon)",
            testid: "admin-submissions-kpi-accepted",
          },
          {
            label: "Rejetés",
            status: "rejeté",
            value: counts.rejeté,
            color: "var(--danger-red)",
            testid: "admin-submissions-kpi-rejected",
          },
        ].map((kpi) => {
          const isActive = activeStatus === kpi.status;
          return (
            <Link
              key={kpi.status}
              href={isActive ? "/admin/submissions" : `/admin/submissions?status=${kpi.status}`}
              data-testid={kpi.testid}
              style={{
                background: isActive ? "rgba(255,255,255,0.04)" : "var(--bg-surface)",
                border: isActive ? `1px solid ${kpi.color}` : "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-md)",
                textAlign: "center",
                textDecoration: "none",
                display: "block",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-2xl)",
                  color: kpi.color,
                  margin: 0,
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {kpi.value}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: "4px 0 0",
                }}
              >
                {kpi.label}
              </p>
            </Link>
          );
        })}
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              {["Auteur", "Nom proposé", "URL", "Statut", "Date", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "var(--space-sm) var(--space-md)",
                    textAlign: "left",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: "var(--fw-bold)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub, i) => {
              const author = sub.author;
              const authorName = author.pseudo ?? author.name ?? author.email;
              const statusColor = getSubmissionStatusColor(sub.status);

              return (
                <tr
                  key={sub.id}
                  data-testid={`admin-submission-row-${sub.id}`}
                  style={{
                    borderBottom:
                      i < filtered.length - 1 ? "1px solid var(--border-color)" : "none",
                  }}
                >
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-main)",
                      }}
                    >
                      {authorName}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-main)",
                        fontWeight: "var(--fw-bold)",
                      }}
                    >
                      {sub.nameProposed}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <a
                      href={sub.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--secondary-cyan)",
                        textDecoration: "none",
                      }}
                    >
                      {sub.officialUrl.slice(0, 40)}
                      {sub.officialUrl.length > 40 ? "…" : ""}
                    </a>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${statusColor}`,
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: statusColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {getSubmissionStatusLabel(sub.status)}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--fs-xs)",
                        color: "var(--text-dim)",
                      }}
                    >
                      {new Date(sub.submittedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td style={{ padding: "var(--space-sm) var(--space-md)" }}>
                    {isSubmissionActionable(sub.status) ? (
                      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                        {isSubmissionPendingOnly(sub.status) && <TakeChargeButton id={sub.id} />}
                        <AcceptButton id={sub.id} name={sub.nameProposed} url={sub.officialUrl} />
                        <RejectButton id={sub.id} />
                      </div>
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--fs-xs)",
                          color: "var(--text-dim)",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Aucune soumission en attente.
          </div>
        )}
      </div>
    </div>
  );
}

function TakeChargeButton({ id }: { id: string }) {
  async function takeCharge() {
    "use server";
    await prisma.festivalSubmission.update({
      where: { id },
      data: { status: "en_traitement" },
    });
    revalidatePath("/admin/submissions");
  }

  return (
    <form action={takeCharge}>
      <button
        type="submit"
        data-testid={`admin-submission-take-charge-${id}`}
        style={{
          padding: "4px 10px",
          border: "1px solid var(--secondary-cyan)",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          color: "var(--secondary-cyan)",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Traiter
      </button>
    </form>
  );
}

function AcceptButton({ id, name, url }: { id: string; name: string; url: string }) {
  async function accept() {
    "use server";

    const slug = buildSubmissionSlug(name);

    const newFestival = await prisma.festival.create({
      data: {
        name,
        slug: `${slug}-${Date.now()}`,
        city: "À compléter",
        country: "FR",
        startDate: new Date(),
        endDate: new Date(),
        siteUrl: url,
        ingestionStatus: "détecté",
        confidenceLevel: "auto",
      },
    });

    await prisma.festivalSubmission.update({
      where: { id },
      data: { status: "ajouté", festivalId: newFestival.id },
    });

    revalidatePath("/admin/submissions");
  }

  return (
    <form action={accept}>
      <button
        type="submit"
        style={{
          padding: "4px 10px",
          border: "1px solid var(--primary-neon)",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          color: "var(--primary-neon)",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Accepter
      </button>
    </form>
  );
}

function RejectButton({ id }: { id: string }) {
  async function reject() {
    "use server";
    await prisma.festivalSubmission.update({
      where: { id },
      data: { status: "rejeté" },
    });
    revalidatePath("/admin/submissions");
  }

  return (
    <form action={reject}>
      <button
        type="submit"
        style={{
          padding: "4px 10px",
          border: "1px solid var(--danger-red)",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xs)",
          color: "var(--danger-red)",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Rejeter
      </button>
    </form>
  );
}
