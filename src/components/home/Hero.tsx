import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <p className="text-sm uppercase tracking-widest text-navy-500">
          Création française
        </p>
        <h1 className="mt-4 font-serif text-5xl lg:text-6xl font-bold text-navy-900">
          Faites plaisir avec nos cadeaux personnalisables
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-navy-700">
          Textile, mugs, gourdes, papeterie : nos créations imprimées en France,
          faites avec amour dans notre atelier à Vienne.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/boutique"
            className="rounded-full bg-navy-900 text-white px-6 py-3 font-medium hover:bg-navy-700 transition-colors"
          >
            Découvrir la boutique
          </Link>
          <Link
            href="/personnalisation"
            className="rounded-full border border-navy-200 px-6 py-3 font-medium text-navy-700 hover:border-navy-700 transition-colors"
          >
            Demander un devis perso
          </Link>
        </div>
      </div>
    </section>
  );
}
