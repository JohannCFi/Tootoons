import { sanityClient } from "@/lib/sanity/client";
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SLUGS_QUERY,
} from "@/lib/sanity/queries";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import type { Product } from "@/types/sanity";
import type { Metadata } from "next";

export const revalidate = 600;

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<string[]>(PRODUCT_SLUGS_QUERY);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await sanityClient.fetch<Product | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
  );
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await sanityClient.fetch<Product | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
  );
  if (!product) notFound();

  return (
    <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 lg:grid-cols-2">
      <ProductGallery images={product.images} alt={product.title} />
      <div>
        <p className="text-sm uppercase tracking-widest text-navy-500">
          {product.category?.title ?? "Produit"}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-navy-900">
          {product.title}
        </h1>
        <div className="mt-4">
          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compareAtPrice}
          />
        </div>
        {product.shortDescription && (
          <p className="mt-6 text-navy-700">{product.shortDescription}</p>
        )}
        <button
          type="button"
          className="mt-8 rounded-full bg-navy-900 text-white px-6 py-3 font-medium hover:bg-navy-700 transition-colors"
        >
          Ajouter au panier
        </button>
        {product.description && (
          <div className="mt-12 space-y-4 text-navy-700 leading-relaxed">
            <PortableText value={product.description} />
          </div>
        )}
      </div>
    </article>
  );
}
