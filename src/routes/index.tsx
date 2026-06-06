import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrentTenant } from "@/lib/tenant";
import { useI18n } from "@/i18n";

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
  { num: "01", to: "/territoire", nameKey: "app.01.name", descKey: "app.01.desc" },
  { num: "02", to: "/opportunites", nameKey: "app.02.name", descKey: "app.02.desc" },
  { num: "03", to: "/parcours", nameKey: "app.03.name", descKey: "app.03.desc" },
  { num: "04", to: "/applications", nameKey: "app.04.name", descKey: "app.04.desc" },
  { num: "05", to: "/parcours", nameKey: "app.05.name", descKey: "app.05.desc" },
  { num: "06", to: "/applications", nameKey: "app.06.name", descKey: "app.06.desc" },
  { num: "07", to: "/applications", nameKey: "app.07.name", descKey: "app.07.desc" },
  { num: "08", to: "/pro", nameKey: "app.08.name", descKey: "app.08.desc" },
  { num: "09", to: "/applications", nameKey: "app.09.name", descKey: "app.09.desc" },
] as const;

function Accueil() {
  const tenant = getCurrentTenant();
  const { t } = useI18n();
  return (
    <>
      <section className="zg-hero">
        <div className="zg-eyebrow">{t("home.eyebrow")}</div>
        <h1
          className="zg-h1"
          dangerouslySetInnerHTML={{ __html: t("home.h1") }}
        />
        <p className="zg-lead">{t("home.lead")}</p>
        <div className="zg-actions">
          <Link to="/territoire" className="zg-btn zg-btn-primary">
            {t("home.cta_discover").replace("Valoria", tenant.shortName)}
          </Link>
          <Link to="/applications" className="zg-btn zg-btn-ghost">
            {t("home.cta_apps")}
          </Link>
        </div>

        <div className="zg-stat-strip">
          <div className="zg-stat">
            <span className="zg-stat-value">9</span>
            <div className="zg-stat-label">{t("home.stat_apps")}</div>
          </div>
          <div className="zg-stat">
            <span className="zg-stat-value">6</span>
            <div className="zg-stat-label">{t("home.stat_langs")}</div>
          </div>
          <div className="zg-stat">
            <span className="zg-stat-value">2</span>
            <div className="zg-stat-label">{t("home.stat_segments")}</div>
          </div>
          <div className="zg-stat">
            <span className="zg-stat-value">∞</span>
            <div className="zg-stat-label">{t("home.stat_territories")}</div>
          </div>
        </div>
      </section>

      <section className="zg-section">
        <div className="zg-section-head">
          <div>
            <div className="zg-section-eyebrow">{t("home.apps.eyebrow")}</div>
            <h2
              className="zg-h2"
              dangerouslySetInnerHTML={{ __html: t("home.apps.h2") }}
            />
          </div>
          <div className="zg-section-aside">{t("home.apps.aside")}</div>
        </div>

        <div className="zg-saas-grid">
          {apps.map((a) => (
            <Link key={a.num} to={a.to} className="zg-saas-card">
              <span className="zg-saas-num">app · {a.num}</span>
              <div className="zg-saas-name">{t(a.nameKey)}</div>
              <div className="zg-saas-desc">{t(a.descKey)}</div>
              <div className="zg-saas-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="zg-section">
        <div className="zg-section-head">
          <div>
            <div className="zg-section-eyebrow">{t("home.seg.eyebrow")}</div>
            <h2
              className="zg-h2"
              dangerouslySetInnerHTML={{ __html: t("home.seg.h2") }}
            />
          </div>
          <div className="zg-section-aside">{t("home.seg.aside")}</div>
        </div>

        <div className="zg-segments">
          <div className="zg-segment-card btoc">
            <div className="zg-segment-tag">{t("home.btoc.tag")}</div>
            <h3>{t("home.btoc.title")}</h3>
            <p className="channel">{t("home.btoc.channel")}</p>
            <ul className="zg-segment-list">
              <li><span>Porteurs de projets, entrepreneurs, PME</span><span className="arrow">→</span></li>
              <li><span>Investisseurs privés particuliers</span><span className="arrow">→</span></li>
              <li><span>Compétences : freelancers, consultants</span><span className="arrow">→</span></li>
              <li><span>Demandeurs d'emploi qualifiés</span><span className="arrow">→</span></li>
            </ul>
          </div>

          <div className="zg-segment-card btob">
            <div className="zg-segment-tag">{t("home.btob.tag")}</div>
            <h3>{t("home.btob.title")}</h3>
            <p className="channel">{t("home.btob.channel")}</p>
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
          <h3>{t("home.ai.title")}</h3>
          <p>{t("home.ai.lead")}</p>
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

      <section className="zg-section" aria-label="Mentions légales">
        <div className="zg-ai-block" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", margin: 0 }}>
            <strong>zugher.com</strong> est un service proposé par{" "}
            <strong>Factory.AI</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
