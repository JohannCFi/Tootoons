import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("sanity client", () => {
  const originalProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalProjectId !== undefined) {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = originalProjectId;
    }
  });

  it("throw si NEXT_PUBLIC_SANITY_PROJECT_ID manquant", async () => {
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    await expect(import("../../src/lib/sanity/client")).rejects.toThrow(
      /Missing NEXT_PUBLIC_SANITY_PROJECT_ID/,
    );
  });

  it("expose sanityClient quand env présent", async () => {
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "test123";
    process.env.NEXT_PUBLIC_SANITY_DATASET = "production";
    const mod = await import("../../src/lib/sanity/client");
    expect(mod.sanityClient).toBeDefined();
  });
});
