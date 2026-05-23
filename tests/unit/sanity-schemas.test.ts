import { describe, it, expect } from "vitest";
import type { FieldDefinition } from "sanity";
import category from "../../sanity/schemas/category";

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
