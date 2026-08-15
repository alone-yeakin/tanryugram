import { ENV } from "./_core/env";

export const TANRYUGRAM_OWNER_OPEN_ID = ENV.ownerOpenId;
export const TANRYUGRAM_OWNER_EMAIL = "realaayan.apple@gmail.com";

export function isTanryugramOwner(identity?: string | null | { openId?: string | null; email?: string | null }) {
  const openId = typeof identity === "string" ? identity : identity?.openId;
  const email = typeof identity === "object" && identity ? identity.email : undefined;
  const matchesOpenId = Boolean(openId && TANRYUGRAM_OWNER_OPEN_ID && openId.trim() === TANRYUGRAM_OWNER_OPEN_ID);
  const matchesOwnerEmail = String(email || "").trim().toLowerCase() === TANRYUGRAM_OWNER_EMAIL;
  return matchesOpenId || matchesOwnerEmail;
}
