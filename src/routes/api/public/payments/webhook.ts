import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv, getPaddleClient } from "@/lib/paddle.server";

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;

  let userId: string | undefined = customData?.userId;

  // Fallback: resolve via customer email if userId wasn't passed in customData.
  if (!userId && customerId) {
    try {
      const paddle = getPaddleClient(env);
      const customer = await paddle.customers.get(customerId);
      const email = customer.email;
      if (email) {
        const { data: { users } } = await getSupabase().auth.admin.listUsers();
        const match = (users as Array<{ id: string; email?: string }>).find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );
        userId = match?.id;
      }
    } catch (e) {
      console.error("Failed to resolve user from customer email", e);
    }
  }

  if (!userId) {
    console.error("No userId in customData and could not resolve via email");
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item.price.id,
      rawProductId: item.product.id,
    });
    return;
  }

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: id,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        current_period_start: currentBillingPeriod?.startsAt,
        current_period_end: currentBillingPeriod?.endsAt,
        cancel_at_period_end: scheduledChange?.action === "cancel",
        scheduled_change: scheduledChange ?? null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, items, status, currentBillingPeriod, scheduledChange } = data;
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;

  const update: Record<string, unknown> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === "cancel",
    scheduled_change: scheduledChange ?? null,
    updated_at: new Date().toISOString(),
  };
  if (priceId) update.price_id = priceId;
  if (productId) update.product_id = productId;

  await getSupabase()
    .from("subscriptions")
    .update(update)
    .eq("paddle_subscription_id", id)
    .eq("environment", env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled Paddle event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
