import { describe, it, expect } from "vitest";
import {
  parseWixRow,
  wixPriceToCents,
} from "../../scripts/migrate-wix-to-sanity";

describe("wixPriceToCents", () => {
  it("convertit '19.90' → 1990", () => {
    expect(wixPriceToCents("19.90")).toBe(1990);
  });
  it("convertit '19,90' → 1990 (séparateur français)", () => {
    expect(wixPriceToCents("19,90")).toBe(1990);
  });
  it("retourne 0 si vide", () => {
    expect(wixPriceToCents("")).toBe(0);
  });
});

describe("parseWixRow", () => {
  it("mappe une ligne CSV vers la forme attendue", () => {
    const row = {
      handleId: "mug-cat",
      fieldType: "Product",
      name: "Mug Chat",
      description: "Joli mug avec un chat",
      productImageUrl: "https://static.wixstatic.com/x.jpg",
      collection: "Mugs",
      sku: "MUG-001",
      price: "19,90",
      visible: "true",
      inventory: "10",
      weight: "300",
    };
    const result = parseWixRow(row);
    expect(result).toMatchObject({
      title: "Mug Chat",
      slug: "mug-chat",
      shortDescription: "Joli mug avec un chat",
      priceCents: 1990,
      categoryTitle: "Mugs",
      stock: 10,
      weight: 300,
      imageUrls: ["https://static.wixstatic.com/x.jpg"],
      isPublished: true,
    });
  });

  it("ignore les lignes fieldType !== Product (variants Wix)", () => {
    const row = { fieldType: "Custom Text Field", name: "Personnalisation" };
    expect(parseWixRow(row)).toBeNull();
  });
});
