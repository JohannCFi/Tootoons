import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Tootoons — Cadeaux personnalisables",
    template: "%s | Tootoons",
  },
  description:
    "Boutique française de cadeaux personnalisables : textile, mugs, gourdes, papeterie.",
  metadataBase: new URL("https://www.tootoons.fr"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased text-navy-900 bg-white">
        {children}
      </body>
    </html>
  );
}
