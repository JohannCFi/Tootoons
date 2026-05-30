import { describe, it, expect } from "vitest";
import { formatPriceCents } from "../../src/lib/format";

// Intl.NumberFormat fr-FR uses a narrow no-break space (U+202F) or no-break
// space (U+00A0) before €. We normalise spaces so the assertion is portable.
const normalize = (s: string) => s.replace(/[  ]/g, " ");

describe("formatPriceCents", () => {
  it("1990 → '19,90 €'", () => {
    expect(normalize(formatPriceCents(1990))).toBe("19,90 €");
  });
  it("0 → '0,00 €'", () => {
    expect(normalize(formatPriceCents(0))).toBe("0,00 €");
  });
  it("4080 → '40,80 €'", () => {
    expect(normalize(formatPriceCents(4080))).toBe("40,80 €");
  });
});
