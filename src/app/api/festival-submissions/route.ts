import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const submissionSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères.").max(120),
  officialUrl: z.string().url("L'URL doit être une adresse web valide."),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour soumettre un festival." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const { name, officialUrl } = parsed.data;

  try {
    const submission = await prisma.festivalSubmission.create({
      data: {
        authorId: session.user.id,
        nameProposed: name,
        officialUrl,
        status: "en_attente",
      },
    });

    return NextResponse.json({ id: submission.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la soumission." },
      { status: 500 },
    );
  }
}
