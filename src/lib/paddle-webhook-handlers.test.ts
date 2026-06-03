import { describe, it, expect, vi } from "vitest";
import {
  dispatchPaddleEvent,
  handleSubscriptionCanceled,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  type SubscriptionsWriter,
} from "./paddle-webhook-handlers";

/** Builds a chainable Supabase mock that records every write. */
function buildMockClient() {
  const calls: Array<{ op: string; args: any[]; filters: Array<[string, unknown]> }> = [];

  const upsert = vi.fn(async (row: any, options?: any) => {
    calls.push({ op: "upsert", args: [row, options], filters: [] });
    return { error: null };
  });

  const makeUpdateChain = (row: any) => {
    const filters: Array<[string, unknown]> = [];
    const chain = {
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return chain;
      },
      then: (resolve: (v: { error: null }) => void) => {
        calls.push({ op: "update", args: [row], filters });
        resolve({ error: null });
      },
    };
    return chain;
  };

  const client: SubscriptionsWriter = {
    from: vi.fn(() => ({
      upsert,
      update: (row: any) => makeUpdateChain(row),
    })),
  };

  return { client, calls };
}

const SUB_ID = "sub_test_123";
const CUSTOMER_ID = "ctm_test_123";
const USER_ID = "user-uuid-abc";

const baseItem = {
  price: { id: "pri_001", importMeta: { externalId: "elan_monthly" } },
  product: { id: "pro_001", importMeta: { externalId: "elan" } },
};

const createdData = {
  id: SUB_ID,
  customerId: CUSTOMER_ID,
  status: "active",
  items: [baseItem],
  currentBillingPeriod: {
    startsAt: "2026-06-01T00:00:00Z",
    endsAt: "2026-07-01T00:00:00Z",
  },
  customData: { userId: USER_ID },
  scheduledChange: null,
};

describe("handleSubscriptionCreated", () => {
  it("upserts a subscription row with normalized fields", async () => {
    const { client, calls } = buildMockClient();
    const result = await handleSubscriptionCreated(client, createdData, "sandbox");
    expect(result).toEqual({ applied: "created" });
    expect(calls).toHaveLength(1);
    expect(calls[0].op).toBe("upsert");
    expect(calls[0].args[0]).toMatchObject({
      user_id: USER_ID,
      paddle_subscription_id: SUB_ID,
      paddle_customer_id: CUSTOMER_ID,
      product_id: "elan",
      price_id: "elan_monthly",
      status: "active",
      environment: "sandbox",
      cancel_at_period_end: false,
    });
    expect(calls[0].args[1]).toEqual({ onConflict: "paddle_subscription_id" });
  });

  it("skips when customData.userId is missing and no resolver", async () => {
    const { client, calls } = buildMockClient();
    const result = await handleSubscriptionCreated(
      client,
      { ...createdData, customData: {} },
      "sandbox",
    );
    expect(result).toEqual({ skipped: "no_user" });
    expect(calls).toHaveLength(0);
  });

  it("skips when importMeta.externalId is missing", async () => {
    const { client, calls } = buildMockClient();
    const result = await handleSubscriptionCreated(
      client,
      {
        ...createdData,
        items: [{ price: { id: "pri_x" }, product: { id: "pro_x" } }],
      },
      "sandbox",
    );
    expect(result).toEqual({ skipped: "missing_external_id" });
    expect(calls).toHaveLength(0);
  });
});

describe("handleSubscriptionUpdated", () => {
  it("updates status, period, plan, and cancel_at_period_end", async () => {
    const { client, calls } = buildMockClient();
    await handleSubscriptionUpdated(
      client,
      {
        id: SUB_ID,
        status: "active",
        items: [
          {
            price: { importMeta: { externalId: "dealflow_yearly" } },
            product: { importMeta: { externalId: "dealflow" } },
          },
        ],
        currentBillingPeriod: {
          startsAt: "2026-07-01T00:00:00Z",
          endsAt: "2027-07-01T00:00:00Z",
        },
        scheduledChange: { action: "cancel", effectiveAt: "2027-07-01T00:00:00Z" },
      },
      "sandbox",
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].op).toBe("update");
    expect(calls[0].args[0]).toMatchObject({
      status: "active",
      price_id: "dealflow_yearly",
      product_id: "dealflow",
      cancel_at_period_end: true,
    });
    expect(calls[0].filters).toEqual([
      ["paddle_subscription_id", SUB_ID],
      ["environment", "sandbox"],
    ]);
  });

  it("handles paused status without an items array", async () => {
    const { client, calls } = buildMockClient();
    await handleSubscriptionUpdated(
      client,
      { id: SUB_ID, status: "paused" },
      "sandbox",
    );
    expect(calls[0].args[0]).toMatchObject({ status: "paused" });
    expect(calls[0].args[0]).not.toHaveProperty("price_id");
  });
});

describe("handleSubscriptionCanceled", () => {
  it("sets status to canceled and filters by id + env", async () => {
    const { client, calls } = buildMockClient();
    await handleSubscriptionCanceled(client, { id: SUB_ID }, "live");
    expect(calls[0].args[0]).toMatchObject({ status: "canceled" });
    expect(calls[0].filters).toEqual([
      ["paddle_subscription_id", SUB_ID],
      ["environment", "live"],
    ]);
  });
});

describe("dispatchPaddleEvent", () => {
  it.each([
    "subscription.updated",
    "subscription.paused",
    "subscription.resumed",
  ])("routes %s to the update handler", async (eventType) => {
    const { client, calls } = buildMockClient();
    await dispatchPaddleEvent(
      client,
      { eventType, data: { id: SUB_ID, status: "paused" } },
      "sandbox",
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].op).toBe("update");
  });

  it("routes subscription.canceled to the cancel handler", async () => {
    const { client, calls } = buildMockClient();
    await dispatchPaddleEvent(
      client,
      { eventType: "subscription.canceled", data: { id: SUB_ID } },
      "sandbox",
    );
    expect(calls[0].args[0]).toMatchObject({ status: "canceled" });
  });

  it("ignores unhandled event types", async () => {
    const { client, calls } = buildMockClient();
    const result = await dispatchPaddleEvent(
      client,
      { eventType: "transaction.completed", data: {} },
      "sandbox",
    );
    expect(result).toMatchObject({ skipped: "unhandled_event" });
    expect(calls).toHaveLength(0);
  });
});
