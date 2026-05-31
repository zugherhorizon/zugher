import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/confirm-email")({
  head: () => ({
    meta: [
      { title: "E-mail confirmé — zugher." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const { loading, user, emailConfirmed } = useAuth();

  if (loading) {
    return (
      <section className="zg-stub" style={{ maxWidth: 640 }}>
        <p className="zg-lead">Validation de votre lien en cours…</p>
      </section>
    );
  }

  if (user && emailConfirmed) {
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">Compte activé</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
          Bienvenue, votre compte est <em>actif</em>.
        </h1>
        <p className="zg-lead">
          Votre adresse <strong>{user.email}</strong> est confirmée. Vous pouvez
          maintenant accéder à votre espace privé zugher.
        </p>
        <div className="zg-actions" style={{ marginTop: 24 }}>
          <Link to="/dashboard" className="zg-btn zg-btn-primary">Accéder à mon espace</Link>
          <Link to="/applications" className="zg-btn zg-btn-ghost">Voir les applications</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 720 }}>
      <div className="zg-stub-tag">Lien invalide ou expiré</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>
        Ce lien n'est plus <em>valable</em>.
      </h1>
      <p className="zg-lead">
        Les liens de confirmation expirent après quelques minutes. Recommencez
        l'inscription avec la même adresse pour recevoir un nouveau lien.
      </p>
      <div className="zg-actions" style={{ marginTop: 24 }}>
        <Link to="/inscription" className="zg-btn zg-btn-primary">Recevoir un nouveau lien</Link>
        <Link to="/" className="zg-btn zg-btn-ghost">Retour à l'accueil</Link>
      </div>
    </section>
  );
}
