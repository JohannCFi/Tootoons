import Link from "next/link";

const COLUMNS = [
  {
    title: "Boutique",
    links: [
      { href: "/boutique", label: "Tous les produits" },
      { href: "/personnalisation", label: "Personnalisation" },
      { href: "/carte-cadeau", label: "Carte cadeau" },
    ],
  },
  {
    title: "Marque",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Mentions",
    links: [
      { href: "/cgv", label: "CGV" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-navy-100 bg-navy-50 text-navy-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-xl font-bold text-navy-900">Tootoons</p>
          <p className="mt-2 text-sm">
            Création française de cadeaux personnalisables. Atelier à Vienne.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-semibold text-navy-900">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-navy-900">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-navy-100 py-4 text-center text-xs">
        © {new Date().getFullYear()} Tootoons. Tous droits réservés.
      </div>
    </footer>
  );
}
