export type MessengerPeer = {
  id: number;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  lastSignedIn?: string | Date | null;
  [key: string]: unknown;
};

export function normalizeMessengerPeer(value: any): MessengerPeer | null {
  const candidate = value?.peer || value?.user || value;
  const id = Number(candidate?.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return { ...candidate, id } as MessengerPeer;
}

export function messengerPeerId(value: any): number | null {
  const peer = normalizeMessengerPeer(value);
  return peer?.id ?? null;
}

export function selectMessengerSearchResult(value: any): { peer: MessengerPeer; clearSearch: true; openChat: true } | null {
  const peer = normalizeMessengerPeer(value);
  return peer ? { peer, clearSearch: true, openChat: true } : null;
}
