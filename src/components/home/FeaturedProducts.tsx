import { sanityClient } from "@/lib/sanity/client";
import { FEATURED_PRODUCTS_QUERY } from "@/lib/sanity/queries";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/sanity";

export async function FeaturedProducts() {
  const products = await sanityClient.fetch<Product[]>(
    FEATURED_PRODUCTS_QUERY,
    {},
    { next: { revalidate: 3600 } },
  );
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="font-serif text-3xl font-bold text-navy-900">
        Nos coups de cœur
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
