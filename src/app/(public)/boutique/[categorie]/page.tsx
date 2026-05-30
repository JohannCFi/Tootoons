import { sanityClient } from "@/lib/sanity/client";
import {
  CATEGORIES_QUERY,
  CATEGORY_SLUGS_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
} from "@/lib/sanity/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Category, Product } from "@/types/sanity";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<string[]>(CATEGORY_SLUGS_QUERY);
  return slugs.map((slug) => ({ categorie: slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorie: string }>;
}) {
  const { categorie } = await params;
  const [products, categories] = await Promise.all([
    sanityClient.fetch<Product[]>(PRODUCTS_BY_CATEGORY_QUERY, {
      categorySlug: categorie,
    }),
    sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
  ]);
  const current = categories.find((c) => c.slug.current === categorie);
  if (!current) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-4xl font-bold text-navy-900">
        {current.title}
      </h1>
      {current.description && (
        <p className="mt-2 text-navy-700">{current.description}</p>
      )}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
        <Link
          href="/boutique"
          className="rounded-full border border-navy-200 px-4 py-1.5 text-sm text-navy-700 hover:border-navy-700"
        >
          Tous
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/boutique/${c.slug.current}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              c.slug.current === categorie
                ? "bg-navy-900 text-white"
                : "border border-navy-200 text-navy-700 hover:border-navy-700"
            }`}
          >
            {c.title}
          </Link>
        ))}
      </nav>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
