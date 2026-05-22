export function CatalogueSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          key={i}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            padding: "var(--space-md)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            className="animate-pulse"
            style={{
              height: 20,
              width: "65%",
              borderRadius: 6,
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
          <div
            className="animate-pulse"
            style={{
              height: 14,
              width: "40%",
              borderRadius: 4,
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
          <div
            className="animate-pulse"
            style={{
              height: 14,
              width: "50%",
              borderRadius: 4,
              backgroundColor: "var(--bg-surface-elevated)",
            }}
          />
          <div className="flex gap-2 pt-1">
            <div
              className="animate-pulse"
              style={{
                height: 22,
                width: 100,
                borderRadius: 999,
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            />
            <div
              className="animate-pulse"
              style={{
                height: 22,
                width: 130,
                borderRadius: 999,
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
