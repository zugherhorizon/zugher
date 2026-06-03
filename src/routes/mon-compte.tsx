import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/zugher/RequireAuth";
import { useAccountSession, type ModuleAccess } from "@/hooks/use-account-session";
import { SubscriptionPanel } from "@/components/zugher/SubscriptionPanel";

export const Route = createFileRoute("/mon-compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — zugher." },
      {
        name: "description",
        content:
          "Tableau de bord personnel zugher : profil, abonnement et modules accessibles.",
      },
    ],
  }),
  component: MonComptePage,
});

const MODULES: Array<{ key: keyof ModuleAccess; label: string; to?: string }> = [
  { key: "md_net", label: "Réseau & newsletter", to: "/newsletter" },
  { key: "md_terr", label: "Vitrine territoire", to: "/territoire" },
  { key: "md_opp", label: "Banque d'opportunités", to: "/opportunites" },
  { key: "md_bp", label: "Business Plan IA", to: "/business-plan" },
  { key: "md_fin", label: "Financements", to: "/investisseurs" },
  { key: "md_prest", label: "Prestataires", to: "/applications" },
  { key: "md_emploi", label: "Emploi & missions", to: "/parcours" },
  { key: "md_ass", label: "Accompagnement", to: "/parcours" },
  { key: "md_inv", label: "Dealflow investisseur", to: "/investisseurs" },
  { key: "md_ao", label: "Appels d'offres", to: "/opportunites" },
  { key: "md_dev", label: "Développement BtoB", to: "/pro" },
];

function MonComptePage() {
  return (
    <RequireAuth reason="L'espace « Mon compte » est réservé aux membres connectés.">
      <Content />
    </RequireAuth>
  );
}

function Content() {
  const s = useAccountSession();

  if (s.loading) {
    return (
      <section className="zg-stub" style={{ maxWidth: 960 }}>
        <p className="zg-lead">Chargement de votre espace…</p>
      </section>
    );
  }

  return (
    <section className="zg-stub" style={{ maxWidth: 1040 }}>
      <div className="zg-stub-tag">Espace membre</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
        Bonjour <em>{s.username ?? "membre"}</em>.
      </h1>
      <p className="zg-lead">
        {s.profil ? `Profil ${s.profil}` : "Profil zugher"}
        {s.statut ? ` · ${s.statut}` : ""}
        {s.abon ? ` · Abonnement ${s.abon}` : ""}
      </p>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <Card title="Identité">
          <Row label="E-mail" value={s.email} />
          <Row label="Profil métier" value={s.profil} />
          <Row label="Audience" value={s.audience} />
          <Row label="Rôle" value={s.role === "admin" ? "Administrateur" : "Membre"} />
        </Card>

        <Card title="Territoire">
          <Row label="Pays" value={s.pays} />
          <Row label="Région" value={s.region} />
          <Row label="Département" value={s.departement} />
          <Row label="Ville" value={s.ville} />
        </Card>

        <Card title="Abonnement">
          <Row label="Plan" value={s.abon ?? "—"} />
          <Row label="Statut" value={s.abonStatus ?? "Aucun"} />
          <Row
            label="Période en cours jusqu'au"
            value={
              s.abonPeriodEnd
                ? new Date(s.abonPeriodEnd).toLocaleDateString("fr-FR")
                : "—"
            }
          />
        </Card>
      </div>

      <h2 style={{ marginTop: 40, fontSize: 22, fontWeight: 700 }}>
        Modules accessibles
      </h2>
      <p className="zg-lead" style={{ marginTop: 6 }}>
        Selon votre abonnement{s.abon ? ` « ${s.abon} »` : ""}.
      </p>
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {MODULES.map((m) => {
          const enabled = s.modules[m.key];
          const inner = (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${enabled ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)"}`,
                background: enabled ? "rgba(34,197,94,0.06)" : "transparent",
                opacity: enabled ? 1 : 0.45,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {enabled ? "✓ Actif" : "—"}
              </span>
            </div>
          );
          return enabled && m.to ? (
            <Link key={m.key} to={m.to} style={{ textDecoration: "none", color: "inherit" }}>
              {inner}
            </Link>
          ) : (
            <div key={m.key}>{inner}</div>
          );
        })}
      </div>

      <div style={{ marginTop: 40 }}>
        <SubscriptionPanel />
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(255,255,255,0.4)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.6, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}
