import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getCurrentTenant } from "@/lib/tenant";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { LanguageSwitcher } from "@/components/zugher/LanguageSwitcher";

type NavItem = { to: string; labelKey: string; fallback: string };
type NavGroup = { titleKey: string; titleFallback: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    titleKey: "nav.section.discover",
    titleFallback: "Découvrir",
    items: [
      { to: "/", labelKey: "nav.home", fallback: "Accueil" },
      { to: "/territoire", labelKey: "nav.territory", fallback: "Vitrine territoire" },
      { to: "/applications", labelKey: "nav.applications", fallback: "Applications SaaS" },
    ],
  },
  {
    titleKey: "nav.section.btoc",
    titleFallback: "Grand public · BtoC",
    items: [
      { to: "/opportunites", labelKey: "nav.opportunities", fallback: "Banque d'opportunités" },
      { to: "/business-plan", labelKey: "nav.business_plan", fallback: "Business Plan IA" },
      { to: "/parcours", labelKey: "nav.journey", fallback: "Parcours porteur" },
      { to: "/investisseurs", labelKey: "nav.investors", fallback: "Espace investisseurs" },
      { to: "/competences", labelKey: "nav.skills", fallback: "Espace compétences" },
    ],
  },
  {
    titleKey: "nav.section.btob",
    titleFallback: "Professionnel · BtoB",
    items: [
      { to: "/pro", labelKey: "nav.pro", fallback: "Offre Pro" },
      { to: "/dashboard", labelKey: "nav.dashboard", fallback: "Tableau de bord" },
    ],
  },
  {
    titleKey: "nav.section.join",
    titleFallback: "Nous rejoindre",
    items: [
      { to: "/inscription", labelKey: "nav.signup", fallback: "Créer un compte" },
      { to: "/connexion", labelKey: "nav.login", fallback: "Identifier" },
      { to: "/mon-compte", labelKey: "nav.account", fallback: "Mon compte" },
      { to: "/newsletter", labelKey: "nav.newsletter", fallback: "Newsletter" },
    ],
  },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tenant = getCurrentTenant();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  async function onLogout() {
    if (!window.confirm(t("auth.confirm_logout", "Confirmer la déconnexion ?"))) return;
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <>
      <div className="zg-mobile-bar">
        <span className="brand-mini">
          zugher<span className="dot">.</span>
        </span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? t("nav.close", "Fermer") : t("nav.menu", "Menu")}
        </button>
      </div>

      <aside className={`zg-sidebar${open ? " open" : ""}`}>
        <div className="zg-brand">
          <span className="zg-brand-mark">
            zugher<span className="dot">.</span>
          </span>
        </div>
        <div className="zg-brand-sub">{t("nav.brand_sub")}</div>

        <LanguageSwitcher />

        <div className="zg-tenant-badge">
          <div className="label">{t("nav.active_territory")}</div>
          <div className="name">{tenant.name}</div>
        </div>

        {groups.map((g) => (
          <div key={g.titleKey}>
            <div className="zg-nav-section">{t(g.titleKey, g.titleFallback)}</div>
            {g.items.map((it) => {
              const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
              return (
                <Link
                  key={`${it.to}-${it.labelKey}`}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={`zg-nav-item${active ? " active" : ""}`}
                >
                  {t(it.labelKey, it.fallback)}
                </Link>
              );
            })}
          </div>
        ))}

        <div
          style={{
            margin: "16px 12px 0",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            fontSize: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: loading
                  ? "rgb(156,163,175)"
                  : user
                    ? "rgb(34,197,94)"
                    : "rgb(239,68,68)",
              }}
            />
            <span style={{ fontWeight: 600 }}>
              {loading
                ? t("auth.checking", "Vérification…")
                : user
                  ? t("auth.connected", "Connecté")
                  : t("auth.disconnected", "Déconnecté")}
            </span>
          </div>
          {user && (
            <>
              <div style={{ opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  marginTop: 4,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "transparent",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {t("auth.logout", "Se déconnecter")}
              </button>
            </>
          )}
        </div>

        <div className="zg-sidebar-footer">
          {t("footer.instance", `Instance ${tenant.shortName} · v2.0`)}
          <br />
          {t("footer.rgpd", "RGPD compliant · 2026")}
        </div>
      </aside>
    </>
  );
}
