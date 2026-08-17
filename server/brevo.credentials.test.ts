import { describe, expect, it } from "vitest";

describe("Brevo credentials", () => {
  it("authenticates against the lightweight account endpoint", async () => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is not configured");

    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, accept: "application/json" },
    });

    expect(response.ok).toBe(true);
    const payload = await response.json() as { email?: string; companyName?: string };
    expect(typeof payload).toBe("object");
  }, 20_000);
});

