const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function formatPriceCents(cents: number): string {
  return formatter.format(cents / 100);
}
