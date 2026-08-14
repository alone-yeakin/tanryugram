import { describe, expect, it } from "vitest";
import { handleStripeWebhook } from "./stripeWebhook";

describe("stripe webhook", () => {
  it("returns valid JSON for Stripe verification test events", async () => {
    const body = Buffer.from(JSON.stringify({ id: "evt_test_verification", type: "test" }));
    const response = {
      statusCode: 0,
      payload: undefined as unknown,
      status(code: number) { this.statusCode = code; return this; },
      json(value: unknown) { this.payload = value; return this; },
    };
    await handleStripeWebhook({ body, headers: {} } as any, response as any);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ verified: true });
  });

  it("acknowledges missing credentials with a JSON 200 response", async () => {
    const body = Buffer.from(JSON.stringify({ id: "evt_live_like", type: "checkout.session.completed" }));
    const response = {
      statusCode: 0,
      payload: undefined as unknown,
      status(code: number) { this.statusCode = code; return this; },
      json(value: unknown) { this.payload = value; return this; },
    };
    const previous = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    await handleStripeWebhook({ body, headers: {} } as any, response as any);
    if (previous) process.env.STRIPE_SECRET_KEY = previous;
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ verified: true });
  });
});
