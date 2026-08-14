import React from "react";
import { Send } from "lucide-react";
import { selectMessengerSearchResult } from "@/lib/messengerPeer";
import { SafeImage } from "@/components/SafeImage";


export function MessengerSearchResult({ person, onSelect }: { person: any; onSelect: (peer: any) => void }) {
  const selection = selectMessengerSearchResult(person);
  if (!selection) return null;
  const displayName = person.name || person.username || "Tanryugram user";
  return <button type="button" data-peer-id={selection.peer.id} onClick={() => onSelect(selection.peer)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-muted"><SafeImage src={person.avatarUrl} fallbackName={displayName} alt={displayName} className="h-11 w-11 shrink-0 rounded-full object-cover" /><span className="min-w-0 flex-1"><b className="block truncate text-sm">{displayName}</b><span className="block truncate text-[11px] text-muted-foreground">@{person.username || "user"} · Start a conversation</span></span><Send className="h-4 w-4 shrink-0 text-violet-500" /></button>;
}
