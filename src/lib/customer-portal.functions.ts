import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, type PaddleEnv } from "./paddle.server";

export const createCustomerPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: sub, error } = await admin
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id, environment")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!sub?.paddle_customer_id) {
      throw new Error("Aucun abonnement trouvé pour cet utilisateur.");
    }

    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id] : [],
    );

    const subscriptionUrl = session.urls.subscriptions?.[0];
    return {
      overviewUrl: session.urls.general.overview,
      cancelUrl: subscriptionUrl?.cancelSubscription ?? null,
      updatePaymentUrl: subscriptionUrl?.updateSubscriptionPaymentMethod ?? null,
    };
  });
