import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  dispatchPaddleEvent,
  type SubscriptionsWriter,
} from "./paddle-webhook-handlers";
import type { PaddleEnv } from "./paddle.server";

export type SimulatorAction =
  | "cancel"
  | "pause"
  | "resume"
  | "switch_to_expertise"
  | "switch_to_elan"
  | "switch_to_dealflow"
  | "switch_yearly"
  | "switch_monthly";

const PLAN_PRODUCTS: Record<string, string> = {
  expertise: "Expertise",
  elan: "Élan",
  dealflow: "Dealflow",
};

/**
 * Simulates a Paddle webhook on the current user's most recent SANDBOX
 * subscription row. Used to verify the realtime UI sync end-to-end without
 * waiting for a real Paddle event.
 *
 * Hard-gated: refuses to run against the live environment.
 */
export const simulatePaddleEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { action: SimulatorAction; environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    if (data.environment !== "sandbox") {
      throw new Error("Le simulateur n'est disponible qu'en environnement de test.");
    }
    const { userId } = context;
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: sub, error } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", "sandbox")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!sub) {
      throw new Error(
        "Aucun abonnement de test trouvé. Souscrivez d'abord une offre depuis /offres.",
      );
    }

    const now = new Date();
    const periodEnd =
      (sub.current_period_end && new Date(sub.current_period_end)) ||
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextPeriodEnd = new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

    const baseItem = (productId: string, priceId: string) => ({
      price: { id: "pri_sim", importMeta: { externalId: priceId } },
      product: { id: "pro_sim", importMeta: { externalId: productId } },
    });

    let event: { eventType: string; data: any };

    switch (data.action) {
      case "cancel":
        event = {
          eventType: "subscription.updated",
          data: {
            id: sub.paddle_subscription_id,
            status: sub.status,
            currentBillingPeriod: {
              startsAt: sub.current_period_start,
              endsAt: sub.current_period_end,
            },
            scheduledChange: {
              action: "cancel",
              effectiveAt: sub.current_period_end,
            },
            items: [baseItem(sub.product_id, sub.price_id)],
          },
        };
        break;
      case "pause":
        event = {
          eventType: "subscription.paused",
          data: {
            id: sub.paddle_subscription_id,
            status: "paused",
            currentBillingPeriod: {
              startsAt: sub.current_period_start,
              endsAt: sub.current_period_end,
            },
            scheduledChange: null,
            items: [baseItem(sub.product_id, sub.price_id)],
          },
        };
        break;
      case "resume":
        event = {
          eventType: "subscription.resumed",
          data: {
            id: sub.paddle_subscription_id,
            status: "active",
            currentBillingPeriod: {
              startsAt: now.toISOString(),
              endsAt: nextPeriodEnd.toISOString(),
            },
            scheduledChange: null,
            items: [baseItem(sub.product_id, sub.price_id)],
          },
        };
        break;
      case "switch_to_expertise":
      case "switch_to_elan":
      case "switch_to_dealflow": {
        const productId = data.action.replace("switch_to_", "");
        const cadence = sub.price_id?.endsWith("_yearly") ? "yearly" : "monthly";
        const priceId = `${productId}_${cadence}`;
        if (!PLAN_PRODUCTS[productId]) {
          throw new Error("Plan inconnu.");
        }
        event = {
          eventType: "subscription.updated",
          data: {
            id: sub.paddle_subscription_id,
            status: "active",
            currentBillingPeriod: {
              startsAt: sub.current_period_start,
              endsAt: sub.current_period_end,
            },
            scheduledChange: null,
            items: [baseItem(productId, priceId)],
          },
        };
        break;
      }
      case "switch_yearly":
      case "switch_monthly": {
        const cadence = data.action === "switch_yearly" ? "yearly" : "monthly";
        const productId = sub.product_id;
        const priceId = `${productId}_${cadence}`;
        event = {
          eventType: "subscription.updated",
          data: {
            id: sub.paddle_subscription_id,
            status: "active",
            currentBillingPeriod: {
              startsAt: sub.current_period_start,
              endsAt: sub.current_period_end,
            },
            scheduledChange: null,
            items: [baseItem(productId, priceId)],
          },
        };
        break;
      }
      default:
        throw new Error("Action inconnue.");
    }

    await dispatchPaddleEvent(admin as unknown as SubscriptionsWriter, event, "sandbox");
    return { ok: true, action: data.action };
  });
