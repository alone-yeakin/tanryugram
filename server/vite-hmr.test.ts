import { describe, expect, it } from "vitest";
import { getViteServerOptions, stripHostedViteClient } from "./_core/vite";

describe("hosted Vite middleware", () => {
  it("strips the injected Vite client from hosted HTML", () => {
    const html = '<head><script type="module" src="/@vite/client"></script><script type="module" src="/src/main.tsx"></script></head>';
    expect(stripHostedViteClient(html)).not.toContain("/@vite/client");
    expect(stripHostedViteClient(html)).toContain("/src/main.tsx");
  });

  it("disables the internal HMR socket behind the public proxy", () => {
    const options = getViteServerOptions();
    expect(options.middlewareMode).toBe(true);
    expect(options.hmr).toBe(false);
    expect(options.allowedHosts).toBe(true);
  });
});
