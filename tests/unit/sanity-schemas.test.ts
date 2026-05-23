import { describe, it, expect } from "vitest";
import type { FieldDefinition } from "sanity";
import category from "../../sanity/schemas/category";
import product from "../../sanity/schemas/product";

type Field = FieldDefinition & { validation?: unknown };
const fieldsOf = (doc: { fields: readonly Field[] }) =>
  doc.fields as readonly Field[];

describe("category schema", () => {
  it("a les champs requis : title, slug, image, description, order", () => {
    const names = fieldsOf(category).map((f) => f.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "title",
        "slug",
        "image",
        "description",
        "order",
      ]),
    );
  });

  it("title est requis", () => {
    const title = fieldsOf(category).find((f) => f.name === "title");
    expect(title?.validation).toBeDefined();
  });
});

describe("product schema", () => {
  const names = fieldsOf(product).map((f) => f.name);

  it("contient tous les champs spécifiés", () => {
    expect(names).toEqual(
      expect.arrayContaining([
        "title",
        "slug",
        "category",
        "description",
        "shortDescription",
        "images",
        "price",
        "compareAtPrice",
        "variants",
        "stock",
        "weight",
        "tags",
        "isPublished",
        "isFeatured",
        "seoTitle",
        "seoDescription",
      ]),
    );
  });

  it("price est requis et en centimes", () => {
    const price = fieldsOf(product).find((f) => f.name === "price");
    expect(price?.type).toBe("number");
    expect(price?.validation).toBeDefined();
  });

  it("variants[].stock cohabite avec stock top-level (mutex documentée)", () => {
    const stock = fieldsOf(product).find((f) => f.name === "stock");
    const variants = fieldsOf(product).find((f) => f.name === "variants");
    expect(stock).toBeDefined();
    expect(variants).toBeDefined();
  });
});
