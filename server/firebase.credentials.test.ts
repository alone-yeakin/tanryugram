import { createPrivateKey } from "node:crypto";
import { describe, expect, it } from "vitest";

describe("Firebase server credentials", () => {
  it("accepts the configured service-account identity and PEM private key", () => {
    expect(process.env.FIREBASE_PROJECT_ID).toBe("tanryugram-6878b");
    expect(process.env.FIREBASE_CLIENT_EMAIL).toContain("@tanryugram-6878b.iam.gserviceaccount.com");
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    expect(privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    expect(privateKey).toMatch(/-----END PRIVATE KEY-----\s*$/);
    expect(() => createPrivateKey({ key: privateKey!, format: "pem", type: "pkcs8" })).not.toThrow();
  });
});

export {};
