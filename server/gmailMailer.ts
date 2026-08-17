import { ENV } from "./_core/env";

type VerificationEmail = {
  to: string;
  code: string;
  purpose: "signup" | "password-reset";
};

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function emailCopy(purpose: VerificationEmail["purpose"]) {
  const isReset = purpose === "password-reset";
  return {
    subject: isReset ? "TanRyuGram password reset code" : "TanRyuGram verification code",
    intro: isReset
      ? "Use the verification code below to reset your TanRyuGram password."
      : "Use the verification code below to complete your TanRyuGram signup.",
  };
}

async function sendWithBrevo(input: VerificationEmail) {
  if (!ENV.brevoApiKey || !ENV.brevoSenderEmail) {
    throw new Error("Brevo mail delivery is not configured");
  }

  const copy = emailCopy(input.purpose);
  const response = await fetch(BREVO_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": ENV.brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: ENV.brevoSenderEmail, name: ENV.brevoSenderName || "TanRyuGram" },
      to: [{ email: input.to }],
      subject: copy.subject,
      textContent: `${copy.intro}\n\nYour code: ${input.code}\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this email.`,
      htmlContent: `<!doctype html><html><body style="margin:0;background:#f7f5ff;padding:32px;font-family:Arial,sans-serif;color:#191622"><div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e7e1f7;border-radius:20px;padding:32px"><p style="margin:0 0 8px;color:#7c3aed;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">TanRyuGram</p><h1 style="margin:0 0 16px;font-size:24px">${copy.subject}</h1><p style="font-size:15px;line-height:1.6">${copy.intro}</p><div style="margin:24px 0;padding:18px;border-radius:14px;background:#f1ecff;text-align:center"><span style="font-size:32px;font-weight:800;letter-spacing:.18em;color:#6d28d9">${input.code}</span></div><p style="font-size:13px;line-height:1.6;color:#625d70">This code expires in 15 minutes. If you did not request this, you can ignore this email.</p></div></body></html>`,
    }),
  });

  if (!response.ok) throw new Error(`Brevo mail endpoint failed (${response.status})`);
}

async function sendWithLegacyMailer(input: VerificationEmail) {
  if (!ENV.mailApiUrl || !ENV.mailApiSecret) {
    throw new Error("Legacy mail delivery is not configured");
  }

  const copy = emailCopy(input.purpose);
  const response = await fetch(ENV.mailApiUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: ENV.mailApiSecret,
      to: input.to,
      code: input.code,
      subject: copy.subject,
      message: `${copy.intro} This code expires in 15 minutes.`,
    }),
  });

  if (!response.ok) throw new Error(`Legacy mail endpoint failed (${response.status})`);
  const payload = await response.json() as { ok?: boolean };
  if (!payload.ok) throw new Error("Legacy mail endpoint rejected the request");
}

export async function sendVerificationEmail(input: VerificationEmail) {
  let brevoError: unknown;
  if (ENV.brevoApiKey && ENV.brevoSenderEmail) {
    try {
      await sendWithBrevo(input);
      return;
    } catch (error) {
      brevoError = error;
    }
  }

  try {
    await sendWithLegacyMailer(input);
    return;
  } catch (legacyError) {
    const brevoMessage = brevoError instanceof Error ? brevoError.message : "Brevo unavailable";
    const legacyMessage = legacyError instanceof Error ? legacyError.message : "Legacy mailer unavailable";
    throw new Error(`Verification email delivery failed: ${brevoMessage}; ${legacyMessage}`);
  }
}
