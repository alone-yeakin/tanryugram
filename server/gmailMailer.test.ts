import { afterEach, describe, expect, it, vi } from "vitest";
import { sendVerificationEmail } from "./gmailMailer";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verification email delivery", () => {
  it("uses Brevo first without sending the code to the legacy endpoint", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://api.brevo.com/v3/smtp/email");
      return new Response(JSON.stringify({ messageId: "test-message" }), { status: 201, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendVerificationEmail({ to: "recipient@example.com", code: "123456", purpose: "signup" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["api-key"]).toBeTruthy();
    expect(String(init.body)).toContain("recipient@example.com");
    expect(String(init.body)).toContain("123456");
  });
});
