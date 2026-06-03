import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, type PaddleEnv, getPaddleClient } from "@/lib/paddle.server";
import {
  dispatchPaddleEvent,
  type SubscriptionsWriter,
} from "@/lib/paddle-webhook-handlers";

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

/** Fallback to resolve userId via Paddle customer email when customData is missing. */
async function resolveUserId(data: any, env: PaddleEnv): Promise<string | undefined> {
  const { customerId } = data;
  if (!customerId) return undefined;
  try {
    const paddle = getPaddleClient(env);
    const customer = await paddle.customers.get(customerId);
    const email = customer.email;
    if (!email) return undefined;
    const { data: { users } } = await getSupabase().auth.admin.listUsers();
    const match = (users as Array<{ id: string; email?: string }>).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    return match?.id;
  } catch (e) {
    console.error("Failed to resolve user from customer email", e);
    return undefined;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          const event = await verifyWebhook(request, env);
          await dispatchPaddleEvent(
            getSupabase() as SubscriptionsWriter,
            { eventType: event.eventType, data: event.data },
            env,
            resolveUserId,
          );
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
