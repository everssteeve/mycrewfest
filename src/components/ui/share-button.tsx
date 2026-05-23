"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState, useTransition } from "react";
import { type SharePayload, shareOrCopy } from "@/lib/share";

interface ShareButtonProps {
  payload: SharePayload;
  label?: string;
  "data-testid"?: string;
}

export function ShareButton({
  payload,
  label = "Partager",
  "data-testid": testId,
}: ShareButtonProps) {
  const [result, setResult] = useState<"idle" | "copied" | "shared">("idle");
  const [isPending, startTransition] = useTransition();

  const handleShare = () => {
    startTransition(async () => {
      const res = await shareOrCopy(payload);
      if (res === "copied" || res === "shared") {
        setResult(res === "copied" ? "copied" : "shared");
        setTimeout(() => setResult("idle"), 2000);
      }
    });
  };

  const isSuccess = result !== "idle";

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isPending || isSuccess}
      aria-label={isSuccess ? "Lien copié !" : label}
      aria-live="polite"
      data-testid={testId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 8,
        paddingBottom: 8,
        borderRadius: "var(--radius-md)",
        border: isSuccess ? "1.5px solid var(--primary-neon)" : "1.5px solid var(--border-strong)",
        backgroundColor: isSuccess ? "var(--neon-soft)" : "transparent",
        color: isSuccess ? "var(--primary-neon)" : "var(--text-muted)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-bold)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: isPending || isSuccess ? "default" : "pointer",
        transition: "var(--transition-fast)",
        boxShadow: isSuccess ? "var(--glow-neon)" : "none",
      }}
    >
      {isSuccess ? (
        <Check size={16} aria-hidden="true" />
      ) : result === "idle" ? (
        <Share2 size={16} aria-hidden="true" />
      ) : (
        <Copy size={16} aria-hidden="true" />
      )}
      {isSuccess ? "Copié !" : label}
    </button>
  );
}
