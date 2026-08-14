import { ENV } from "./_core/env";

export async function sendVerificationEmail(input: { to: string; code: string; purpose: "signup" | "password-reset" }) {
  if (!ENV.mailApiUrl || !ENV.mailApiSecret) {
    throw new Error("Owner-only mail delivery is not configured");
  }

  const isReset = input.purpose === "password-reset";
  const response = await fetch(ENV.mailApiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: ENV.mailApiSecret,
      to: input.to,
      code: input.code,
      subject: isReset ? "TanRyuGram password reset code" : "TanRyuGram verification code",
      message: isReset
        ? "Your TanRyuGram password-reset code is below. It expires in 15 minutes."
        : "Your TanRyuGram signup verification code is below. It expires in 15 minutes.",
    }),
  });

  if (!response.ok) throw new Error(`Owner mail endpoint failed (${response.status})`);
  const payload = await response.json() as { ok?: boolean };
  if (!payload.ok) throw new Error("Owner mail endpoint rejected the request");
}
