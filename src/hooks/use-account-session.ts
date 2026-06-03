import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useSubscription } from "./use-subscription";
import { getPlan, type PlanId, PLANS } from "@/lib/pricing";

/**
 * Équivalent React des variables $_SESSION construites dans mgt_chk_cnx.php.
 * Agrège l'utilisateur Supabase, son profil, son abonnement et les modules
 * (md_net, md_terr, md_opp, ...) auxquels son plan donne accès.
 */

export type ModuleAccess = {
  md_net: boolean;
  md_terr: boolean;
  md_opp: boolean;
  md_bp: boolean;
  md_fin: boolean;
  md_prest: boolean;
  md_emploi: boolean;
  md_ass: boolean;
  md_inv: boolean;
  md_ao: boolean;
  md_dev: boolean;
};

export type AccountSession = {
  loading: boolean;
  // identité (équivalent userid / username / email / image)
  userid: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  // profil métier (équivalent id_profil / profil / statut / audience)
  profilid: string | null;
  profil: string | null;
  statut: string | null;
  audience: string | null;
  // territoire (équivalent id_pays_c / id_region_c / id_dep_c)
  pays: string | null;
  region: string | null;
  departement: string | null;
  ville: string | null;
  // abonnement (équivalent id_abon / abon / service)
  id_abon: PlanId | null;
  abon: string | null;
  abonStatus: string | null;
  abonPeriodEnd: string | null;
  // rôle (admin / membre)
  role: "admin" | "user" | null;
  // modules accessibles
  modules: ModuleAccess;
};

const EMPTY_MODULES: ModuleAccess = {
  md_net: false,
  md_terr: false,
  md_opp: false,
  md_bp: false,
  md_fin: false,
  md_prest: false,
  md_emploi: false,
  md_ass: false,
  md_inv: false,
  md_ao: false,
  md_dev: false,
};

/** Mapping plan -> modules accessibles (transposition des md_* PHP). */
function modulesForPlan(planId: PlanId | null, active: boolean): ModuleAccess {
  if (!planId || !active) return { ...EMPTY_MODULES, md_net: true }; // accès newsletter seul
  switch (planId) {
    case "demandeur":
      return { ...EMPTY_MODULES, md_net: true, md_terr: true, md_emploi: true };
    case "competence":
      return {
        ...EMPTY_MODULES,
        md_net: true,
        md_terr: true,
        md_opp: true,
        md_prest: true,
        md_ao: true,
      };
    case "porteur":
      return {
        ...EMPTY_MODULES,
        md_net: true,
        md_terr: true,
        md_opp: true,
        md_bp: true,
        md_fin: true,
        md_ass: true,
        md_dev: true,
      };
    case "investisseur":
      return {
        ...EMPTY_MODULES,
        md_net: true,
        md_terr: true,
        md_opp: true,
        md_inv: true,
        md_fin: true,
        md_dev: true,
      };
    default:
      return EMPTY_MODULES;
  }
}

export function useAccountSession(): AccountSession {
  const { user, loading: authLoading } = useAuth();
  const { subscription, isActive, loading: subLoading } = useSubscription();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setProfile(null);
        setRole(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setProfile((p as Record<string, unknown> | null) ?? null);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      setRole(isAdmin ? "admin" : user ? "user" : null);
      setProfileLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Déduit le planId depuis price_id Paddle si possible, sinon depuis profile.audience.
  let planId: PlanId | null = null;
  if (subscription) {
    // Heuristique simple : on essaie de retrouver le plan par son nom dans price_id.
    const lower = `${subscription.price_id} ${subscription.product_id}`.toLowerCase();
    const match = PLANS.find((p) => lower.includes(p.id) || lower.includes(p.name.toLowerCase()));
    if (match) planId = match.id;
  }
  if (!planId && profile?.audience) {
    const aud = String(profile.audience).toLowerCase();
    if (aud.includes("demand")) planId = "demandeur";
    else if (aud.includes("compet")) planId = "competence";
    else if (aud.includes("invest")) planId = "investisseur";
    else if (aud.includes("port") || aud.includes("entrep")) planId = "porteur";
  }

  const plan = planId ? getPlan(planId) : undefined;
  const modules = modulesForPlan(planId, isActive);

  const first = (profile?.first_name as string | null) ?? "";
  const last = (profile?.last_name as string | null) ?? "";
  const fullName = `${first} ${last}`.trim();

  return {
    loading: authLoading || subLoading || profileLoading,
    userid: user?.id ?? null,
    username: fullName || (user?.email?.split("@")[0] ?? null),
    email: user?.email ?? null,
    image: null,
    profilid: (profile?.profile as string | null) ?? null,
    profil: (profile?.profile as string | null) ?? null,
    statut: isActive ? "Membre actif" : user ? "Membre" : null,
    audience: (profile?.audience as string | null) ?? null,
    pays: (profile?.country as string | null) ?? null,
    region: (profile?.region as string | null) ?? null,
    departement: (profile?.department as string | null) ?? null,
    ville: (profile?.city as string | null) ?? null,
    id_abon: planId,
    abon: plan?.name ?? null,
    abonStatus: subscription?.status ?? null,
    abonPeriodEnd: subscription?.current_period_end ?? null,
    role,
    modules,
  };
}
