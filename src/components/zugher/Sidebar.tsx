import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { getCurrentTenant } from "@/lib/tenant";

type NavItem = { to: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "Découvrir",
    items: [
      { to: "/", label: "Accueil" },
      { to: "/territoire", label: "Vitrine territoire" },
      { to: "/applications", label: "Applications SaaS" },
    ],
  },
  {
    title: "Grand public · BtoC",
    items: [
      { to: "/opportunites", label: "Banque d'opportunités" },
      { to: "/business-plan", label: "Business Plan IA" },
      { to: "/parcours", label: "Parcours porteur" },
      { to: "/investisseurs", label: "Espace investisseurs" },
      { to: "/competences", label: "Espace compétences" },
    ],
  },
  {
    title: "Professionnel · BtoB",
    items: [
      { to: "/pro", label: "Offre Pro" },
      { to: "/dashboard", label: "Tableau de bord" },
    ],
  },
  {
    title: "Nous rejoindre",
    items: [
      { to: "/inscription", label: "Créer un compte" },
      { to: "/newsletter", label: "Newsletter" },
    ],
  },
];


export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tenant = getCurrentTenant();

  return (
    <>
      <div className="zg-mobile-bar">
        <span className="brand-mini">
          zugher<span className="dot">.</span>
        </span>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? "Fermer" : "Menu"}
        </button>
      </div>

      <aside className={`zg-sidebar${open ? " open" : ""}`}>
        <div className="zg-brand">
          <span className="zg-brand-mark">
            zugher<span className="dot">.</span>
          </span>
        </div>
        <div className="zg-brand-sub">place de marché de territoires</div>

        <div className="zg-tenant-badge">
          <div className="label">Territoire actif</div>
          <div className="name">{tenant.name}</div>
        </div>

        {groups.map((g) => (
          <div key={g.title}>
            <div className="zg-nav-section">{g.title}</div>
            {g.items.map((it) => {
              const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={`zg-nav-item${active ? " active" : ""}`}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="zg-sidebar-footer">
          Instance {tenant.shortName} · v2.0
          <br />
          RGPD compliant · 2026
        </div>
      </aside>
    </>
  );
}
