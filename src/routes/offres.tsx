import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ANNUAL_DISCOUNT,
  type Cadence,
  formatPriceLabel,
  PLANS,
  type PlanId,
  yearlySavings,
} from "@/lib/pricing";
import { prepareCheckout } from "@/lib/checkout.functions";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { useAuth } from "@/hooks/use-auth";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

/** Mapping planId interne → product Paddle (suffixes _monthly / _yearly). */
const PLAN_TO_PADDLE_PRODUCT: Partial<Record<PlanId, string>> = {
  competence: "expertise",
  porteur: "elan",
  investisseur: "dealflow",
};

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

function OffresPage() {
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prepare = useServerFn(prepareCheckout);

  const subtitle = useMemo(
    () =>
      cadence === "yearly"
        ? `Tarifs annuels avec -${Math.round(ANNUAL_DISCOUNT * 100)}% appliqué. Engagement 12 mois, sans renouvellement automatique surprise.`
        : "Tarifs mensuels sans engagement. Modifiable ou résiliable à tout moment.",
    [cadence],
  );

  const handleSubscribe = async (planId: PlanId) => {
    setError(null);
    setPendingPlan(planId);
    try {
      const result = await prepare({ data: { planId, cadence } });
      if (result.status === "free") {
        // Plan gratuit : on bascule directement dans l'espace.
        window.location.assign("/dashboard");
        return;
      }
      // TODO: brancher la redirection vers la session Stripe/Paddle ici
      // dès que le provider de paiement sera activé. Pour l'instant on
      // confirme à l'utilisateur le prix verrouillé côté serveur.
      console.info("Checkout préparé", result);
      window.location.assign(
        `/dashboard?checkout=${result.planId}&cadence=${result.cadence}&amount=${result.unitAmountCents}`,
      );
    } catch (e) {
      console.error(e);
      setError(
        "Impossible de préparer le paiement pour le moment. Réessayez dans un instant.",
      );
    } finally {
      setPendingPlan(null);
    }
  };

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
          style={{ padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer" }}
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
            −{Math.round(ANNUAL_DISCOUNT * 100)}%
          </span>
        </button>
      </div>
      <p style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>{subtitle}</p>

      {error ? (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            border: "1px solid var(--terra)",
            borderRadius: 8,
            color: "var(--terra-deep)",
            background: "rgba(176,74,46,0.06)",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

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
          const price = formatPriceLabel(p, cadence);
          const savings = yearlySavings(p);
          const isPending = pendingPlan === p.id;
          const isFree = p.monthlyPrice === 0;
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
                <span style={{ fontSize: 13, opacity: 0.6, fontWeight: 400 }}>
                  {" "}
                  {price.sub}
                </span>
              </div>
              {!isFree && cadence === "yearly" ? (
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Soit {p.monthlyPrice * 12} € → {p.monthlyPrice * 12 - savings} € / an
                  {" "}· <strong>{savings} € économisés</strong>
                </div>
              ) : null}

              <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>{p.pitch}</p>

              <ul className="zg-list" style={{ marginTop: 8 }}>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              <div style={{ marginTop: "auto", paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => handleSubscribe(p.id)}
                  disabled={isPending}
                  className={
                    p.highlight ? "zg-btn zg-btn-primary" : "zg-btn zg-btn-ghost"
                  }
                  style={{
                    width: "100%",
                    textAlign: "center",
                    cursor: isPending ? "wait" : "pointer",
                    opacity: isPending ? 0.7 : 1,
                  }}
                >
                  {isPending
                    ? "Préparation…"
                    : isFree
                      ? `Activer ${p.name}`
                      : `Choisir ${p.name}`}
                </button>
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
