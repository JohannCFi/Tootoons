import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity/image";
import { PriceDisplay } from "./PriceDisplay";
import type { Product } from "@/types/sanity";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return (
    <Link href={`/produit/${product.slug.current}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-card bg-navy-50">
        {image ? (
          <Image
            src={urlFor(image).width(600).height(600).url()}
            alt={product.title}
            width={600}
            height={600}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-navy-100" />
        )}
      </div>
      <h3 className="mt-3 font-serif text-lg text-navy-900">{product.title}</h3>
      <PriceDisplay
        price={product.price}
        compareAtPrice={product.compareAtPrice}
      />
    </Link>
  );
}
