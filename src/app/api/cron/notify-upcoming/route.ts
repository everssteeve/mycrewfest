import { type NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Auth: Bearer CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "VAPID keys non configurées." }, { status: 500 });
  }

  webpush.setVapidDetails("mailto:contact@mycrewfest.app", vapidPublicKey, vapidPrivateKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() + 15 * 60 * 1000); // +15 min
  const windowEnd = new Date(now.getTime() + 25 * 60 * 1000); // +25 min

  try {
    // Find events starting in 15–25 minutes with must-see selections
    const mustSeeSelections = await prisma.selection.findMany({
      where: {
        status: "must-see",
        event: {
          startTime: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            venue: { select: { name: true } },
          },
        },
        festEvent: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (mustSeeSelections.length === 0) {
      return NextResponse.json({ sent: 0, message: "Aucun event must-see dans la fenêtre." });
    }

    // Group by userId
    const byUser = new Map<string, typeof mustSeeSelections>();
    for (const sel of mustSeeSelections) {
      const uid = sel.festEvent.userId;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)?.push(sel);
    }

    let sent = 0;
    let failed = 0;

    for (const [userId, selections] of byUser.entries()) {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      for (const sub of subscriptions) {
        for (const sel of selections) {
          const startTime = sel.event.startTime
            ? new Date(sel.event.startTime).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          const venue = sel.event.venue?.name ?? "";
          const body = venue
            ? `Dans 15 min — ${startTime} — ${venue}`
            : `Dans 15 min — ${startTime}`;

          const payload = JSON.stringify({
            title: sel.event.title,
            body,
            icon: "/icon-192.png",
            badge: "/badge-72.png",
            tag: `event-${sel.event.id}`,
            data: {
              festEventId: sel.festEvent.id,
            },
          });

          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload,
            );
            sent++;
          } catch (err: unknown) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 410 || status === 404) {
              // Subscription expired — clean up
              await prisma.pushSubscription.deleteMany({
                where: { endpoint: sub.endpoint },
              });
            } else {
              console.error("[cron/notify-upcoming] Push failed", err);
            }
            failed++;
          }
        }
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("[cron/notify-upcoming]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
