import { describe, expect, it } from "vitest";
import { initialsAvatar, initialsFor, mediaSource, normalizeMediaUrl } from "./mediaUrl";

describe("portable Tanryugram media URLs", () => {
  it("keeps storage proxy paths same-origin and preserves signed query strings", () => {
    expect(normalizeMediaUrl("/manus-storage/users/7/avatar.webp")).toBe("/manus-storage/users/7/avatar.webp");
    expect(normalizeMediaUrl("https://tanryugram.example/manus-storage/users/7/avatar.webp?Expires=123")).toBe("/manus-storage/users/7/avatar.webp?Expires=123");
  });

  it("repairs legacy storage keys and rejects device-local blob URLs", () => {
    expect(normalizeMediaUrl("users/7/avatar.webp")).toBe("/manus-storage/users/7/avatar.webp");
    expect(normalizeMediaUrl("blob:https://phone.invalid/local-only")).toBe("");
    expect(normalizeMediaUrl("undefined")).toBe("");
    expect(normalizeMediaUrl("null")).toBe("");
    expect(normalizeMediaUrl("[object Object]")).toBe("");
  });

  it("rewrites legacy API proxy URLs to the active storage proxy", () => {
    expect(normalizeMediaUrl("https://example.com/api/media-proxy/users/1/avatar.webp")).toBe("/manus-storage/users/1/avatar.webp");
  });

  it("provides stable visible fallbacks when a remote image cannot load", () => {
    expect(initialsFor("Ashikul Islam")).toBe("AI");
    expect(initialsAvatar("Ashikul Islam")).toMatch(/^data:image\/svg\+xml/);
    expect(mediaSource("blob:https://phone.invalid/local-only", initialsAvatar("Ashikul Islam"))).toMatch(/^data:image\/svg\+xml/);
  });
});
