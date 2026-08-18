export type EmailCodePurpose = "signup" | "password-reset";

type Attempt = { email: string; purpose: EmailCodePurpose; at: number };

const WINDOW_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_PER_EMAIL = 5;
const MAX_GLOBAL = 120;
const attempts: Attempt[] = [];

function prune(now: number) {
  while (attempts.length && attempts[0].at <= now - WINDOW_MS) attempts.shift();
}

export function normalizeDeliveryEmail(email: string) {
  return email.trim().toLowerCase();
}

export function checkEmailCodeRateLimit(email: string, purpose: EmailCodePurpose, now = Date.now()) {
  prune(now);
  const normalized = normalizeDeliveryEmail(email);
  const matching = attempts.filter((attempt) => attempt.email === normalized && attempt.purpose === purpose);
  const latest = matching.at(-1);
  if (latest && now - latest.at < COOLDOWN_MS) {
    return { allowed: false as const, retryAfterSeconds: Math.ceil((COOLDOWN_MS - (now - latest.at)) / 1000), reason: "cooldown" as const };
  }
  if (matching.length >= MAX_PER_EMAIL) {
    return { allowed: false as const, retryAfterSeconds: Math.ceil((matching[0].at + WINDOW_MS - now) / 1000), reason: "email-limit" as const };
  }
  if (attempts.length >= MAX_GLOBAL) {
    return { allowed: false as const, retryAfterSeconds: 60, reason: "global-limit" as const };
  }
  attempts.push({ email: normalized, purpose, at: now });
  return { allowed: true as const, retryAfterSeconds: 0, reason: "ok" as const };
}

export function resetEmailCodeRateLimitForTests() {
  attempts.length = 0;
}

export const EMAIL_CODE_RATE_LIMITS = {
  cooldownSeconds: COOLDOWN_MS / 1000,
  perEmailPerHour: MAX_PER_EMAIL,
  globalPerHour: MAX_GLOBAL,
} as const;
