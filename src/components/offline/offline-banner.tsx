"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useOffline } from "@/hooks/use-offline";
import { useAppStore } from "@/store/use-app-store";

/**
 * OfflineBanner
 *
 * Non-blocking informational banner that appears:
 * - When the device is offline: shows "Mode hors-ligne · N modifications en attente"
 * - When syncing: shows "Synchronisation en cours..." then auto-dismisses after 3s
 *
 * Lives above the content (position: fixed, top). Never modal.
 */
export function OfflineBanner() {
  const { isOffline, syncPending } = useOffline();
  const pendingOps = useAppStore((s) => s.offlineSyncQueue);
  const [showSync, setShowSync] = useState(false);

  // Show the sync banner for 3 seconds after sync starts
  useEffect(() => {
    if (syncPending) {
      setShowSync(true);
    } else if (showSync) {
      const timer = setTimeout(() => setShowSync(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncPending, showSync]);

  const visible = isOffline || showSync;

  if (!visible) return null;

  const pendingCount = pendingOps.length;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        zIndex: 100,
        background: "var(--bg-surface-elevated)",
        borderBottom: `1px solid ${isOffline ? "var(--warning-orange)" : "var(--secondary-cyan)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-sm)",
        padding: "6px var(--space-md)",
        transition: "var(--transition-fast)",
      }}
    >
      {isOffline ? (
        <>
          <WifiOff
            size={14}
            style={{ color: "var(--warning-orange)", flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              color: "var(--warning-orange)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Mode hors-ligne
            {pendingCount > 0 && (
              <span
                style={{
                  color: "var(--text-muted)",
                  fontWeight: "var(--fw-regular)",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                {" · "}
                {pendingCount} modification{pendingCount > 1 ? "s" : ""} en attente
              </span>
            )}
          </span>
        </>
      ) : (
        <>
          <RefreshCw
            size={14}
            style={{
              color: "var(--secondary-cyan)",
              flexShrink: 0,
              animation: "spin 1s linear infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              color: "var(--secondary-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Synchronisation en cours...
          </span>
        </>
      )}

      {/* Spin animation for the sync icon */}
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: required for keyframe animation
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `,
        }}
      />
    </div>
  );
}
