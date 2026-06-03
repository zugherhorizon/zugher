import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "./use-auth";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const env = getPaddleEnvironment();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSubscription((data as SubscriptionRow | null) ?? null);
        setLoading(false);
      }
    }
    load();

    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, env]);

  const isActive =
    !!subscription &&
    ((["active", "trialing", "past_due"].includes(subscription.status) &&
      (!subscription.current_period_end ||
        new Date(subscription.current_period_end) > new Date())) ||
      (subscription.status === "canceled" &&
        subscription.current_period_end !== null &&
        new Date(subscription.current_period_end) > new Date()));

  return { subscription, loading, isActive, environment: env };
}
