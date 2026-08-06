import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/connexion")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next:
      typeof search.next === "string" && search.next.startsWith("/")
        ? search.next
        : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Identifier — zugher." },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace zugher avec votre adresse e-mail et votre mot de passe.",
      },
    ],
  }),
  component: ConnexionPage,
});

const schema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  password: z.string().min(1, "Mot de passe requis").max(200),
});

function ConnexionPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const goNext = () => {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/mon-compte" });
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (authError) {
      const msg = authError.message?.toLowerCase() ?? "";
      // Supabase renvoie "Invalid login credentials" si l'email n'existe pas
      // ou si le mot de passe est faux. On propose l'inscription dans tous les cas
      // où le compte est introuvable / non confirmé.
      if (msg.includes("invalid") || msg.includes("not found") || msg.includes("user")) {
        setError(
          "Identifiants incorrects. Si vous n'avez pas encore de compte, créez-en un.",
        );
      } else if (msg.includes("confirm")) {
        setInfo(
          "Votre adresse e-mail n'est pas encore confirmée. Vérifiez votre boîte mail.",
        );
      } else {
        setError(authError.message);
      }
      return;
    }

    if (data.session) {
      goNext();
    }
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 560 }}>
      <div className="zg-stub-tag">Espace membre</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
        S'<em>identifier</em>.
      </h1>
      <p className="zg-lead">
        Saisissez votre adresse e-mail et votre mot de passe pour accéder à votre
        espace personnel zugher.
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 24, display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Adresse e-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            maxLength={255}
            className="zg-input"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "transparent",
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={200}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "transparent",
              fontSize: 15,
            }}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(220, 38, 38, 0.08)",
              color: "rgb(153, 27, 27)",
              fontSize: 14,
            }}
          >
            {error}
            {error.includes("créez") && (
              <>
                {" "}
                <Link to="/inscription" style={{ textDecoration: "underline" }}>
                  Aller à l'inscription
                </Link>
                .
              </>
            )}
          </div>
        )}

        {info && (
          <div
            role="status"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(59, 130, 246, 0.08)",
              fontSize: 14,
            }}
          >
            {info}
          </div>
        )}

        <div className="zg-actions" style={{ marginTop: 8 }}>
          <button
            type="submit"
            className="zg-btn zg-btn-primary"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Identifier"}
          </button>
          <Link to="/inscription" className="zg-btn zg-btn-ghost">
            Créer un compte
          </Link>
        </div>
      </form>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "rgba(0,0,0,0.5)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.12)" }} />
          ou
          <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.12)" }} />
        </div>
        <button
          type="button"
          onClick={async () => {
            setError(null);
            const result = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: next
                ? `${window.location.origin}${next}`
                : window.location.origin,
            });
            if (result.error) {
              setError(result.error.message ?? "Connexion Google impossible");
              return;
            }
            if (result.redirected) return;
            goNext();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#fff",
            color: "#1a1a1a",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.32z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Continuer avec Google
        </button>
      </div>
    </section>
  );
}
