 
import { createClient } from "@sanity/client";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type WixRow = Record<string, string>;

export function wixPriceToCents(input: string): number {
  if (!input) return 0;
  const normalized = input.replace(",", ".").trim();
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ParsedProduct = {
  title: string;
  slug: string;
  shortDescription: string;
  priceCents: number;
  categoryTitle: string;
  stock: number;
  weight: number;
  imageUrls: string[];
  isPublished: boolean;
  sku?: string;
};

export function parseWixRow(row: WixRow): ParsedProduct | null {
  if (row.fieldType !== "Product") return null;
  if (!row.name) return null;
  const imageUrls = (row.productImageUrl ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: row.name.trim(),
    slug: slugify(row.name.trim()),
    shortDescription: (row.description ?? "").trim().slice(0, 200),
    priceCents: wixPriceToCents(row.price ?? ""),
    categoryTitle: (row.collection ?? "Divers").trim(),
    stock: Number.parseInt(row.inventory ?? "0", 10) || 0,
    weight: Number.parseInt(row.weight ?? "0", 10) || 0,
    imageUrls,
    isPublished: row.visible === "true",
    sku: row.sku || undefined,
  };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: tsx scripts/migrate-wix-to-sanity.ts <chemin-csv>");
    process.exit(1);
  }
  const raw = readFileSync(resolve(csvPath), "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as WixRow[];
  const products = rows
    .map(parseWixRow)
    .filter((p): p is ParsedProduct => p !== null);

  console.log(`${products.length} produits à migrer`);

  const client = createClient({
     
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
     
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: "2024-12-01",
     
    token: process.env.SANITY_WRITE_TOKEN!,
    useCdn: false,
  });

  // 1) Créer catégories
  const categoryTitles = [...new Set(products.map((p) => p.categoryTitle))];
  const categoryMap = new Map<string, string>();
  for (const title of categoryTitles) {
    const slug = slugify(title);
    const existing = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]{_id}`,
      { slug },
    );
    if (existing) {
      categoryMap.set(title, existing._id);
      continue;
    }
    const created = await client.create({
      _type: "category",
      title,
      slug: { _type: "slug", current: slug },
      order: 0,
    });
    categoryMap.set(title, created._id);
    console.log(`  ✓ catégorie créée : ${title}`);
  }

  // 2) Créer produits (sans images — upload manuel via Studio dans un 1er temps)
  for (const p of products) {
    const existing = await client.fetch(
      `*[_type == "product" && slug.current == $slug][0]{_id}`,
      { slug: p.slug },
    );
    const doc = {
      _type: "product",
      title: p.title,
      slug: { _type: "slug", current: p.slug },
      category: { _type: "reference", _ref: categoryMap.get(p.categoryTitle) },
      shortDescription: p.shortDescription,
      price: p.priceCents,
      stock: p.stock,
      weight: p.weight,
      isPublished: p.isPublished,
      isFeatured: false,
      images: [],
    };
    if (existing) {
      await client.patch(existing._id).set(doc).commit();
      console.log(`  ↻ maj : ${p.title}`);
    } else {
      await client.create(doc);
      console.log(`  ✓ créé : ${p.title}`);
    }
  }

  console.log("Migration terminée. Pense à uploader les images via le Studio.");
}

// Détection ESM-safe : tsx exécute en CJS par défaut ; si jamais le projet bascule en ESM,
// on s'appuie sur process.argv[1] (chemin du script lancé).
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith("migrate-wix-to-sanity.ts");
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
