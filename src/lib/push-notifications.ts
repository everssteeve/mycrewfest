/**
 * F21 — Push Notifications client-side helpers
 * Requires NEXT_PUBLIC_VAPID_KEY (public) and VAPID_PRIVATE_KEY (server-only)
 */

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

/**
 * Request notification permission from the browser and subscribe to Push API.
 * Returns the PushSubscription object or null on failure/denial.
 */
export async function requestPermission(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (!("serviceWorker" in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  if (!vapidPublicKey) {
    console.error("[push] NEXT_PUBLIC_VAPID_KEY manquante");
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
    });
    return subscription;
  } catch (err) {
    console.error("[push] Échec de la subscription Push", err);
    return null;
  }
}

/**
 * Register a push subscription for a specific festEvent in the database.
 */
export async function subscribeToPush(festEventId?: string): Promise<boolean> {
  const subscription = await requestPermission();
  if (!subscription) return false;

  const json = subscription.toJSON() as {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!json.keys?.p256dh || !json.keys?.auth) return false;

  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        festEventId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Unsubscribe from push notifications for a specific festEvent.
 */
export async function unsubscribeFromPush(festEventId?: string): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return true; // Already unsubscribed

  try {
    const res = await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        festEventId,
      }),
    });
    if (res.ok) {
      await subscription.unsubscribe();
    }
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Check if the current browser is subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Check if push notifications are supported and permission is granted.
 */
export function getPushPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
