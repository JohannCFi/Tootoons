"use client";
import Image from "next/image";
import { useState } from "react";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "@/lib/sanity/image";

export function ProductGallery({
  images,
  alt,
}: {
  images: unknown[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  if (!images || images.length === 0) {
    return <div className="aspect-square bg-navy-100 rounded-card" />;
  }
  return (
    <div className="grid gap-4">
      <div className="aspect-square overflow-hidden rounded-card bg-navy-50">
        <Image
          src={urlFor(images[active] as SanityImageSource)
            .width(1200)
            .height(1200)
            .url()}
          alt={alt}
          width={1200}
          height={1200}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`aspect-square w-20 shrink-0 overflow-hidden rounded-lg ${
                i === active ? "ring-2 ring-navy-900" : "ring-1 ring-navy-200"
              }`}
            >
              <Image
                src={urlFor(img as SanityImageSource)
                  .width(160)
                  .height(160)
                  .url()}
                alt={`${alt} miniature ${i + 1}`}
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
