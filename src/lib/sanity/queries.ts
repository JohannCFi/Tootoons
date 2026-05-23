import { groq } from "next-sanity";

export const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(order asc) {
    _id, title, slug, image, description, order
  }
`;

const PRODUCT_PROJECTION = groq`{
  _id, title, slug, shortDescription, images, price, compareAtPrice,
  variants, stock, isFeatured,
  "category": category->{ _id, title, slug }
}`;

export const PRODUCTS_LISTING_QUERY = groq`
  *[_type == "product" && isPublished == true]
  | order(_createdAt desc)
  ${PRODUCT_PROJECTION}
`;

export const PRODUCTS_BY_CATEGORY_QUERY = groq`
  *[_type == "product" && isPublished == true && category->slug.current == $categorySlug]
  | order(_createdAt desc)
  ${PRODUCT_PROJECTION}
`;

export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "product" && slug.current == $slug && isPublished == true][0]{
    ...,
    "category": category->{ _id, title, slug }
  }
`;

export const FEATURED_PRODUCTS_QUERY = groq`
  *[_type == "product" && isPublished == true && isFeatured == true]
  | order(_createdAt desc)[0...8]
  ${PRODUCT_PROJECTION}
`;

export const PRODUCT_SLUGS_QUERY = groq`
  *[_type == "product" && isPublished == true && defined(slug.current)][].slug.current
`;

export const CATEGORY_SLUGS_QUERY = groq`
  *[_type == "category" && defined(slug.current)][].slug.current
`;
