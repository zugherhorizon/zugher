import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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

type Meta = {
  signup_source?: string;
  audience?: string;
  territory?: string;
};

function ConfirmEmailPage() {
  const { loading, user, emailConfirmed } = useAuth();
  const navigate = useNavigate();

  const meta = (user?.user_metadata ?? {}) as Meta;
  const isNewsletter = meta.signup_source === "newsletter";
  const isPro = meta.audience === "pro";

  useEffect(() => {
    if (loading || !user || !emailConfirmed) return;
    if (isNewsletter) return; // reste sur la page de remerciement newsletter
    const target = isPro ? "/rdv" : "/offres";
    const t = setTimeout(() => navigate({ to: target, replace: true }), 1500);
    return () => clearTimeout(t);
  }, [loading, user, emailConfirmed, isNewsletter, isPro, navigate]);


  if (loading) {
    return (
      <section className="zg-stub" style={{ maxWidth: 640 }}>
        <p className="zg-lead">Validation de votre lien en cours…</p>
      </section>
    );
  }

  if (user && emailConfirmed) {
    const meta = (user.user_metadata ?? {}) as Meta;
    const isNewsletter = meta.signup_source === "newsletter";
    const isPro = meta.audience === "pro";
    const territory = meta.territory?.trim();

    // CASE 1 — Newsletter only
    if (isNewsletter) {
      return (
        <section className="zg-stub" style={{ maxWidth: 720 }}>
          <div className="zg-stub-tag">Newsletter</div>
          <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
            Votre inscription à notre <em>newsletter</em> est prise en compte.
          </h1>
          <p className="zg-lead">
            Merci <strong>{user.email}</strong>. Vous recevrez la lettre mensuelle
            zugher dans votre boîte mail. Aucun appel ni rendez-vous ne sera
            planifié.
          </p>
          <div className="zg-actions" style={{ marginTop: 24 }}>
            <Link to="/" className="zg-btn zg-btn-primary">Retour à l'accueil</Link>
          </div>
        </section>
      );
    }

    // CASE 2 — Pro account → schedule appointment
    if (isPro) {
      return (
        <section className="zg-stub" style={{ maxWidth: 720 }}>
          <div className="zg-stub-tag">Compte professionnel activé</div>
          <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
            Bienvenue. Planifions notre <em>premier échange</em>.
          </h1>
          <p className="zg-lead">
            Votre compte pro <strong>{user.email}</strong> est actif. Choisissez
            un créneau pour un appel ou une visio avec notre équipe.
          </p>
          <div className="zg-gate-note" style={{ marginTop: 16 }}>
            <strong>Comment ça se passe ?</strong>
            <ul className="zg-list" style={{ marginTop: 8 }}>
              <li>Sélectionnez un créneau de 30 minutes disponible</li>
              <li>Choisissez le format : appel téléphonique ou visio Google Meet</li>
              <li>Une invitation calendrier vous sera envoyée par email</li>
            </ul>
          </div>
          <div className="zg-actions" style={{ marginTop: 24 }}>
            <Link to="/rdv" className="zg-btn zg-btn-primary">
              Choisir un créneau
            </Link>
            <Link to="/dashboard" className="zg-btn zg-btn-ghost">
              Plus tard — accéder à mon espace
            </Link>
          </div>
        </section>
      );
    }

    // CASE 3 — Grand public → subscription offers
    return (
      <section className="zg-stub" style={{ maxWidth: 720 }}>
        <div className="zg-stub-tag">Compte activé</div>
        <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
          Bienvenue, votre compte est <em>actif</em>.
        </h1>
        <p className="zg-lead">
          Votre adresse <strong>{user.email}</strong> est confirmée. Découvrez
          maintenant nos offres pour suivre les opportunités
          {territory ? <> sur <strong>{territory}</strong></> : null} et passer à
          l'action.
        </p>
        <div className="zg-actions" style={{ marginTop: 24 }}>
          <Link to="/offres" className="zg-btn zg-btn-primary">
            Voir les offres d'abonnement
          </Link>
          <Link to="/dashboard" className="zg-btn zg-btn-ghost">
            Accéder à mon espace
          </Link>
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
