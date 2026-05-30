import { formatPriceCents } from "@/lib/format";

export function PriceDisplay({
  price,
  compareAtPrice,
}: {
  price: number;
  compareAtPrice?: number;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-semibold text-navy-900">
        {formatPriceCents(price)}
      </span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-sm text-navy-300 line-through">
          {formatPriceCents(compareAtPrice)}
        </span>
      )}
    </div>
  );
}
