import { describe, expect, it } from "vitest";

describe("Gemini API secret", () => {
  it("authenticates against the lightweight model-list endpoint", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey, "GEMINI_API_KEY must be configured for this smoke test").toBeTruthy();

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey as string },
    });
    const body = await response.text();
    expect(response.ok, `Gemini API returned ${response.status}: ${body.slice(0, 300)}`).toBe(true);
  }, 30_000);
});
