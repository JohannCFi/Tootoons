import { describe, it, expect } from "vitest";
import * as queries from "../../src/lib/sanity/queries";

describe("GROQ queries", () => {
  it("expose les queries critiques", () => {
    expect(queries.PRODUCTS_LISTING_QUERY).toContain('_type == "product"');
    expect(queries.PRODUCT_BY_SLUG_QUERY).toContain("slug.current == $slug");
    expect(queries.CATEGORIES_QUERY).toContain('_type == "category"');
    expect(queries.FEATURED_PRODUCTS_QUERY).toContain("isFeatured == true");
  });

  it("PRODUCTS_LISTING filtre isPublished", () => {
    expect(queries.PRODUCTS_LISTING_QUERY).toContain("isPublished == true");
  });

  it("expose les queries de slugs pour generateStaticParams", () => {
    expect(queries.PRODUCT_SLUGS_QUERY).toContain("slug.current");
    expect(queries.CATEGORY_SLUGS_QUERY).toContain("slug.current");
  });
});
