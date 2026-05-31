import { createFileRoute } from "@tanstack/react-router";
import { getCurrentTenant } from "@/lib/tenant";

export const Route = createFileRoute("/territoire")({
  head: () => ({ meta: [{ title: "Vitrine territoire — zugher." }] }),
  component: Territoire,
});

function Territoire() {
  const t = getCurrentTenant();
  return (
    <>
      <section className="zg-territory-hero">
        <div className="zg-territory-flag">
          <div style={{ background: t.flag.left }} />
          <div style={{ background: t.flag.center, color: "#2c5871" }}>{t.flag.letter}</div>
          <div style={{ background: t.flag.right }} />
        </div>
        <div className="zg-eyebrow" style={{ color: "var(--sun)" }}>
          Territoire pilote · Édition 2026
        </div>
        <h1>
          <em>{t.name}</em>
          <br />
          terre de projets, terre d'avenir.
        </h1>
        <p className="zg-motto">« {t.motto} »</p>
      </section>

      <section className="zg-section">
        <div className="zg-section-head">
          <div>
            <div className="zg-section-eyebrow">§ Phase 1 · à venir</div>
            <h2 className="zg-h2">
              Indicateurs, sous-territoires, secteurs et <em>actualités</em>.
            </h2>
          </div>
          <div className="zg-section-aside">
            Cette vitrine sera alimentée par la base MySQL legacy (tables tcomagglo, tregions,
            tsecteurs, tnews) une fois la connexion établie en Phase 1.
          </div>
        </div>
      </section>
    </>
  );
}
