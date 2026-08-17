import { describe, expect, it } from "vitest";

describe("Brevo credentials", () => {
  it("authenticates against the lightweight account endpoint", async () => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) throw new Error("BREVO_API_KEY is not configured");

    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, accept: "application/json" },
    });

    if (!response.ok) {
      const providerText = (await response.text()).replace(/\b(xkeysib|api-key|key)\b[^\s]*/gi, "[redacted]").slice(0, 240);
      throw new Error(`Brevo account endpoint rejected the configured key (${response.status}): ${providerText}`);
    }
    const payload = await response.json() as { email?: string; companyName?: string };
    expect(typeof payload).toBe("object");
  }, 20_000);
});

