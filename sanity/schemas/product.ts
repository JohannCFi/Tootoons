import { defineField, defineType } from "sanity";

export default defineType({
  name: "product",
  title: "Produit",
  type: "document",
  groups: [
    { name: "info", title: "Infos" },
    { name: "media", title: "Médias" },
    { name: "pricing", title: "Prix & stock" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Nom",
      group: "info",
      validation: (r) => r.required().min(2).max(120),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "info",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      group: "info",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "shortDescription",
      type: "text",
      title: "Résumé (cartes produit)",
      group: "info",
      rows: 2,
      validation: (r) => r.max(200),
    }),
    defineField({
      name: "description",
      type: "array",
      title: "Description complète",
      group: "info",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "images",
      type: "array",
      group: "media",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: "price",
      type: "number",
      title: "Prix TTC (en centimes)",
      group: "pricing",
      description: "Ex : 1990 pour 19,90 €",
      validation: (r) => r.required().integer().min(0),
    }),
    defineField({
      name: "compareAtPrice",
      type: "number",
      title: "Prix barré (en centimes, optionnel)",
      group: "pricing",
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "variants",
      type: "array",
      group: "pricing",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "name",
              type: "string",
              title: "Nom (ex: Taille M)",
              validation: (r) => r.required(),
            },
            { name: "sku", type: "string" },
            {
              name: "stock",
              type: "number",
              validation: (r) => r.integer().min(0),
            },
            {
              name: "priceDelta",
              type: "number",
              title: "Delta prix (centimes, peut être négatif)",
              initialValue: 0,
            },
          ],
        },
      ],
    }),
    defineField({
      name: "stock",
      type: "number",
      title: "Stock (si pas de variants)",
      description: "Ignoré si des variants sont définis",
      group: "pricing",
      hidden: ({ document }) =>
        Array.isArray(document?.variants) &&
        (document.variants as unknown[]).length > 0,
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "weight",
      type: "number",
      title: "Poids (g)",
      group: "pricing",
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "info",
    }),
    defineField({
      name: "isPublished",
      type: "boolean",
      title: "Publié",
      group: "info",
      initialValue: false,
    }),
    defineField({
      name: "isFeatured",
      type: "boolean",
      title: "Mis en avant (home)",
      group: "info",
      initialValue: false,
    }),
    defineField({ name: "seoTitle", type: "string", group: "seo" }),
    defineField({
      name: "seoDescription",
      type: "text",
      group: "seo",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "title", media: "images.0", price: "price" },
    prepare: ({ title, media, price }) => ({
      title: title as string,
      subtitle:
        typeof price === "number"
          ? `${(price / 100).toFixed(2)} €`
          : "Prix manquant",
      media: media as unknown as undefined,
    }),
  },
});
