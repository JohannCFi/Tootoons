import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";

const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/personnalisation", label: "Personnalisation" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-navy-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-bold text-navy-900">
          Tootoons
        </Link>
        <nav
          className="hidden md:flex gap-8 text-sm font-medium"
          aria-label="Navigation principale"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-navy-700 hover:text-navy-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/account"
            aria-label="Mon compte"
            className="text-navy-700 hover:text-navy-900"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/panier"
            aria-label="Panier"
            className="text-navy-700 hover:text-navy-900"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <button className="md:hidden" aria-label="Menu" type="button">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
