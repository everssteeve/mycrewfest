export default function FestivalLoading() {
  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Hero skeleton */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          padding: "var(--space-lg)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="flex gap-2">
          <div
            className="animate-pulse"
            style={{
              height: 22,
              width: 100,
              borderRadius: 4,
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
          <div
            className="animate-pulse"
            style={{
              height: 22,
              width: 60,
              borderRadius: 4,
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
        </div>
        <div
          className="animate-pulse"
          style={{
            height: 36,
            width: "75%",
            borderRadius: 6,
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        />
        <div
          className="animate-pulse"
          style={{
            height: 22,
            width: "45%",
            borderRadius: 4,
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        />
        <div
          className="animate-pulse"
          style={{
            height: 16,
            width: "60%",
            borderRadius: 4,
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        />
        <div
          className="animate-pulse"
          style={{
            height: 14,
            width: "90%",
            borderRadius: 4,
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        />
        <div
          className="animate-pulse"
          style={{
            height: 14,
            width: "80%",
            borderRadius: 4,
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        />
        <div className="flex gap-3 pt-2">
          <div
            className="animate-pulse"
            style={{
              height: 44,
              flex: 1,
              maxWidth: 260,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
          <div
            className="animate-pulse"
            style={{
              height: 44,
              width: 100,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
