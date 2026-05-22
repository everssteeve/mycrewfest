"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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

    router.push("/");
  }

  return (
    <main className="screen-wrapper flex flex-col items-center justify-center">
      <div
        className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-surface)] p-8"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <h1 className="t-h2 mb-2 text-[var(--text-main)]">Connexion</h1>
        <p className="t-caption mb-6">Content de te revoir 👋</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="t-meta text-[var(--text-muted)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-darker)] px-4 py-3 text-[var(--text-main)] outline-none transition focus:border-[var(--primary-neon)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="t-meta text-[var(--text-muted)]"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-darker)] px-4 py-3 text-[var(--text-main)] outline-none transition focus:border-[var(--primary-neon)]"
            />
          </div>

          {error && (
            <p className="t-caption text-[var(--danger-red)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-2"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-color)]" />
          <span className="t-caption">ou</span>
          <div className="h-px flex-1 bg-[var(--border-color)]" />
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="btn btn-ghost w-full border border-[var(--border-color)]"
        >
          Continuer avec Google
        </button>

        <p className="t-caption mt-6 text-center">
          Pas encore de compte ?{" "}
          <a href="/register" className="text-[var(--primary-neon)]">
            S&apos;inscrire
          </a>
        </p>
      </div>
    </main>
  );
}
