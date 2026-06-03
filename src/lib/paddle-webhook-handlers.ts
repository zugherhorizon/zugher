import type { PaddleEnv } from "./paddle.server";

/**
 * Minimal Supabase-like client surface used by these handlers.
 * Lets us inject a mock in tests without pulling supabase-js.
 */
export type SubscriptionsWriter = {
  from: (table: string) => {
    upsert: (
      row: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => Promise<{ error: unknown }> | { error: unknown };
    update: (row: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => {
        eq: (column: string, value: unknown) => Promise<{ error: unknown }> | { error: unknown };
      };
    };
  };
};

export type PaddleEventLike = {
  eventType: string;
  data: any;
};

export type ResolveUserId = (data: any, env: PaddleEnv) => Promise<string | undefined>;

export async function handleSubscriptionCreated(
  client: SubscriptionsWriter,
  data: any,
  env: PaddleEnv,
  resolveUserId?: ResolveUserId,
) {
  const {
    id,
    customerId,
    items,
    status,
    currentBillingPeriod,
    customData,
    scheduledChange,
  } = data;

  let userId: string | undefined = customData?.userId;
  if (!userId && resolveUserId) {
    userId = await resolveUserId(data, env);
  }
  if (!userId) {
    console.error("No userId in customData and could not resolve via email");
    return { skipped: "no_user" as const };
  }

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId");
    return { skipped: "missing_external_id" as const };
  }

  await client.from("subscriptions").upsert(
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
  return { applied: "created" as const };
}

export async function handleSubscriptionUpdated(
  client: SubscriptionsWriter,
  data: any,
  env: PaddleEnv,
) {
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

  await client
    .from("subscriptions")
    .update(update)
    .eq("paddle_subscription_id", id)
    .eq("environment", env);
  return { applied: "updated" as const };
}

export async function handleSubscriptionCanceled(
  client: SubscriptionsWriter,
  data: any,
  env: PaddleEnv,
) {
  await client
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
  return { applied: "canceled" as const };
}

/**
 * Dispatches a Paddle event payload to the right handler.
 * Used by both the real webhook route and the in-app simulator.
 */
export async function dispatchPaddleEvent(
  client: SubscriptionsWriter,
  event: PaddleEventLike,
  env: PaddleEnv,
  resolveUserId?: ResolveUserId,
) {
  switch (event.eventType) {
    case "subscription.created":
      return handleSubscriptionCreated(client, event.data, env, resolveUserId);
    case "subscription.updated":
    case "subscription.paused":
    case "subscription.resumed":
      return handleSubscriptionUpdated(client, event.data, env);
    case "subscription.canceled":
      return handleSubscriptionCanceled(client, event.data, env);
    default:
      return { skipped: "unhandled_event" as const, eventType: event.eventType };
  }
}
