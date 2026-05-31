import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  email_verification_timeout_minutes: number;
};

const DEFAULTS: SiteSettings = {
  email_verification_timeout_minutes: 5,
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase
      .from("site_settings")
      .select("email_verification_timeout_minutes")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        if (data) setSettings({ email_verification_timeout_minutes: data.email_verification_timeout_minutes });
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { settings, loading };
}

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (alive) { setIsAdmin(false); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (alive) { setIsAdmin(!!data); setLoading(false); }
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check());
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  return { isAdmin, loading };
}
