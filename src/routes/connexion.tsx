import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/connexion")({
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
      navigate({ to: "/dashboard" });
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
    </section>
  );
}
