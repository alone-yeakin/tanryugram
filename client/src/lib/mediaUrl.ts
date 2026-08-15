const DEFAULT_AVATAR_BACKGROUND = "#ede9fe";
const DEFAULT_AVATAR_FOREGROUND = "#6d28d9";

export const fallbackAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&q=80";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '\"': "&quot;",
  })[character] ?? character);
}

export function initialsFor(name?: string | null) {
  const words = (name || "Tanryugram user").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() || "T").join("") || "T";
}

export function initialsAvatar(name?: string | null) {
  const initials = escapeXml(initialsFor(name));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${DEFAULT_AVATAR_BACKGROUND}"/><text x="48" y="55" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="${DEFAULT_AVATAR_FOREGROUND}">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Keep stored media same-origin whenever possible. Older rows may contain a
 * full preview URL or a storage key without its `/manus-storage/` prefix.
 * Blob URLs are intentionally rejected because they only exist on the device
 * that created them and can never render for another account or device.
 */
function appMediaProxyPath(key: string) {
  return `/api/media-proxy/${key.replace(/^\/+/, "").replace(/^manus-storage\//, "")}`;
}

export function normalizeMediaUrl(value?: string | null) {
  if (!value) return "";
  const raw = value.trim();
  if (!raw || raw.startsWith("blob:")) return "";
  if (raw.startsWith("data:")) return raw;
  if (!raw.includes("://") && !raw.startsWith("/")) return appMediaProxyPath(raw);

  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tanryugram.invalid";
    const parsed = new URL(raw, origin);
    if (parsed.pathname.includes("/manus-storage/")) {
      const key = parsed.pathname.split("/manus-storage/")[1] || "";
      return `${appMediaProxyPath(key)}${parsed.search}`;
    }
    if (parsed.pathname.includes("/api/media-proxy/")) return `${parsed.pathname}${parsed.search}`;
    return parsed.href;
  } catch {
    const key = raw.replace(/^\/+/, "");
    return appMediaProxyPath(key);
  }
}

export function mediaSource(value: string | null | undefined, fallback?: string) {
  return normalizeMediaUrl(value) || fallback || initialsAvatar();
}
