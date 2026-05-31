import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrentTenant } from "@/lib/tenant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "zugher. — place de marché de territoires" },
      {
        name: "description",
        content:
          "Socle SaaS multi-tenant qui permet à tout territoire de structurer et activer son développement économique avec l'intelligence artificielle.",
      },
    ],
  }),
  component: Accueil,
});

const apps = [
  { num: "01", to: "/territoire", name: "Promotion territoire", desc: "Vitrine du territoire et de ses sous-territoires : pays, régions, secteurs, collectivités." },
  { num: "02", to: "/opportunites", name: "Banque d'opportunités", desc: "Catalogue d'opportunités de projets qualifiées par territoire et par secteur." },
  { num: "03", to: "/parcours", name: "Bilan de compétence", desc: "Évaluation du porteur, identification des forces et besoins d'accompagnement." },
  { num: "04", to: "/applications", name: "Networking", desc: "Mise en relation qualifiée entre porteurs, investisseurs, prestataires et institutions." },
  { num: "05", to: "/parcours", name: "Business Plan", desc: "Génération assistée par IA, communicable aux partenaires et investisseurs." },
  { num: "06", to: "/applications", name: "Crowdfunding & Financement", desc: "Levée participative et mise en relation avec les institutions financières." },
  { num: "07", to: "/applications", name: "Recrutement", desc: "Publication d'offres, vivier de candidats, matching propulsé par IA." },
  { num: "08", to: "/pro", name: "Business Développement", desc: "Outils commerciaux pour grand public, professionnel et marché public." },
  { num: "09", to: "/applications", name: "Appels d'offres", desc: "Gestion des appels d'offres publics et privés : publication, candidature, suivi." },
];

function Accueil() {
  const tenant = getCurrentTenant();
  return (
    <>
      <section className="zg-hero">
        <div className="zg-eyebrow">Plateforme générique · Édition 2026</div>
        <h1 className="zg-h1">
          Une <em>place de marché</em> au service du <em>développement</em> des territoires.
        </h1>
        <p className="zg-lead">
          zugher.com est un socle SaaS multi-tenant qui permet à tout territoire — pays, région,
          collectivité, secteur ou écosystème — de structurer et activer son développement
          économique avec l'aide de l'intelligence artificielle.
        </p>
        <div className="zg-actions">
          <Link to="/territoire" className="zg-btn zg-btn-primary">
            Découvrir {tenant.shortName}, territoire pilote →
          </Link>
          <Link to="/applications" className="zg-btn zg-btn-ghost">
            Voir les 9 applications
          </Link>
        </div>

        <div className="zg-stat-strip">
          <div className="zg-stat">
            <span className="zg-stat-value">9</span>
            <div className="zg-stat-label">applications SaaS</div>
          </div>
          <div className="zg-stat">
            <span className="zg-stat-value">6</span>
            <div className="zg-stat-label">langues natives</div>
          </div>
          <div className="zg-stat">
            <span className="zg-stat-value">2</span>
            <div className="zg-stat-label">segments commerciaux</div>
          </div>
          <div className="zg-stat">
            <span className="zg-stat-value">∞</span>
            <div className="zg-stat-label">territoires possibles</div>
          </div>
        </div>
      </section>

      <section className="zg-section">
        <div className="zg-section-head">
          <div>
            <div className="zg-section-eyebrow">§2 · Architecture fonctionnelle</div>
            <h2 className="zg-h2">
              Neuf applications, <em>une seule plateforme</em>.
            </h2>
          </div>
          <div className="zg-section-aside">
            Chaque territoire active les modules qui lui correspondent. Le socle est mutualisé, la
            personnalisation se fait par un simple fichier de configuration.
          </div>
        </div>

        <div className="zg-saas-grid">
          {apps.map((a) => (
            <Link key={a.num} to={a.to} className="zg-saas-card">
              <span className="zg-saas-num">app · {a.num}</span>
              <div className="zg-saas-name">{a.name}</div>
              <div className="zg-saas-desc">{a.desc}</div>
              <div className="zg-saas-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="zg-section">
        <div className="zg-section-head">
          <div>
            <div className="zg-section-eyebrow">§3 · Segmentation</div>
            <h2 className="zg-h2">
              Deux <em>publics</em>, deux <em>parcours</em>.
            </h2>
          </div>
          <div className="zg-section-aside">
            Le grand public accède en self-service avec pricing affiché. Le segment professionnel
            passe par une commercialisation directe et reçoit une instance personnalisée.
          </div>
        </div>

        <div className="zg-segments">
          <div className="zg-segment-card btoc">
            <div className="zg-segment-tag">BtoC · self-service en ligne</div>
            <h3>Grand public</h3>
            <p className="channel">Inscription guidée, pricing transparent</p>
            <ul className="zg-segment-list">
              <li><span>Porteurs de projets, entrepreneurs, PME</span><span className="arrow">→</span></li>
              <li><span>Investisseurs privés particuliers</span><span className="arrow">→</span></li>
              <li><span>Compétences : freelancers, consultants</span><span className="arrow">→</span></li>
              <li><span>Demandeurs d'emploi qualifiés</span><span className="arrow">→</span></li>
            </ul>
          </div>

          <div className="zg-segment-card btob">
            <div className="zg-segment-tag">BtoB · commercialisation one-to-one</div>
            <h3>Professionnel</h3>
            <p className="channel">Cotation, accès privé, instance dédiée</p>
            <ul className="zg-segment-list">
              <li><span>Agences publiques de développement</span><span className="arrow">→</span></li>
              <li><span>Associations professionnelles</span><span className="arrow">→</span></li>
              <li><span>Banques, fonds, capital-risque</span><span className="arrow">→</span></li>
              <li><span>Cabinets de prestation de services</span><span className="arrow">→</span></li>
              <li><span>Écoles et universités</span><span className="arrow">→</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="zg-section">
        <div className="zg-ai-block">
          <h3>L'intelligence artificielle, intégrée nativement au parcours.</h3>
          <p>
            L'IA n'est pas un module annexe : elle traverse toute la plateforme, du matching jusqu'à
            la génération de business plans, du scoring d'opportunités à l'aide rédactionnelle.
          </p>
          <div className="zg-ai-cases">
            <div className="zg-ai-case"><strong>Génération assistée</strong><span>Business plans et études de marché à partir d'un questionnaire guidé.</span></div>
            <div className="zg-ai-case"><strong>Matching qualifié</strong><span>Porteur ↔ investisseur ↔ prestataire selon critères, secteurs et géographie.</span></div>
            <div className="zg-ai-case"><strong>Scoring & alertes</strong><span>Évaluation des opportunités pour les institutions financières.</span></div>
            <div className="zg-ai-case"><strong>Chatbot multilingue</strong><span>Orientation et support utilisateur dans les 6 langues natives.</span></div>
            <div className="zg-ai-case"><strong>Extraction documentaire</strong><span>OCR et classification automatique des pièces justificatives.</span></div>
            <div className="zg-ai-case"><strong>Anti-fraude</strong><span>Détection d'anomalies sur les projets et profils publiés.</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
