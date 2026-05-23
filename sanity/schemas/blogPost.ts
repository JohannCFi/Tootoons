import { defineField, defineType } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Article de blog",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
      validation: (r) => r.max(300),
    }),
    defineField({
      name: "coverImage",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({ name: "isPublished", type: "boolean", initialValue: false }),
  ],
  orderings: [
    {
      title: "Date publication ↓",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
