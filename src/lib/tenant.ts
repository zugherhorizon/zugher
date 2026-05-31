/**
 * Multi-tenant — résolution du territoire courant.
 *
 * Phase 0 : config statique « République de Valoria » (territoire de démo).
 * Phase suivantes : résolution dynamique par sous-domaine
 * (ex : valoria.zugher.com → tenant_id="valoria") + chargement depuis MySQL.
 */

export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  motto: string;
  flag: { left: string; center: string; right: string; letter: string };
  modules: string[]; // app codes activés (01..09)
}

export const VALORIA: TenantConfig = {
  id: "valoria",
  name: "République de Valoria",
  shortName: "Valoria",
  motto: "Terre de projets, terre d'avenir",
  flag: { left: "#b04a2e", center: "#fdfaf3", right: "#5e6b3a", letter: "V" },
  modules: ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
};

export function getCurrentTenant(): TenantConfig {
  return VALORIA;
}
