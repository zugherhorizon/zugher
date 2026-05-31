import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/business-plan")({
  head: () => ({
    meta: [
      { title: "Business Plan IA — zugher." },
      {
        name: "description",
        content:
          "Le générateur de Business Plan IA est réservé aux clients abonnés zugher, après complétion du parcours de données obligatoire.",
      },
    ],
  }),
  component: BusinessPlanGate,
});

function BusinessPlanGate() {
  return (
    <section className="zg-stub" style={{ maxWidth: 880 }}>
      <div className="zg-stub-tag">Application · Business Plan IA</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
        Accès <em>réservé</em> aux abonnés zugher.
      </h1>
      <p className="zg-lead">
        Le générateur de Business Plan IA n'est accessible qu'après deux étapes&nbsp;:
      </p>

      <ol className="zg-gate-steps">
        <li>
          <strong>1. Compléter et construire les données zugher</strong> — profil porteur,
          territoire, marché, hypothèses économiques et financières exigées par notre méthodologie.
          Sans ce socle, l'IA ne produit pas un BP fiable.
        </li>
        <li>
          <strong>2. Être abonné</strong> — l'outil s'active depuis votre <em>espace privé</em>,
          dans l'offre incluant le module Business Plan IA.
        </li>
      </ol>

      <div className="zg-gate-note">
        <strong>Pourquoi&nbsp;?</strong> zugher s'engage sur la qualité des livrables. Un BP généré
        sur des données incomplètes n'a aucune valeur auprès d'un investisseur ou d'un financeur.
        Nous imposons donc le parcours data avant toute génération.
      </div>

      <div className="zg-actions" style={{ marginTop: 28 }}>
        <Link to="/dashboard" className="zg-btn zg-btn-primary">
          Accéder à mon espace privé
        </Link>
        <Link to="/applications" className="zg-btn zg-btn-ghost">
          Voir les offres d'abonnement
        </Link>
        <Link to="/" className="zg-btn zg-btn-ghost">
          Retour à l'accueil
        </Link>
      </div>

      <p className="zg-help" style={{ marginTop: 24 }}>
        Une fois connecté et vos données zugher validées, le générateur s'ouvre automatiquement
        depuis votre tableau de bord.
      </p>
    </section>
  );
}
