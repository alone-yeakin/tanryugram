import { ENV } from "./_core/env";

export const TANRYUGRAM_OWNER_OPEN_ID = ENV.ownerOpenId;

export function isTanryugramOwner(openId?: string | null) {
  return Boolean(openId && TANRYUGRAM_OWNER_OPEN_ID && openId.trim() === TANRYUGRAM_OWNER_OPEN_ID);
}
