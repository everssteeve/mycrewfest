"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/catalogue");
  }

  const inputClass = [
    "rounded-[var(--radius-md)]",
    "border border-[var(--border-color)]",
    "bg-[var(--bg-surface)]",
    "px-4 py-3",
    "text-[var(--text-main)]",
    "outline-none transition",
    "focus:border-[var(--primary-neon)]",
    "focus:shadow-[0_0_0_2px_rgba(0,255,102,0.15)]",
    "placeholder:text-[var(--text-dim)]",
  ].join(" ");

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: "var(--bg-darker)" }}
    >
      <div
        className="w-full max-w-sm"
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}
      >
        {/* Logo */}
        <div className="text-center">
          <h1
            className="t-display"
            style={{
              color: "var(--primary-neon)",
              fontSize: "var(--fs-2xl)",
              letterSpacing: "var(--tracking-wider)",
              textShadow: "var(--glow-neon)",
            }}
          >
            MYCREWFEST
          </h1>
          <p className="t-caption mt-1" style={{ color: "var(--text-muted)" }}>
            Content de te revoir
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            padding: "var(--space-xl)",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="t-meta" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="t-meta" style={{ color: "var(--text-muted)" }}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="t-caption" role="alert" style={{ color: "var(--danger-red)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-1"
              style={{ width: "100%" }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border-color)" }} />
            <span className="t-caption" style={{ color: "var(--text-dim)" }}>
              ou
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border-color)" }} />
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/catalogue" })}
            className="btn btn-ghost w-full"
            style={{ border: "1px solid var(--border-color)" }}
          >
            Continuer avec Google
          </button>
        </div>

        <p className="t-caption text-center" style={{ color: "var(--text-muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" style={{ color: "var(--primary-neon)", textDecoration: "none" }}>
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
