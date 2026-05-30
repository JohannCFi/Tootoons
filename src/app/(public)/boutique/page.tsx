import { sanityClient } from "@/lib/sanity/client";
import { CATEGORIES_QUERY, PRODUCTS_LISTING_QUERY } from "@/lib/sanity/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import Link from "next/link";
import type { Category, Product } from "@/types/sanity";

export const revalidate = 3600;

export const metadata = {
  title: "Boutique",
  description: "Découvrez tous les produits Tootoons.",
};

export default async function BoutiquePage() {
  const [products, categories] = await Promise.all([
    sanityClient.fetch<Product[]>(PRODUCTS_LISTING_QUERY),
    sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-4xl font-bold text-navy-900">Boutique</h1>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
        <Link
          href="/boutique"
          className="rounded-full bg-navy-900 text-white px-4 py-1.5 text-sm"
        >
          Tous
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/boutique/${c.slug.current}`}
            className="rounded-full border border-navy-200 px-4 py-1.5 text-sm text-navy-700 hover:border-navy-700"
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
