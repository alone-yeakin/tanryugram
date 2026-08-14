import { describe, expect, it } from "vitest";

const mailApiUrl = process.env.MAIL_API_URL;
const mailApiSecret = process.env.MAIL_API_SECRET;

describe("Apps Script mail adapter", () => {
  it("accepts the configured secret without sending when the request body is incomplete", async () => {
    if (!mailApiUrl || !mailApiSecret) {
      throw new Error("MAIL_API_URL and MAIL_API_SECRET must be configured for this validation");
    }

    const response = await fetch(mailApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: mailApiSecret }),
    });
    const payload = await response.json() as { ok?: boolean; error?: string };

    expect(response.ok).toBe(true);
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe("Invalid request");
  }, 20_000);
});
