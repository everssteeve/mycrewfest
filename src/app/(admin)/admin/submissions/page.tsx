import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getSubmissions() {
  return prisma.festivalSubmission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      author: { select: { name: true, email: true, pseudo: true } },
    },
  });
}

const statusColors: Record<string, string> = {
  en_attente: "var(--warning-orange)",
  en_traitement: "var(--primary-cyan)",
  ajouté: "var(--primary-neon)",
  rejeté: "var(--danger-red)",
};

export default async function AdminSubmissionsPage() {
  const submissions = await getSubmissions();

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
        Soumissions
      </h1>

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
            {submissions.map((sub, i) => {
              const author = sub.author;
              const authorName = author.pseudo ?? author.name ?? author.email;

              return (
                <tr
                  key={sub.id}
                  style={{
                    borderBottom:
                      i < submissions.length - 1 ? "1px solid var(--border-color)" : "none",
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
                        color: "var(--primary-cyan)",
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
                        border: `1px solid ${statusColors[sub.status] ?? "var(--border-color)"}`,
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-xs)",
                        color: statusColors[sub.status] ?? "var(--text-dim)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {sub.status}
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
                    {sub.status === "en_attente" || sub.status === "en_traitement" ? (
                      <div style={{ display: "flex", gap: "var(--space-xs)" }}>
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

        {submissions.length === 0 && (
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

function AcceptButton({ id, name, url }: { id: string; name: string; url: string }) {
  async function accept() {
    "use server";

    // Create a festival from the submission
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

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
