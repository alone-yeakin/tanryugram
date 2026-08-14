import { describe, expect, it } from "vitest";
import { messengerPeerId, normalizeMessengerPeer, selectMessengerSearchResult } from "./messengerPeer";

describe("profile-to-Messenger peer handoff", () => {
  it("normalizes a direct user returned from profile search", () => {
    const peer = normalizeMessengerPeer({ id: "42", name: "Rabbi", username: "evo_rabbi" });
    expect(peer).toMatchObject({ id: 42, name: "Rabbi", username: "evo_rabbi" });
    expect(messengerPeerId(peer)).toBe(42);
  });

  it("unwraps peer and user envelopes used by inbox and profile queries", () => {
    expect(messengerPeerId({ peer: { id: 7, name: "Peer" } })).toBe(7);
    expect(normalizeMessengerPeer({ user: { id: 8, username: "member" } })).toMatchObject({ id: 8, username: "member" });
  });

  it("selects a Messenger search result with a stable peer identity and clear/open actions", () => {
    const selection = selectMessengerSearchResult({ id: "42", name: "Rabbi", username: "evo_rabby" });
    expect(selection).toEqual({ peer: expect.objectContaining({ id: 42, username: "evo_rabby" }), clearSearch: true, openChat: true });
    expect(selection?.peer.id).toBe(42);
  });

  it("rejects missing or invalid ids so Messenger cannot open a blank chat", () => {
    expect(normalizeMessengerPeer(null)).toBeNull();
    expect(normalizeMessengerPeer({ name: "Missing id" })).toBeNull();
    expect(messengerPeerId({ id: 0, name: "Invalid" })).toBeNull();
    expect(selectMessengerSearchResult({ username: "invalid" })).toBeNull();
  });
});
