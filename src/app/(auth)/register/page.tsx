"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, callbackUrl: "/catalogue" });
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
            Crée ton compte et rejoins la crew
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
              <label htmlFor="name" className="t-meta" style={{ color: "var(--text-muted)" }}>
                Pseudo
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton pseudo de festivalier·ère"
                className={inputClass}
              />
            </div>

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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
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
              {loading ? "Création du compte…" : "S'inscrire"}
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
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--primary-neon)", textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
