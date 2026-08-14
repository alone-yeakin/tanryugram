import React from "react";
import { MessageCircle } from "lucide-react";
import { normalizeMessengerPeer } from "@/lib/messengerPeer";

export function ProfileMessageButton({ user, onOpen }: { user: any; onOpen: (peer: any) => void }) {
  const peer = normalizeMessengerPeer(user);
  if (!peer) return null;
  return <button type="button" data-peer-id={peer.id} onClick={() => onOpen(peer)} className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition hover:opacity-90"><MessageCircle className="h-3.5 w-3.5" /> Message</button>;
}
