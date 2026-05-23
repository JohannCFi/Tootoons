import type { PortableTextBlock } from "@portabletext/types";

export type Category = {
  _id: string;
  title: string;
  slug: { current: string };
  image?: unknown;
  description?: string;
  order: number;
};

export type ProductVariant = {
  name: string;
  sku?: string;
  stock?: number;
  priceDelta?: number;
};

export type Product = {
  _id: string;
  title: string;
  slug: { current: string };
  category: {
    _ref?: string;
    _id?: string;
    title?: string;
    slug?: { current: string };
  };
  shortDescription?: string;
  description?: PortableTextBlock[];
  images: unknown[];
  price: number;
  compareAtPrice?: number;
  variants?: ProductVariant[];
  stock?: number;
  weight?: number;
  tags?: string[];
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type BlogPost = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  coverImage?: unknown;
  body?: PortableTextBlock[];
  publishedAt: string;
  isPublished: boolean;
};
