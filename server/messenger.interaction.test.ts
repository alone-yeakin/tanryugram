import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("Messenger interaction contracts", () => {
  it("persists delivery state and promotes inbound messages to read", () => {
    const schema = read("drizzle/schema.ts");
    const router = read("server/routers.ts");
    const messenger = read("client/src/components/TanryugramMessengerAdvanced.tsx");

    expect(schema).toContain('deliveryStatus: mysqlEnum("deliveryStatus", ["sent", "delivered", "read"])');
    expect(router).toContain('deliveryStatus: "sent"');
    expect(router).toContain('set({ isRead: true, deliveryStatus: "read" })');
    expect(messenger).toContain('read.mutate({ otherUserId: peerId })');
    expect(messenger).toContain('item.deliveryStatus === "read"');
  });

  it("uses the typingStatus userId contract with fresh polling", () => {
    const router = read("server/routers.ts");
    const messenger = read("client/src/components/TanryugramMessengerAdvanced.tsx");

    expect(router).toContain('return isTyping ? [{ userId: status.userId }] : [];');
    expect(messenger).toContain('Number(entry?.userId) === peerId');
    expect(messenger).toContain('refetchInterval: 900');
    expect(messenger).toContain("lastTypedAt.current");
  });
});

describe("Dark mode navigation contract", () => {
  it("exposes an accessible persistent theme toggle", () => {
    const home = read("client/src/pages/Home.tsx");
    const theme = read("client/src/contexts/ThemeContext.tsx");

    expect(home).toContain("onClick={() => toggleTheme?.()}");
    expect(home).toContain('aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}');
    expect(home).toContain('aria-pressed={theme === "dark"}');
    expect(theme).toContain('localStorage.setItem("theme", theme)');
    expect(theme).toContain('root.classList.add("dark")');
  });
});
