import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { AdminGlobalSearch } from "./admin/_components/admin-global-search";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") {
    redirect("/");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-darker)",
        color: "var(--text-main)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-lg) 0",
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: "0 var(--space-md) var(--space-lg)",
            borderBottom: "1px solid var(--border-color)",
            marginBottom: "var(--space-md)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-sm)",
              color: "var(--primary-neon)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: 0,
            }}
          >
            MyCrewFest
          </p>
          <span
            style={{
              display: "inline-block",
              marginTop: 4,
              padding: "2px 8px",
              background: "var(--warning-orange)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              fontWeight: "var(--fw-bold)",
              color: "#000",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Admin Panel
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 var(--space-sm)" }}>
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/festivals", label: "Festivals" },
            { href: "/admin/artists", label: "Artistes" },
            { href: "/admin/submissions", label: "Soumissions" },
            { href: "/admin/users", label: "Utilisateurs" },
            { href: "/admin/stats", label: "Statistiques" },
            { href: "/admin/activity", label: "Activité" },
            { href: "/admin/crews", label: "Crews" },
            { href: "/admin/agents", label: "Agents IA" },
            { href: "/admin/signals", label: "Signaux" },
            { href: "/admin/health", label: "Santé" },
            { href: "/admin/news", label: "News" },
            { href: "/admin/souvenirs", label: "Souvenirs" },
            { href: "/admin/export", label: "Export" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "block",
                padding: "10px var(--space-md)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: "var(--fw-bold)",
                transition: "var(--transition-fast)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            padding: "var(--space-md)",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xs)",
              color: "var(--text-dim)",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            ← Retour app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Top bar with global search */}
        <div
          style={{
            padding: "var(--space-md) var(--space-xl)",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
          }}
        >
          <AdminGlobalSearch />
        </div>
        <main style={{ flex: 1, padding: "var(--space-xl)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
