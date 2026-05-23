"use client";

import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getPushPermissionState,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-notifications";

interface PushToggleProps {
  festEventId?: string;
}

type PushState = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function PushToggle({ festEventId }: PushToggleProps) {
  const [state, setState] = useState<PushState>("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const permState = getPushPermissionState();
    if (permState === "unsupported") {
      setState("unsupported");
      return;
    }
    if (permState === "denied") {
      setState("denied");
      return;
    }

    isPushSubscribed().then((subscribed) => {
      setState(subscribed ? "subscribed" : "unsubscribed");
    });
  }, []);

  const handleToggle = useCallback(async () => {
    if (working) return;
    setWorking(true);

    if (state === "subscribed") {
      const ok = await unsubscribeFromPush(festEventId);
      setState(ok ? "unsubscribed" : "subscribed");
    } else {
      const ok = await subscribeToPush(festEventId);
      if (ok) {
        setState("subscribed");
      } else {
        const perm = getPushPermissionState();
        setState(perm === "denied" ? "denied" : "unsubscribed");
      }
    }

    setWorking(false);
  }, [state, working, festEventId]);

  if (state === "unsupported") return null;

  const isSubscribed = state === "subscribed";
  const isDenied = state === "denied";
  const isLoading = state === "loading" || working;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-md)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        {isSubscribed ? (
          <Bell size={16} style={{ color: "var(--primary-neon)" }} />
        ) : (
          <BellOff size={16} style={{ color: "var(--text-muted)" }} />
        )}
        <div>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-sm)",
              color: isSubscribed ? "var(--text-main)" : "var(--text-muted)",
              margin: 0,
              fontWeight: "var(--fw-bold)",
            }}
          >
            Notifications push
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
              margin: "2px 0 0",
            }}
          >
            {isDenied
              ? "Bloquées dans les réglages du navigateur"
              : isSubscribed
                ? "Alertes must-see 15 min avant"
                : "Activez pour les événements must-see"}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isSubscribed}
        disabled={isDenied || isLoading}
        onClick={handleToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: "var(--radius-full)",
          border: "none",
          background: isSubscribed
            ? "var(--primary-neon)"
            : isDenied
              ? "var(--bg-surface-elevated)"
              : "var(--border-color)",
          position: "relative",
          cursor: isDenied || isLoading ? "not-allowed" : "pointer",
          transition: "var(--transition-fast)",
          flexShrink: 0,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: isSubscribed ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "var(--radius-full)",
            background: isSubscribed ? "var(--text-on-neon)" : "var(--text-dim)",
            transition: "var(--transition-fast)",
          }}
        />
      </button>
    </div>
  );
}
