import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/offres")({
  head: () => ({
    meta: [
      { title: "Nos offres d'abonnement — zugher." },
      {
        name: "description",
        content:
          "Quatre offres zugher adaptées à votre profil : porteur de projet, investisseur, compétence ou demandeur d'emploi. Mensuel ou annuel (-20%).",
      },
    ],
  }),
  component: OffresPage,
});

type Cadence = "monthly" | "yearly";

type Plan = {
  id: string;
  audience: string;
  name: string;
  tagline: string;
  monthly: number; // €/mois
  pitch: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
};

const ANNUAL_DISCOUNT = 0.2; // -20% sur l'annuel

const PLANS: Plan[] = [
  {
    id: "demandeur",
    audience: "Demandeur d'emploi",
    name: "Tremplin",
    tagline: "Gratuit, sur justificatif",
    monthly: 0,
    pitch:
      "Accédez aux opportunités du territoire et reconnectez-vous à l'écosystème local.",
    features: [
      "Place de marché du territoire choisi",
      "Alertes emploi & missions courtes",
      "Mise en relation avec les structures locales",
      "Newsletter mensuelle territoriale",
    ],
    cta: "Activer Tremplin",
  },
  {
    id: "competence",
    audience: "Compétence",
    name: "Expertise",
    tagline: "Pour freelances, mentors, experts",
    monthly: 12,
    pitch:
      "Proposez vos compétences aux porteurs de projets et aux entreprises du territoire.",
    features: [
      "Profil compétence référencé",
      "Alertes missions ciblées (secteur, montant, zone)",
      "Accès aux briefs de projets en recherche",
      "Historique complet des opportunités",
    ],
    cta: "Choisir Expertise",
  },
  {
    id: "porteur",
    audience: "Porteur de projet",
    name: "Élan",
    tagline: "Le plus choisi",
    monthly: 19,
    pitch:
      "Donnez de la visibilité à votre projet, trouvez vos premiers soutiens et financements.",
    features: [
      "Fiche projet enrichie & visibilité prioritaire",
      "Mise en relation investisseurs & mentors",
      "Suivi des marques d'intérêt en temps réel",
      "Accompagnement méthodologique (guides + replays)",
      "Alertes financements publics / privés",
    ],
    cta: "Choisir Élan",
    highlight: true,
    badge: "Recommandé",
  },
  {
    id: "investisseur",
    audience: "Investisseur",
    name: "Dealflow",
    tagline: "Pour investir intelligemment",
    monthly: 39,
    pitch:
      "Accédez en avance aux projets, comparez-les, échangez directement avec les porteurs.",
    features: [
      "Accès anticipé aux nouvelles opportunités",
      "Indicateurs de performance territoriaux",
      "Dossiers détaillés & data room sécurisée",
      "Échanges directs avec les porteurs",
      "Export & suivi de portefeuille",
    ],
    cta: "Choisir Dealflow",
  },
];

function formatPrice(monthly: number, cadence: Cadence) {
  if (monthly === 0) return { main: "0 €", sub: "à vie" };
  if (cadence === "monthly") {
    return { main: `${monthly} €`, sub: "/ mois" };
  }
  const discounted = Math.round(monthly * (1 - ANNUAL_DISCOUNT));
  return { main: `${discounted} €`, sub: "/ mois · facturé annuellement" };
}

function OffresPage() {
  const [cadence, setCadence] = useState<Cadence>("monthly");

  const subtitle = useMemo(
    () =>
      cadence === "yearly"
        ? "Tarifs annuels avec -20% appliqué. Engagement 12 mois, sans renouvellement automatique surprise."
        : "Tarifs mensuels sans engagement. Modifiable ou résiliable à tout moment.",
    [cadence],
  );

  return (
    <section className="zg-stub" style={{ maxWidth: 1180 }}>
      <div className="zg-stub-tag">Grand public · Offres</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}>
        Une offre par <em>profil d'action</em>.
      </h1>
      <p className="zg-lead" style={{ maxWidth: 760 }}>
        zugher s'adresse à quatre profils complémentaires du territoire.
        Choisissez celui qui vous correspond — vous pourrez changer d'offre
        à tout moment depuis votre espace.
      </p>

      {/* Cadence toggle */}
      <div
        role="tablist"
        aria-label="Cadence de facturation"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 999,
          marginTop: 28,
          background: "rgba(0,0,0,0.03)",
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={cadence === "monthly"}
          onClick={() => setCadence("monthly")}
          className={cadence === "monthly" ? "zg-btn zg-btn-primary" : "zg-btn zg-btn-ghost"}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
          }}
        >
          Mensuel
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={cadence === "yearly"}
          onClick={() => setCadence("yearly")}
          className={cadence === "yearly" ? "zg-btn zg-btn-primary" : "zg-btn zg-btn-ghost"}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Annuel
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
              background: "var(--terra)",
              color: "#fff",
              fontWeight: 600,
              letterSpacing: 0.4,
            }}
          >
            −20%
          </span>
        </button>
      </div>
      <p style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>{subtitle}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginTop: 28,
          alignItems: "stretch",
        }}
      >
        {PLANS.map((p) => {
          const price = formatPrice(p.monthly, cadence);
          return (
            <article
              key={p.id}
              className="zg-gate-note"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 24,
                borderColor: p.highlight ? "var(--terra)" : undefined,
                borderWidth: p.highlight ? 2 : 1,
                transform: p.highlight ? "translateY(-6px)" : undefined,
                boxShadow: p.highlight
                  ? "0 14px 40px -22px rgba(176,74,46,0.45)"
                  : undefined,
              }}
            >
              {p.badge ? (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 18,
                    background: "var(--terra)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  {p.badge}
                </div>
              ) : null}

              <div
                style={{
                  fontSize: 12,
                  opacity: 0.65,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                }}
              >
                {p.audience}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 600 }}>{p.name}</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>
                {p.tagline}
              </div>

              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>
                {price.main}
                <span
                  style={{
                    fontSize: 13,
                    opacity: 0.6,
                    fontWeight: 400,
                  }}
                >
                  {" "}
                  {price.sub}
                </span>
              </div>
              {p.monthly > 0 && cadence === "yearly" ? (
                <div style={{ fontSize: 12, opacity: 0.55 }}>
                  Soit {p.monthly * 12 - Math.round(p.monthly * (1 - ANNUAL_DISCOUNT)) * 12} € économisés par an.
                </div>
              ) : null}

              <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>{p.pitch}</p>

              <ul className="zg-list" style={{ marginTop: 8 }}>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <Link
                  to="/dashboard"
                  className={
                    p.highlight ? "zg-btn zg-btn-primary" : "zg-btn zg-btn-ghost"
                  }
                  style={{ width: "100%", textAlign: "center" }}
                >
                  {p.cta}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="zg-gate-note" style={{ marginTop: 32 }}>
        <strong>Vous hésitez entre deux profils ?</strong>
        <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
          Vous pouvez combiner deux offres (par exemple Élan + Dealflow) avec
          -15% sur la seconde, ou commencer par <em>Tremplin</em> gratuit pour
          explorer la plateforme. Les abonnements payants seront facturés
          uniquement après activation du paiement — vous serez prévenu(e) par
          email avant tout prélèvement.
        </p>
      </div>

      <div className="zg-actions" style={{ marginTop: 24 }}>
        <Link to="/dashboard" className="zg-btn zg-btn-primary">
          Accéder à mon espace
        </Link>
        <Link to="/" className="zg-btn zg-btn-ghost">
          Retour à l'accueil
        </Link>
      </div>
    </section>
  );
}
