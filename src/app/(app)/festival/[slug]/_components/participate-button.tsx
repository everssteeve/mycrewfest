"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";

interface ParticipateButtonProps {
  festivalId: string;
}

export function ParticipateButton({ festivalId: _festivalId }: ParticipateButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    // TODO: POST /api/fest-events to create a FestEvent
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn btn-primary btn-lg flex-1"
      aria-label="Je participe à ce festival"
      style={{ maxWidth: 260 }}
    >
      {loading ? (
        "..."
      ) : (
        <>
          <Ticket size={18} aria-hidden="true" />
          Je participe
        </>
      )}
    </button>
  );
}
