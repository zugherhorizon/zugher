import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export function RequireAuth({
  children,
  reason,
}: {
  children: ReactNode;
  reason?: string;
}) {
  const { loading, user, emailConfirmed } = useAuth();

  if (loading) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <p className="zg-lead">Chargement de votre espace…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">Accès réservé</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
          Connectez-vous pour <em>continuer</em>.
        </h1>
        <p className="zg-lead">
          {reason ?? "Cette page est réservée aux membres zugher."}
        </p>
        <div className="zg-actions" style={{ marginTop: 24 }}>
          <Link to="/inscription" className="zg-btn zg-btn-primary">
            Créer un compte
          </Link>
          <Link to="/" className="zg-btn zg-btn-ghost">
            Retour à l'accueil
          </Link>
        </div>
      </section>
    );
  }

  if (!emailConfirmed) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">E-mail non confirmé</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
          Vérifiez votre <em>boîte mail</em>.
        </h1>
        <p className="zg-lead">
          Pour des raisons de sécurité, vous devez confirmer votre adresse e-mail
          avant d'accéder à votre espace privé. Nous avons envoyé un lien de
          vérification à <strong>{user.email}</strong>.
        </p>
        <div className="zg-actions" style={{ marginTop: 24 }}>
          <Link to="/inscription" className="zg-btn zg-btn-ghost">
            Renvoyer un lien
          </Link>
          <Link to="/" className="zg-btn zg-btn-ghost">
            Retour à l'accueil
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
