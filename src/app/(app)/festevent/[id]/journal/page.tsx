export default function JournalPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-md)",
        paddingTop: "var(--space-2xl)",
        paddingBottom: "var(--space-2xl)",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 40 }} aria-hidden="true">
        📓
      </span>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm)",
          color: "var(--text-muted)",
        }}
      >
        Journal de festival — bientôt disponible.
      </p>
    </div>
  );
}
