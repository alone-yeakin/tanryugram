import { describe, expect, it } from "vitest";
import { getViteServerOptions } from "./_core/vite";

describe("hosted Vite middleware", () => {
  it("disables the internal HMR socket behind the public proxy", () => {
    const options = getViteServerOptions();
    expect(options.middlewareMode).toBe(true);
    expect(options.hmr).toBe(false);
    expect(options.allowedHosts).toBe(true);
  });
});
