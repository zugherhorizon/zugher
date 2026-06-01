// Centralised pricing for the public subscription plans.
// Used by the UI (toggle Mensuel/Annuel) AND by the checkout server function
// so the price displayed and the price charged stay in sync.

export type Cadence = "monthly" | "yearly";

export type PlanId = "demandeur" | "competence" | "porteur" | "investisseur";

export type Plan = {
  id: PlanId;
  audience: string;
  name: string;
  tagline: string;
  /** Reference monthly price in EUR (no discount). 0 = gratuit. */
  monthlyPrice: number;
  pitch: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
};

/** Remise appliquée quand l'utilisateur choisit la facturation annuelle. */
export const ANNUAL_DISCOUNT = 0.2;

export const PLANS: Plan[] = [
  {
    id: "demandeur",
    audience: "Demandeur d'emploi",
    name: "Tremplin",
    tagline: "Gratuit, sur justificatif",
    monthlyPrice: 0,
    pitch:
      "Accédez aux opportunités du territoire et reconnectez-vous à l'écosystème local.",
    features: [
      "Place de marché du territoire choisi",
      "Alertes emploi & missions courtes",
      "Mise en relation avec les structures locales",
      "Newsletter mensuelle territoriale",
    ],
  },
  {
    id: "competence",
    audience: "Compétence",
    name: "Expertise",
    tagline: "Pour freelances, mentors, experts",
    monthlyPrice: 12,
    pitch:
      "Proposez vos compétences aux porteurs de projets et aux entreprises du territoire.",
    features: [
      "Profil compétence référencé",
      "Alertes missions ciblées (secteur, montant, zone)",
      "Accès aux briefs de projets en recherche",
      "Historique complet des opportunités",
    ],
  },
  {
    id: "porteur",
    audience: "Porteur de projet",
    name: "Élan",
    tagline: "Le plus choisi",
    monthlyPrice: 19,
    pitch:
      "Donnez de la visibilité à votre projet, trouvez vos premiers soutiens et financements.",
    features: [
      "Fiche projet enrichie & visibilité prioritaire",
      "Mise en relation investisseurs & mentors",
      "Suivi des marques d'intérêt en temps réel",
      "Accompagnement méthodologique (guides + replays)",
      "Alertes financements publics / privés",
    ],
    highlight: true,
    badge: "Recommandé",
  },
  {
    id: "investisseur",
    audience: "Investisseur",
    name: "Dealflow",
    tagline: "Pour investir intelligemment",
    monthlyPrice: 39,
    pitch:
      "Accédez en avance aux projets, comparez-les, échangez directement avec les porteurs.",
    features: [
      "Accès anticipé aux nouvelles opportunités",
      "Indicateurs de performance territoriaux",
      "Dossiers détaillés & data room sécurisée",
      "Échanges directs avec les porteurs",
      "Export & suivi de portefeuille",
    ],
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Prix mensuel effectif (arrondi €) en fonction de la cadence. */
export function effectiveMonthlyPrice(plan: Plan, cadence: Cadence): number {
  if (plan.monthlyPrice === 0) return 0;
  if (cadence === "monthly") return plan.monthlyPrice;
  return Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT));
}

/** Montant total débité pour un cycle de facturation. */
export function billingAmount(plan: Plan, cadence: Cadence): number {
  const monthly = effectiveMonthlyPrice(plan, cadence);
  return cadence === "yearly" ? monthly * 12 : monthly;
}

/** Économie annuelle (€) versus 12 mois de paiement mensuel. */
export function yearlySavings(plan: Plan): number {
  if (plan.monthlyPrice === 0) return 0;
  return (
    plan.monthlyPrice * 12 -
    Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT)) * 12
  );
}

/** Représentation prête à l'affichage. */
export function formatPriceLabel(
  plan: Plan,
  cadence: Cadence,
): { main: string; sub: string } {
  if (plan.monthlyPrice === 0) return { main: "0 €", sub: "à vie" };
  const monthly = effectiveMonthlyPrice(plan, cadence);
  return {
    main: `${monthly} €`,
    sub: cadence === "yearly" ? "/ mois · facturé annuellement" : "/ mois",
  };
}

/**
 * Résout le prix exact à facturer pour un (planId, cadence).
 * Utilisé côté serveur lors de la création de la session de paiement
 * pour empêcher la manipulation du prix depuis le client.
 */
export function resolveCheckoutPrice(
  planId: PlanId,
  cadence: Cadence,
): {
  planId: PlanId;
  planName: string;
  cadence: Cadence;
  currency: "EUR";
  unitAmountCents: number; // montant débité par cycle, en centimes
  intervalMonths: number;
} | null {
  const plan = getPlan(planId);
  if (!plan) return null;
  if (plan.monthlyPrice === 0) return null; // pas de paiement requis
  const amount = billingAmount(plan, cadence);
  return {
    planId,
    planName: plan.name,
    cadence,
    currency: "EUR",
    unitAmountCents: amount * 100,
    intervalMonths: cadence === "yearly" ? 12 : 1,
  };
}
