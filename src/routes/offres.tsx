import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/offres")({
  head: () => ({
    meta: [
      { title: "Nos offres d'abonnement — zugher." },
      {
        name: "description",
        content:
          "Découvrez les offres d'abonnement zugher pour suivre les opportunités territoriales et investir intelligemment.",
      },
    ],
  }),
  component: OffresPage,
});

type Plan = {
  name: string;
  price: string;
  cadence: string;
  pitch: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Découverte",
    price: "0 €",
    cadence: "/ mois",
    pitch: "Pour explorer la place de marché de votre territoire.",
    features: [
      "Accès à la place de marché du territoire choisi",
      "Newsletter mensuelle (veille + opportunités)",
      "Fiches projets publiques",
    ],
    cta: "Plan actuel",
  },
  {
    name: "Engagé",
    price: "12 €",
    cadence: "/ mois",
    pitch: "Pour suivre les projets et passer à l'action.",
    features: [
      "Tout l'offre Découverte",
      "Alertes personnalisées (secteurs, montants, territoires)",
      "Historique complet des opportunités",
      "Accès aux dossiers détaillés",
    ],
    cta: "Choisir Engagé",
    highlight: true,
  },
  {
    name: "Investisseur",
    price: "39 €",
    cadence: "/ mois",
    pitch: "Pour les investisseurs particuliers actifs.",
    features: [
      "Tout l'offre Engagé",
      "Indicateurs de performance territoriaux",
      "Accès anticipé aux nouvelles opportunités",
      "Échanges directs avec les porteurs de projets",
    ],
    cta: "Choisir Investisseur",
  },
];

function OffresPage() {
  return (
    <section className="zg-stub" style={{ maxWidth: 1080 }}>
      <div className="zg-stub-tag">Grand public · Offres</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}>
        Choisissez votre <em>niveau d'engagement</em>.
      </h1>
      <p className="zg-lead" style={{ maxWidth: 720 }}>
        Votre compte zugher est actif. Sélectionnez l'abonnement qui correspond
        à votre façon de suivre les opportunités territoriales. Vous pourrez le
        modifier à tout moment depuis votre espace.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginTop: 36,
        }}
      >
        {PLANS.map((p) => (
          <article
            key={p.name}
            className="zg-gate-note"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: 24,
              borderColor: p.highlight ? "var(--terra)" : undefined,
              borderWidth: p.highlight ? 2 : 1,
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>
              {p.name}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>
              {p.price}
              <span style={{ fontSize: 14, opacity: 0.6, fontWeight: 400 }}>
                {" "}{p.cadence}
              </span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5 }}>{p.pitch}</p>
            <ul className="zg-list" style={{ marginTop: 8 }}>
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              <Link
                to="/dashboard"
                className={p.highlight ? "zg-btn zg-btn-primary" : "zg-btn zg-btn-ghost"}
                style={{ width: "100%", textAlign: "center" }}
              >
                {p.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="zg-gate-note" style={{ marginTop: 32 }}>
        <strong>Pas encore prêt(e) ?</strong>
        <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
          Vous pouvez explorer la plateforme avec le plan Découverte gratuit.
          Les abonnements payants seront facturés une fois la mise en paiement
          activée — vous serez prévenu(e) par email avant tout prélèvement.
        </p>
      </div>

      <div className="zg-actions" style={{ marginTop: 24 }}>
        <Link to="/dashboard" className="zg-btn zg-btn-primary">Accéder à mon espace</Link>
        <Link to="/" className="zg-btn zg-btn-ghost">Retour à l'accueil</Link>
      </div>
    </section>
  );
}
