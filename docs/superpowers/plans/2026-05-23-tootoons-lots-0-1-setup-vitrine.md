# Tootoons — Lots 0+1 (Setup + Vitrine) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le socle technique du nouveau tootoons.fr et livrer le catalogue navigable (home, boutique, fiche produit) avec les données produits migrées depuis Wix.

**Architecture:** Next.js 15 (App Router, TypeScript) + Tailwind + shadcn/ui pour le front, Sanity comme CMS source de vérité produits/blog/pages, déploiement Vercel. Aucune DB additionnelle dans ce lot.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind 4, shadcn/ui, Sanity v3, Vitest, Playwright, pnpm, ESLint + Prettier, Husky, Vercel.

**Spec source:** `docs/superpowers/specs/2026-05-23-tootoons-rebuild-design.md`

---

## File Structure (Lots 0 + 1)

```
tootoons/                             ← repo racine
├── .github/workflows/
│   └── ci.yml                        ← lint + typecheck + tests + build
├── .husky/
│   └── pre-commit                    ← lint-staged + typecheck
├── sanity/                           ← Sanity Studio embedded
│   ├── schemas/
│   │   ├── product.ts
│   │   ├── category.ts
│   │   ├── blogPost.ts
│   │   ├── page.ts
│   │   └── index.ts
│   ├── sanity.config.ts
│   └── sanity.cli.ts
├── scripts/
│   └── migrate-wix-to-sanity.ts      ← lit CSV Wix → push Sanity
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx            ← header + footer + main
│   │   │   ├── page.tsx              ← Home
│   │   │   ├── boutique/
│   │   │   │   ├── page.tsx          ← /boutique listing paginé
│   │   │   │   └── [categorie]/
│   │   │   │       └── page.tsx      ← /boutique/[slug]
│   │   │   └── produit/[slug]/
│   │   │       └── page.tsx          ← fiche produit
│   │   ├── studio/[[...tool]]/
│   │   │   └── page.tsx              ← /studio (Sanity Studio hosted)
│   │   ├── api/
│   │   │   └── revalidate/route.ts   ← webhook Sanity → revalidate ISR
│   │   ├── globals.css               ← Tailwind + tokens design
│   │   ├── layout.tsx                ← root layout (fonts, metadata)
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   └── PriceDisplay.tsx
│   │   ├── home/
│   │   │   ├── Hero.tsx
│   │   │   └── FeaturedProducts.tsx
│   │   └── ui/                       ← shadcn/ui components, customisés
│   ├── lib/
│   │   ├── sanity/
│   │   │   ├── client.ts             ← createClient + ISR cache
│   │   │   ├── image.ts              ← urlFor helper
│   │   │   └── queries.ts            ← GROQ queries centralisées
│   │   ├── format.ts                 ← centimes→€ formatter
│   │   └── seo.ts                    ← helpers OpenGraph + JSON-LD
│   └── types/
│       └── sanity.ts                 ← types Product, Category, etc.
├── tests/
│   ├── unit/
│   │   ├── format.test.ts
│   │   ├── sanity-queries.test.ts
│   │   └── migrate-wix.test.ts
│   └── e2e/
│       ├── home.spec.ts
│       ├── boutique.spec.ts
│       └── produit.spec.ts
├── public/
│   └── logo.svg
├── .env.local.example
├── .gitignore
├── .prettierrc
├── .eslintrc.json (ou eslint.config.mjs)
├── next.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── tailwind.config.ts (ou via @theme inline si Tailwind 4)
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── README.md
```

**Responsabilités par fichier :**
- `sanity/schemas/*.ts` : définition pure du modèle de données (1 fichier = 1 type)
- `src/lib/sanity/client.ts` : 1 seul client Sanity réutilisé partout (DRY)
- `src/lib/sanity/queries.ts` : toutes les GROQ queries en un seul endroit (visibilité + testabilité)
- `src/components/product/*` : composants atomiques produit, indépendants de la page
- `scripts/migrate-wix-to-sanity.ts` : script one-shot CSV → Sanity, testé unitairement sur la fonction de parsing

---

## Chunk 1 : Bootstrap & tooling

### Task 1.1 : Init du repo Next.js + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `README.md`

- [ ] **Step 1.1.1 : Préparer le dossier pour create-next-app**

Le dossier contient déjà `docs/` (le spec et ce plan). On le met de côté temporairement :
```powershell
Move-Item docs ../docs-tootoons-tmp
```

- [ ] **Step 1.1.2 : Init Next.js 15 avec template TypeScript + Tailwind + App Router**

```powershell
pnpm dlx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --eslint --no-turbopack --yes
```

Expected: création de `src/app/`, `tsconfig.json`, `next.config.ts`, `package.json`.

- [ ] **Step 1.1.3 : Restaurer le dossier docs**

```powershell
Move-Item ../docs-tootoons-tmp docs
```

- [ ] **Step 1.1.4 : Vérifier que le dev server démarre**

```powershell
pnpm dev
```
Expected: serveur sur http://localhost:3000, page d'accueil par défaut visible. Ctrl+C pour stopper.

- [ ] **Step 1.1.5 : Init git et premier commit**

```powershell
git init
git add .
git commit -m "chore: bootstrap Next.js 15 + Tailwind + TS"
```

### Task 1.2 : Installer les dépendances structurantes

- [ ] **Step 1.2.1 : Installer Sanity, ses adaptateurs Next, et libs utilitaires**

```powershell
pnpm add next-sanity sanity @sanity/image-url @sanity/vision groq
pnpm add -D @sanity/types
```

- [ ] **Step 1.2.2 : Installer shadcn/ui setup**

```powershell
pnpm dlx shadcn@latest init
```
Réponses :
- Style: **New York**
- Base color: **Slate**
- CSS variables: **yes**

- [ ] **Step 1.2.3 : Installer tests : Vitest + Testing Library + Playwright**

```powershell
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @playwright/test
pnpm dlx playwright install chromium
```

- [ ] **Step 1.2.4 : Installer Husky + lint-staged + Prettier**

```powershell
pnpm add -D husky lint-staged prettier prettier-plugin-tailwindcss
pnpm dlx husky init
```

- [ ] **Step 1.2.5 : Commit dépendances**

```powershell
git add .
git commit -m "chore: add Sanity, shadcn/ui, Vitest, Playwright, Husky"
```

### Task 1.3 : Configurer Vitest

**Files:** `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1.3.1 : Créer `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 1.3.2 : Créer `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 1.3.3 : Ajouter scripts dans `package.json`**

Éditer la section `"scripts"` pour ajouter (et vérifier que `"lint": "next lint"` y est — sinon l'ajouter) :
```json
"lint": "next lint",
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test",
"typecheck": "tsc --noEmit",
"format": "prettier --write ."
```

- [ ] **Step 1.3.4 : Écrire un smoke test pour valider Vitest**

`tests/unit/smoke.test.ts` :
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("vitest fonctionne", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 1.3.5 : Lancer le test**

```powershell
pnpm test
```
Expected: 1 test passed.

- [ ] **Step 1.3.6 : Commit**

```powershell
git add .
git commit -m "chore: configure Vitest + smoke test"
```

### Task 1.4 : Configurer Playwright

**Files:** `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1.4.1 : Créer `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```

- [ ] **Step 1.4.2 : Smoke E2E test**

`tests/e2e/smoke.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
```

- [ ] **Step 1.4.3 : Lancer**

```powershell
pnpm test:e2e
```
Expected: 1 passed.

- [ ] **Step 1.4.4 : Commit**

```powershell
git add .
git commit -m "chore: configure Playwright + smoke E2E"
```

### Task 1.5 : Husky + lint-staged + GitHub Actions CI

**Files:** `.husky/pre-commit`, `package.json` (lint-staged config), `.github/workflows/ci.yml`

- [ ] **Step 1.5.1 : Configurer lint-staged dans `package.json`**

Ajouter à la racine du `package.json` :
```json
"lint-staged": {
  "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,css}": ["prettier --write"]
}
```

- [ ] **Step 1.5.2 : Pre-commit hook**

Éditer `.husky/pre-commit` :
```sh
pnpm lint-staged
pnpm typecheck
```

- [ ] **Step 1.5.3 : CI GitHub Actions**

`.github/workflows/ci.yml` :
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 1.5.4 : Commit**

```powershell
git add .
git commit -m "ci: husky pre-commit + GitHub Actions"
```

### Task 1.6 : Push initial vers GitHub + connexion Vercel

> **Note utilisateur** : le repo GitHub sera créé manuellement par toi (autre compte). L'agent ne touche pas à `gh`. Les étapes ci-dessous présupposent que tu as créé un repo vide nommé `tootoons` (privé) et qu'il est prêt à recevoir un push.

- [ ] **Step 1.6.1 : Ajouter le remote (à toi de remplacer `<ton-user>`)**

```powershell
git remote add origin https://github.com/<ton-user>/tootoons.git
git branch -M main
git push -u origin main
```

- [ ] **Step 1.6.2 : Connecter Vercel au repo**

Via dashboard Vercel (manuel) :
- Import repo `tootoons` depuis ton compte GitHub
- Framework preset: **Next.js**
- Aucune variable d'env pour l'instant
- Deploy → vérifier preview URL fonctionne

- [ ] **Step 1.6.3 : Noter l'URL de preview dans le README**

Ajouter au `README.md` :
```markdown
# Tootoons

Refonte e-commerce. Voir [docs/superpowers/specs/](docs/superpowers/specs/).

- Preview : <URL_VERCEL>
- Production : https://www.tootoons.fr (basculé au lot 5)
```

- [ ] **Step 1.6.4 : Commit**

```powershell
git add README.md
git commit -m "docs: README initial + preview URL"
git push
```

---

## Chunk 2 : Sanity Studio & schémas

### Task 2.1 : Créer le projet Sanity

- [ ] **Step 2.1.1 : Login Sanity CLI**

```powershell
pnpm dlx sanity@latest login
```
Choisir GitHub.

- [ ] **Step 2.1.2 : Init projet Sanity**

```powershell
pnpm dlx sanity@latest init --env --dataset production --output-path .
```
- New project, nom : **Tootoons**
- Dataset: **production**
- Visibility: **public** (les contenus seront lus en GROQ public)
- Use TypeScript: **yes**
- Embedded Sanity Studio: **yes** (intégré à Next.js)

Cela crée `sanity.config.ts`, `sanity.cli.ts` et copie le `projectId` dans `.env.local`.

- [ ] **Step 2.1.3 : Déplacer les fichiers vers la structure cible**

```powershell
New-Item -ItemType Directory -Force "sanity/schemas"
Move-Item sanity.config.ts sanity/
Move-Item sanity.cli.ts sanity/
if (Test-Path schemas) { Move-Item schemas/* sanity/schemas/ -Force; Remove-Item schemas }
```

- [ ] **Step 2.1.4 : Mettre à jour les imports dans `sanity/sanity.config.ts`**

Le fichier généré importe ses schémas depuis `./schemas/index` (ou similaire). Après le move, ce chemin reste correct (le import est relatif au fichier `sanity.config.ts` qui est maintenant dans `sanity/`, donc `./schemas` pointe vers `sanity/schemas/`). Vérifier manuellement le fichier. Si Sanity a généré `import {schemaTypes} from './schemas'`, ne rien changer. Sinon, ajuster pour pointer vers `./schemas/index`.

Vérifier également `sanity/sanity.cli.ts` qui ne contient en général que des paramètres projectId, rien à changer.

- [ ] **Step 2.1.5 : Commit**

```powershell
git add .
git commit -m "feat: init Sanity Studio embedded"
```

### Task 2.2 : Schéma `category` (le plus simple, on commence par là)

**Files:** `sanity/schemas/category.ts`, `tests/unit/sanity-schemas.test.ts`

- [ ] **Step 2.2.1 : Test du schéma category**

`tests/unit/sanity-schemas.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import category from "../../sanity/schemas/category";

describe("category schema", () => {
  it("a les champs requis : title, slug, image, description, order", () => {
    const names = category.fields.map((f: any) => f.name);
    expect(names).toEqual(
      expect.arrayContaining(["title", "slug", "image", "description", "order"])
    );
  });

  it("title est requis", () => {
    const title = category.fields.find((f: any) => f.name === "title");
    expect(title?.validation).toBeDefined();
  });
});
```

- [ ] **Step 2.2.2 : Lancer → FAIL**

```powershell
pnpm test sanity-schemas
```
Expected: FAIL (fichier inexistant).

- [ ] **Step 2.2.3 : Créer `sanity/schemas/category.ts`**

```ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "category",
  title: "Catégorie",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      validation: (r) => r.required().min(2).max(60),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 80 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "order",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Ordre manuel",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
```

- [ ] **Step 2.2.4 : Lancer → PASS**

```powershell
pnpm test sanity-schemas
```

- [ ] **Step 2.2.5 : Commit**

```powershell
git add .
git commit -m "feat(sanity): add category schema"
```

### Task 2.3 : Schéma `product`

**Files:** `sanity/schemas/product.ts`, étendre `tests/unit/sanity-schemas.test.ts`

- [ ] **Step 2.3.1 : Ajouter tests product**

Ajouter à `tests/unit/sanity-schemas.test.ts` :
```ts
import product from "../../sanity/schemas/product";

describe("product schema", () => {
  const names = product.fields.map((f: any) => f.name);

  it("contient tous les champs spécifiés", () => {
    expect(names).toEqual(
      expect.arrayContaining([
        "title", "slug", "category", "description", "shortDescription",
        "images", "price", "compareAtPrice", "variants", "stock",
        "weight", "tags", "isPublished", "isFeatured",
        "seoTitle", "seoDescription",
      ])
    );
  });

  it("price est requis et en centimes", () => {
    const price = product.fields.find((f: any) => f.name === "price");
    expect(price?.type).toBe("number");
    expect(price?.validation).toBeDefined();
  });

  it("variants[].stock cohabite avec stock top-level (mutex documentée)", () => {
    const stock = product.fields.find((f: any) => f.name === "stock");
    const variants = product.fields.find((f: any) => f.name === "variants");
    expect(stock).toBeDefined();
    expect(variants).toBeDefined();
  });
});
```

- [ ] **Step 2.3.2 : FAIL**

```powershell
pnpm test sanity-schemas
```

- [ ] **Step 2.3.3 : Créer `sanity/schemas/product.ts`**

```ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "product",
  title: "Produit",
  type: "document",
  groups: [
    { name: "info", title: "Infos" },
    { name: "media", title: "Médias" },
    { name: "pricing", title: "Prix & stock" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Nom",
      group: "info",
      validation: (r) => r.required().min(2).max(120),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "info",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      group: "info",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "shortDescription",
      type: "text",
      title: "Résumé (cartes produit)",
      group: "info",
      rows: 2,
      validation: (r) => r.max(200),
    }),
    defineField({
      name: "description",
      type: "array",
      title: "Description complète",
      group: "info",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "images",
      type: "array",
      group: "media",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: "price",
      type: "number",
      title: "Prix TTC (en centimes)",
      group: "pricing",
      description: "Ex : 1990 pour 19,90 €",
      validation: (r) => r.required().integer().min(0),
    }),
    defineField({
      name: "compareAtPrice",
      type: "number",
      title: "Prix barré (en centimes, optionnel)",
      group: "pricing",
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "variants",
      type: "array",
      group: "pricing",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", title: "Nom (ex: Taille M)", validation: (r) => r.required() },
            { name: "sku", type: "string" },
            { name: "stock", type: "number", validation: (r) => r.integer().min(0) },
            {
              name: "priceDelta",
              type: "number",
              title: "Delta prix (centimes, peut être négatif)",
              initialValue: 0,
            },
          ],
        },
      ],
    }),
    defineField({
      name: "stock",
      type: "number",
      title: "Stock (si pas de variants)",
      description: "Ignoré si des variants sont définis",
      group: "pricing",
      hidden: ({ document }) => Array.isArray(document?.variants) && (document.variants as any[]).length > 0,
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "weight",
      type: "number",
      title: "Poids (g)",
      group: "pricing",
      validation: (r) => r.integer().min(0),
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "info",
    }),
    defineField({
      name: "isPublished",
      type: "boolean",
      title: "Publié",
      group: "info",
      initialValue: false,
    }),
    defineField({
      name: "isFeatured",
      type: "boolean",
      title: "Mis en avant (home)",
      group: "info",
      initialValue: false,
    }),
    defineField({ name: "seoTitle", type: "string", group: "seo" }),
    defineField({ name: "seoDescription", type: "text", group: "seo", rows: 2 }),
  ],
  preview: {
    select: { title: "title", media: "images.0", price: "price" },
    prepare: ({ title, media, price }) => ({
      title,
      subtitle: price ? `${(price / 100).toFixed(2)} €` : "Prix manquant",
      media,
    }),
  },
});
```

- [ ] **Step 2.3.4 : PASS**

```powershell
pnpm test sanity-schemas
```

- [ ] **Step 2.3.5 : Commit**

```powershell
git add .
git commit -m "feat(sanity): add product schema with variants + mutex stock"
```

### Task 2.4 : Schémas `blogPost` et `page`

**Files:** `sanity/schemas/blogPost.ts`, `sanity/schemas/page.ts`

- [ ] **Step 2.4.1 : `sanity/schemas/blogPost.ts`**

```ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Article de blog",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "excerpt", type: "text", rows: 3, validation: (r) => r.max(300) }),
    defineField({ name: "coverImage", type: "image", options: { hotspot: true } }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "publishedAt", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "isPublished", type: "boolean", initialValue: false }),
  ],
  orderings: [
    {
      title: "Date publication ↓",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});
```

- [ ] **Step 2.4.2 : `sanity/schemas/page.ts`**

```ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "page",
  title: "Page CMS",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "seoTitle", type: "string" }),
    defineField({ name: "seoDescription", type: "text", rows: 2 }),
  ],
});
```

- [ ] **Step 2.4.3 : Index des schémas `sanity/schemas/index.ts`**

```ts
import product from "./product";
import category from "./category";
import blogPost from "./blogPost";
import page from "./page";

export const schemaTypes = [product, category, blogPost, page];
```

- [ ] **Step 2.4.4 : Wire dans `sanity/sanity.config.ts`**

Modifier le `schema` :
```ts
import { schemaTypes } from "./schemas";
// ...
schema: { types: schemaTypes },
```

- [ ] **Step 2.4.5 : Page studio dans Next.js**

Créer `src/app/studio/[[...tool]]/page.tsx` :
```tsx
"use client";
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity/sanity.config";

export const dynamic = "force-static";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

- [ ] **Step 2.4.6 : Lancer le Studio en local**

```powershell
pnpm dev
```
Aller sur http://localhost:3000/studio → login → vérifier que les 4 types apparaissent.

- [ ] **Step 2.4.7 : Commit**

```powershell
git add .
git commit -m "feat(sanity): blogPost + page schemas, studio mounted at /studio"
```

---

## Chunk 3 : Client Sanity + queries + types

### Task 3.1 : Variables d'environnement

**Files:** `.env.local.example`, `.env.local`

- [ ] **Step 3.1.1 : `.env.local.example`**

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-12-01
SANITY_API_READ_TOKEN=
SANITY_WRITE_TOKEN=
SANITY_REVALIDATE_SECRET=
```

- [ ] **Step 3.1.2 : Renseigner `.env.local`** (déjà créé par sanity init, vérifier qu'il a `NEXT_PUBLIC_SANITY_PROJECT_ID` et `NEXT_PUBLIC_SANITY_DATASET`. Ajouter les deux autres :
  - `SANITY_API_READ_TOKEN` : depuis sanity.io/manage → API → Tokens → "Viewer"
  - `SANITY_REVALIDATE_SECRET` : générer une chaîne aléatoire avec `[guid]::NewGuid().Guid` en PowerShell

- [ ] **Step 3.1.3 : Vérifier `.gitignore` contient `.env*.local`** (par défaut Next.js l'ajoute)

- [ ] **Step 3.1.4 : Commit**

```powershell
git add .env.local.example
git commit -m "chore: env.local.example"
```

### Task 3.2 : Client Sanity

**Files:** `src/lib/sanity/client.ts`, `src/lib/sanity/image.ts`

- [ ] **Step 3.2.1 : Test client + env validation**

`tests/unit/sanity-client.test.ts` :
```ts
import { describe, it, expect } from "vitest";

describe("sanity client", () => {
  it("throw si variables d'env manquantes", async () => {
    const original = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    await expect(async () => {
      await import("../../src/lib/sanity/client?invalidate=" + Date.now());
    }).rejects.toThrow();
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = original;
  });
});
```

- [ ] **Step 3.2.2 : FAIL**

- [ ] **Step 3.2.3 : Créer `src/lib/sanity/client.ts`**

```ts
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-12-01";

if (!projectId) throw new Error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID");
if (!dataset) throw new Error("Missing NEXT_PUBLIC_SANITY_DATASET");

// useCdn: false côté server (Next.js) car on s'appuie sur l'ISR Next pour le cache.
// Le CDN Sanity (useCdn:true) ignore l'option { next: { revalidate } } de fetch et
// peut servir des contenus jusqu'à 60s décalés — on préfère que Next gère le cache.
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  stega: false,
});

export const sanityServerClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token: process.env.SANITY_API_READ_TOKEN,
});
```

- [ ] **Step 3.2.4 : Helper image `src/lib/sanity/image.ts`**

```ts
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}
```

- [ ] **Step 3.2.5 : PASS**

```powershell
pnpm test sanity-client
```

- [ ] **Step 3.2.6 : Commit**

```powershell
git add .
git commit -m "feat(sanity): typed client + image helper"
```

### Task 3.3 : Queries GROQ centralisées + types

**Files:** `src/lib/sanity/queries.ts`, `src/types/sanity.ts`

- [ ] **Step 3.3.1 : Types `src/types/sanity.ts`**

```ts
export type Category = {
  _id: string;
  title: string;
  slug: { current: string };
  image?: any;
  description?: string;
  order: number;
};

export type ProductVariant = {
  name: string;
  sku?: string;
  stock?: number;
  priceDelta?: number;
};

export type Product = {
  _id: string;
  title: string;
  slug: { current: string };
  category: { _ref: string; title?: string; slug?: { current: string } };
  shortDescription?: string;
  description?: any[];
  images: any[];
  price: number;
  compareAtPrice?: number;
  variants?: ProductVariant[];
  stock?: number;
  weight?: number;
  tags?: string[];
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

export type BlogPost = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  coverImage?: any;
  body?: any[];
  publishedAt: string;
  isPublished: boolean;
};
```

- [ ] **Step 3.3.2 : Test queries (mock client)**

`tests/unit/sanity-queries.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import * as queries from "../../src/lib/sanity/queries";

describe("GROQ queries", () => {
  it("expose les queries critiques", () => {
    expect(queries.PRODUCTS_LISTING_QUERY).toContain("_type == \"product\"");
    expect(queries.PRODUCT_BY_SLUG_QUERY).toContain("slug.current == $slug");
    expect(queries.CATEGORIES_QUERY).toContain("_type == \"category\"");
    expect(queries.FEATURED_PRODUCTS_QUERY).toContain("isFeatured == true");
  });

  it("PRODUCTS_LISTING filtre isPublished", () => {
    expect(queries.PRODUCTS_LISTING_QUERY).toContain("isPublished == true");
  });
});
```

- [ ] **Step 3.3.3 : FAIL** (`pnpm test sanity-queries`)

- [ ] **Step 3.3.4 : Créer `src/lib/sanity/queries.ts`**

```ts
import { groq } from "next-sanity";

export const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(order asc) {
    _id, title, slug, image, description, order
  }
`;

const PRODUCT_PROJECTION = groq`{
  _id, title, slug, shortDescription, images, price, compareAtPrice,
  variants, stock, isFeatured,
  "category": category->{ _id, title, slug }
}`;

export const PRODUCTS_LISTING_QUERY = groq`
  *[_type == "product" && isPublished == true]
  | order(_createdAt desc)
  ${PRODUCT_PROJECTION}
`;

export const PRODUCTS_BY_CATEGORY_QUERY = groq`
  *[_type == "product" && isPublished == true && category->slug.current == $categorySlug]
  | order(_createdAt desc)
  ${PRODUCT_PROJECTION}
`;

export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "product" && slug.current == $slug && isPublished == true][0]{
    ...,
    "category": category->{ _id, title, slug }
  }
`;

export const FEATURED_PRODUCTS_QUERY = groq`
  *[_type == "product" && isPublished == true && isFeatured == true]
  | order(_createdAt desc)[0...8]
  ${PRODUCT_PROJECTION}
`;

export const PRODUCT_SLUGS_QUERY = groq`
  *[_type == "product" && isPublished == true && defined(slug.current)][].slug.current
`;

export const CATEGORY_SLUGS_QUERY = groq`
  *[_type == "category" && defined(slug.current)][].slug.current
`;
```

- [ ] **Step 3.3.5 : PASS**

```powershell
pnpm test sanity-queries
```

- [ ] **Step 3.3.6 : Commit**

```powershell
git add .
git commit -m "feat(sanity): GROQ queries + TS types"
```

---

## Chunk 4 : Script de migration Wix → Sanity

### Task 4.1 : Fonction de parsing CSV

**Files:** `scripts/migrate-wix-to-sanity.ts`, `tests/unit/migrate-wix.test.ts`

Le CSV Wix exporté a des colonnes type : `handleId, fieldType, name, description, productImageUrl, collection, sku, ribbon, price, surcharge, visible, discountMode, discountValue, inventory, weight, cost, productOptionName1, productOptionType1, productOptionDescription1, ...`

On va parser ça et le mapper vers Sanity.

- [ ] **Step 4.1.1 : Installer csv parse**

```powershell
pnpm add -D csv-parse @sanity/client tsx
```

- [ ] **Step 4.1.2 : Tests parsing**

`tests/unit/migrate-wix.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { parseWixRow, wixPriceToCents } from "../../scripts/migrate-wix-to-sanity";

describe("wixPriceToCents", () => {
  it("convertit '19.90' → 1990", () => {
    expect(wixPriceToCents("19.90")).toBe(1990);
  });
  it("convertit '19,90' → 1990 (séparateur français)", () => {
    expect(wixPriceToCents("19,90")).toBe(1990);
  });
  it("retourne 0 si vide", () => {
    expect(wixPriceToCents("")).toBe(0);
  });
});

describe("parseWixRow", () => {
  it("mappe une ligne CSV vers la forme attendue", () => {
    const row = {
      handleId: "mug-cat",
      fieldType: "Product",
      name: "Mug Chat",
      description: "Joli mug avec un chat",
      productImageUrl: "https://static.wixstatic.com/x.jpg",
      collection: "Mugs",
      sku: "MUG-001",
      price: "19,90",
      visible: "true",
      inventory: "10",
      weight: "300",
    };
    const result = parseWixRow(row);
    expect(result).toMatchObject({
      title: "Mug Chat",
      slug: "mug-chat",
      shortDescription: "Joli mug avec un chat",
      priceCents: 1990,
      categoryTitle: "Mugs",
      stock: 10,
      weight: 300,
      imageUrls: ["https://static.wixstatic.com/x.jpg"],
      isPublished: true,
    });
  });

  it("ignore les lignes fieldType !== Product (variants Wix)", () => {
    const row = { fieldType: "Custom Text Field", name: "Personnalisation" };
    expect(parseWixRow(row)).toBeNull();
  });
});
```

- [ ] **Step 4.1.3 : FAIL** (`pnpm test migrate-wix`)

- [ ] **Step 4.1.4 : Implémentation `scripts/migrate-wix-to-sanity.ts`**

```ts
/* eslint-disable no-console */
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
    .replace(/[\u0300-\u036f]/g, "")
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
  const rows = parse(raw, { columns: true, skip_empty_lines: true }) as WixRow[];
  const products = rows.map(parseWixRow).filter((p): p is ParsedProduct => p !== null);

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

  // 2) Créer produits (sans images pour l'instant — upload manuel ou Lot 1.X)
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
      images: [], // à uploader manuellement via Studio dans un 1er temps
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
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("migrate-wix-to-sanity.ts");
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 4.1.5 : PASS** (`pnpm test migrate-wix`)

- [ ] **Step 4.1.6 : Commit**

```powershell
git add .
git commit -m "feat(scripts): Wix CSV parser + Sanity migration"
```

> **Note** : l'exécution réelle du script attend l'export CSV Wix de la commerçante. Pour l'instant on a les fonctions testées. On exécutera en Chunk 7 quand le CSV sera fourni.

---

## Chunk 5 : Design system & layout shell

### Task 5.1 : Tokens de design (couleurs, fonts)

**Files:** `src/app/globals.css`, `src/app/layout.tsx`

- [ ] **Step 5.1.1 : Ajouter Google Fonts dans `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Tootoons — Cadeaux personnalisables", template: "%s | Tootoons" },
  description: "Boutique française de cadeaux personnalisables : textile, mugs, gourdes, papeterie.",
  metadataBase: new URL("https://www.tootoons.fr"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased text-navy-900 bg-white">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5.1.2 : Tokens couleurs dans `src/app/globals.css`**

Remplacer le contenu par :
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-navy-50: #f5f7fa;
  --color-navy-100: #e4e9f2;
  --color-navy-200: #c1cbe0;
  --color-navy-300: #94a4c4;
  --color-navy-500: #4e6493;
  --color-navy-700: #283865;
  --color-navy-900: #142046;
  --color-cream: #fdfaf3;
  --color-accent: #ffb547;       /* touche chaude pour CTA secondaires */

  --font-sans: var(--font-manrope);
  --font-serif: var(--font-fraunces);

  --radius-card: 1rem;
}

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply text-base leading-relaxed; }
  h1, h2, h3 { font-family: var(--font-serif); @apply tracking-tight; }
}
```

- [ ] **Step 5.1.3 : Smoke build**

```powershell
pnpm dev
```
Vérifier que la home renvoie 200 et que les fonts sont chargées.

- [ ] **Step 5.1.4 : Commit**

```powershell
git add .
git commit -m "feat(design): tokens couleur navy + fonts Manrope/Fraunces"
```

### Task 5.2 : Header

**Files:** `src/components/layout/Header.tsx`, `tests/e2e/header.spec.ts`

- [ ] **Step 5.2.0 : Installer lucide-react + plugin typography (utilisé en Task 6.4)**

```powershell
pnpm add lucide-react @portabletext/react
pnpm add -D @tailwindcss/typography
```

- [ ] **Step 5.2.1 : Test E2E**

`tests/e2e/header.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("header présente nav principale et icônes utilitaires", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Tootoons" })).toBeVisible();
  await expect(page.getByRole("link", { name: /boutique/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /panier/i })).toBeVisible();
});
```

- [ ] **Step 5.2.2 : FAIL** (`pnpm test:e2e header`)

- [ ] **Step 5.2.3 : Créer `src/components/layout/Header.tsx`**

```tsx
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
        <nav className="hidden md:flex gap-8 text-sm font-medium" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-navy-700 hover:text-navy-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/account" aria-label="Mon compte" className="text-navy-700 hover:text-navy-900">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/panier" aria-label="Panier" className="text-navy-700 hover:text-navy-900">
            <ShoppingBag className="h-5 w-5" />
          </Link>
          <button className="md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5.2.4 : Wire dans layout public** (créé en 5.4)

- [ ] **Step 5.2.5 : Commit (après wire)**

### Task 5.3 : Footer

**Files:** `src/components/layout/Footer.tsx`

- [ ] **Step 5.3.1 : Créer `src/components/layout/Footer.tsx`**

```tsx
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
          <p className="mt-2 text-sm">Création française de cadeaux personnalisables. Atelier à Vienne 🇫🇷.</p>
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
```

### Task 5.4 : Layout public (header + main + footer)

**Files:** `src/app/(public)/layout.tsx`

- [ ] **Step 5.4.1 : Créer `src/app/(public)/layout.tsx`**

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5.4.2 : Déplacer la home par défaut dans le group**

```powershell
Move-Item src/app/page.tsx src/app/(public)/page.tsx
```

Modifier `src/app/(public)/page.tsx` pour un placeholder temporaire :
```tsx
export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <h1>Tootoons — bientôt</h1>
    </div>
  );
}
```

- [ ] **Step 5.4.3 : Lancer E2E header**

```powershell
pnpm test:e2e header
```
Expected: PASS.

- [ ] **Step 5.4.4 : Commit**

```powershell
git add .
git commit -m "feat(layout): header + footer + public layout group"
```

---

## Chunk 6 : Pages publiques (Home, Boutique, Produit)

### Task 6.1 : Composant ProductCard

**Files:** `src/components/product/ProductCard.tsx`, `src/components/product/PriceDisplay.tsx`, `src/lib/format.ts`

- [ ] **Step 6.1.1 : Tests `format.ts`**

`tests/unit/format.test.ts` :
```ts
import { describe, it, expect } from "vitest";
import { formatPriceCents } from "../../src/lib/format";

// Intl.NumberFormat fr-FR utilise une espace insécable étroite (U+202F) ou
// insécable (U+00A0) avant € selon la version d'ICU. On normalise pour
// rendre les tests stables quel que soit l'environnement.
const normalize = (s: string) => s.replace(/[  ]/g, " ");

describe("formatPriceCents", () => {
  it("1990 → '19,90 €'", () => {
    expect(normalize(formatPriceCents(1990))).toBe("19,90 €");
  });
  it("0 → '0,00 €'", () => {
    expect(normalize(formatPriceCents(0))).toBe("0,00 €");
  });
  it("4080 → '40,80 €'", () => {
    expect(normalize(formatPriceCents(4080))).toBe("40,80 €");
  });
});
```

- [ ] **Step 6.1.2 : FAIL**

- [ ] **Step 6.1.3 : Créer `src/lib/format.ts`**

```ts
const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function formatPriceCents(cents: number): string {
  return formatter.format(cents / 100);
}
```

- [ ] **Step 6.1.4 : PASS**

- [ ] **Step 6.1.5 : `src/components/product/PriceDisplay.tsx`**

```tsx
import { formatPriceCents } from "@/lib/format";

export function PriceDisplay({ price, compareAtPrice }: { price: number; compareAtPrice?: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-semibold text-navy-900">{formatPriceCents(price)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-sm text-navy-300 line-through">{formatPriceCents(compareAtPrice)}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 6.1.6 : `src/components/product/ProductCard.tsx`**

```tsx
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
      <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
    </Link>
  );
}
```

- [ ] **Step 6.1.7 : Commit**

```powershell
git add .
git commit -m "feat(product): ProductCard + PriceDisplay + formatPriceCents"
```

### Task 6.2 : Home page (Hero + featured products)

**Files:** `src/app/(public)/page.tsx`, `src/components/home/Hero.tsx`, `src/components/home/FeaturedProducts.tsx`

- [ ] **Step 6.2.1 : `src/components/home/Hero.tsx`**

```tsx
import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <p className="text-sm uppercase tracking-widest text-navy-500">Création française</p>
        <h1 className="mt-4 font-serif text-5xl lg:text-6xl font-bold text-navy-900">
          Faites plaisir avec nos cadeaux personnalisables
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-navy-700">
          Textile, mugs, gourdes, papeterie : nos créations imprimées en France, faites avec amour dans notre atelier à Vienne.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/boutique" className="rounded-full bg-navy-900 text-white px-6 py-3 font-medium hover:bg-navy-700">
            Découvrir la boutique
          </Link>
          <Link href="/personnalisation" className="rounded-full border border-navy-200 px-6 py-3 font-medium text-navy-700 hover:border-navy-700">
            Demander un devis perso
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6.2.2 : `src/components/home/FeaturedProducts.tsx`**

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { FEATURED_PRODUCTS_QUERY } from "@/lib/sanity/queries";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/sanity";

export async function FeaturedProducts() {
  const products = await sanityClient.fetch<Product[]>(FEATURED_PRODUCTS_QUERY, {}, {
    next: { revalidate: 3600 },
  });
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="font-serif text-3xl font-bold text-navy-900">Nos coups de cœur</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6.2.3 : Home page**

`src/app/(public)/page.tsx` :
```tsx
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
    </>
  );
}
```

- [ ] **Step 6.2.4 : E2E home**

`tests/e2e/home.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("home affiche hero + CTA boutique", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/personnalisables/i);
  await expect(page.getByRole("link", { name: /découvrir la boutique/i })).toBeVisible();
});
```

- [ ] **Step 6.2.5 : Lancer E2E**

```powershell
pnpm test:e2e home
```
Expected: PASS.

- [ ] **Step 6.2.6 : Commit**

```powershell
git add .
git commit -m "feat(home): hero + featured products (ISR 1h)"
```

### Task 6.3 : Boutique listing + filtres catégorie

**Files:** `src/app/(public)/boutique/page.tsx`, `src/app/(public)/boutique/[categorie]/page.tsx`, `src/components/product/ProductGrid.tsx`

- [ ] **Step 6.3.1 : `src/components/product/ProductGrid.tsx`**

```tsx
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types/sanity";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-navy-500">Aucun produit pour le moment.</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6.3.2 : `src/app/(public)/boutique/page.tsx`**

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { CATEGORIES_QUERY, PRODUCTS_LISTING_QUERY } from "@/lib/sanity/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import Link from "next/link";
import type { Category, Product } from "@/types/sanity";

export const revalidate = 3600;

export const metadata = {
  title: "Boutique",
  description: "Découvrez tous les produits Tootoons.",
};

export default async function BoutiquePage() {
  const [products, categories] = await Promise.all([
    sanityClient.fetch<Product[]>(PRODUCTS_LISTING_QUERY),
    sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-4xl font-bold text-navy-900">Boutique</h1>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
        <Link href="/boutique" className="rounded-full bg-navy-900 text-white px-4 py-1.5 text-sm">
          Tous
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/boutique/${c.slug.current}`}
            className="rounded-full border border-navy-200 px-4 py-1.5 text-sm text-navy-700 hover:border-navy-700"
          >
            {c.title}
          </Link>
        ))}
      </nav>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6.3.3 : `src/app/(public)/boutique/[categorie]/page.tsx`**

```tsx
import { sanityClient } from "@/lib/sanity/client";
import {
  CATEGORIES_QUERY,
  CATEGORY_SLUGS_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
} from "@/lib/sanity/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Category, Product } from "@/types/sanity";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<string[]>(CATEGORY_SLUGS_QUERY);
  return slugs.map((slug) => ({ categorie: slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ categorie: string }> }) {
  const { categorie } = await params;
  const [products, categories] = await Promise.all([
    sanityClient.fetch<Product[]>(PRODUCTS_BY_CATEGORY_QUERY, { categorySlug: categorie }),
    sanityClient.fetch<Category[]>(CATEGORIES_QUERY),
  ]);
  const current = categories.find((c) => c.slug.current === categorie);
  if (!current) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-4xl font-bold text-navy-900">{current.title}</h1>
      {current.description && <p className="mt-2 text-navy-700">{current.description}</p>}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
        <Link href="/boutique" className="rounded-full border border-navy-200 px-4 py-1.5 text-sm text-navy-700 hover:border-navy-700">
          Tous
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/boutique/${c.slug.current}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              c.slug.current === categorie
                ? "bg-navy-900 text-white"
                : "border border-navy-200 text-navy-700 hover:border-navy-700"
            }`}
          >
            {c.title}
          </Link>
        ))}
      </nav>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6.3.4 : E2E boutique**

`tests/e2e/boutique.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("boutique liste les produits", async ({ page }) => {
  await page.goto("/boutique");
  await expect(page.getByRole("heading", { name: "Boutique" })).toBeVisible();
});
```

- [ ] **Step 6.3.5 : Commit**

```powershell
git add .
git commit -m "feat(boutique): listing + filtres catégorie"
```

### Task 6.4 : Fiche produit

**Files:** `src/app/(public)/produit/[slug]/page.tsx`, `src/components/product/ProductGallery.tsx`

- [ ] **Step 6.4.1 : `src/components/product/ProductGallery.tsx`**

```tsx
"use client";
import Image from "next/image";
import { useState } from "react";
import { urlFor } from "@/lib/sanity/image";

export function ProductGallery({ images, alt }: { images: any[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (!images || images.length === 0) {
    return <div className="aspect-square bg-navy-100 rounded-card" />;
  }
  return (
    <div className="grid gap-4">
      <div className="aspect-square overflow-hidden rounded-card bg-navy-50">
        <Image
          src={urlFor(images[active]).width(1200).height(1200).url()}
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
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`aspect-square w-20 shrink-0 overflow-hidden rounded-lg ${
                i === active ? "ring-2 ring-navy-900" : "ring-1 ring-navy-200"
              }`}
            >
              <Image
                src={urlFor(img).width(160).height(160).url()}
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
```

- [ ] **Step 6.4.2 : `src/app/(public)/produit/[slug]/page.tsx`**

```tsx
import { sanityClient } from "@/lib/sanity/client";
import { PRODUCT_BY_SLUG_QUERY, PRODUCT_SLUGS_QUERY } from "@/lib/sanity/queries";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { PortableText } from "@portabletext/react";
import { notFound } from "next/navigation";
import type { Product } from "@/types/sanity";
import type { Metadata } from "next";

export const revalidate = 600;

export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<string[]>(PRODUCT_SLUGS_QUERY);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await sanityClient.fetch<Product | null>(PRODUCT_BY_SLUG_QUERY, { slug });
  if (!product) return { title: "Produit introuvable" };
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await sanityClient.fetch<Product | null>(PRODUCT_BY_SLUG_QUERY, { slug });
  if (!product) notFound();

  return (
    <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 lg:grid-cols-2">
      <ProductGallery images={product.images} alt={product.title} />
      <div>
        <p className="text-sm uppercase tracking-widest text-navy-500">
          {product.category?.title ?? "Produit"}
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-navy-900">{product.title}</h1>
        <div className="mt-4">
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
        {product.shortDescription && (
          <p className="mt-6 text-navy-700">{product.shortDescription}</p>
        )}
        <button
          className="mt-8 rounded-full bg-navy-900 text-white px-6 py-3 font-medium hover:bg-navy-700"
          // Branchement panier en Lot 2
        >
          Ajouter au panier
        </button>
        {product.description && (
          <div className="prose prose-navy mt-12 max-w-none">
            <PortableText value={product.description} />
          </div>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 6.4.3 : E2E produit**

Préalable : créer un produit de test dans Sanity Studio (via `/studio`) ou laisser le test conditionnel.

`tests/e2e/produit.spec.ts` :
```ts
import { test, expect } from "@playwright/test";

test("fiche produit charge sans crash", async ({ page }) => {
  await page.goto("/boutique");
  const firstCard = page.locator("a[href^='/produit/']").first();
  const hasProduct = await firstCard.count();
  test.skip(hasProduct === 0, "Aucun produit en base, test sauté");
  await firstCard.click();
  await expect(page.getByRole("button", { name: /ajouter au panier/i })).toBeVisible();
});
```

- [ ] **Step 6.4.4 : Commit**

```powershell
git add .
git commit -m "feat(produit): fiche produit avec gallery + portable text"
```

---

## Chunk 7 : Migration données réelles + revalidate webhook + déploiement

### Task 7.1 : Webhook Sanity → revalidate ISR

**Files:** `src/app/api/revalidate/route.ts`

- [ ] **Step 7.1.1 : Endpoint revalidate**

```ts
import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Node runtime requis pour le raw body (signature HMAC) — pas Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { isValidSignature, body } = await parseBody<{ _type: string; slug?: { current?: string } }>(
    req,
    process.env.SANITY_REVALIDATE_SECRET,
  );
  if (!isValidSignature) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  if (body._type === "product") {
    revalidatePath("/");
    revalidatePath("/boutique");
    if (body.slug?.current) revalidatePath(`/produit/${body.slug.current}`);
  }
  if (body._type === "category") {
    revalidatePath("/boutique");
  }
  if (body._type === "blogPost") {
    revalidatePath("/blog");
    if (body.slug?.current) revalidatePath(`/blog/${body.slug.current}`);
  }
  return NextResponse.json({ revalidated: true, type: body._type });
}
```

- [ ] **Step 7.1.2 : Configurer webhook côté Sanity manage**

Dashboard Sanity → API → Webhooks → Add :
- URL : `https://<vercel-preview>/api/revalidate`
- Filter : `_type in ["product","category","blogPost"]`
- Secret : valeur de `SANITY_REVALIDATE_SECRET`
- HTTP method : POST

- [ ] **Step 7.1.3 : Commit**

```powershell
git add .
git commit -m "feat(api): revalidate webhook from Sanity"
```

### Task 7.2 : Sitemap + robots

**Files:** `src/app/sitemap.ts`, `src/app/robots.ts`

- [ ] **Step 7.2.1 : `src/app/sitemap.ts`**

```ts
import { sanityClient } from "@/lib/sanity/client";
import { PRODUCT_SLUGS_QUERY, CATEGORY_SLUGS_QUERY } from "@/lib/sanity/queries";
import type { MetadataRoute } from "next";

const SITE = "https://www.tootoons.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, categorySlugs] = await Promise.all([
    sanityClient.fetch<string[]>(PRODUCT_SLUGS_QUERY),
    sanityClient.fetch<string[]>(CATEGORY_SLUGS_QUERY),
  ]);
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly" },
    { url: `${SITE}/boutique`, lastModified: now, changeFrequency: "daily" },
    { url: `${SITE}/personnalisation`, lastModified: now },
    { url: `${SITE}/contact`, lastModified: now },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: "weekly" },
    ...categorySlugs.map((s) => ({ url: `${SITE}/boutique/${s}`, lastModified: now })),
    ...productSlugs.map((s) => ({ url: `${SITE}/produit/${s}`, lastModified: now })),
  ];
}
```

- [ ] **Step 7.2.2 : `src/app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/studio"] }],
    sitemap: "https://www.tootoons.fr/sitemap.xml",
  };
}
```

- [ ] **Step 7.2.3 : Commit**

```powershell
git add .
git commit -m "feat(seo): sitemap + robots"
```

### Task 7.3 : Configurer variables Vercel + redéployer

- [ ] **Step 7.3.1 : Ajouter env vars Vercel (dashboard)**

Pour environnements `Production`, `Preview`, `Development` :
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET=production`
- `NEXT_PUBLIC_SANITY_API_VERSION=2024-12-01`
- `SANITY_API_READ_TOKEN`
- `SANITY_REVALIDATE_SECRET`

- [ ] **Step 7.3.2 : Trigger un nouveau deploy**

```powershell
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push
```

- [ ] **Step 7.3.3 : Vérifier sur l'URL Vercel preview**

- Home charge ✓
- `/boutique` charge ✓ (peut être vide si pas de produits)
- `/studio` charge ✓ (login Sanity demandé)

### Task 7.4 : Migration réelle des produits Wix

> **Prérequis utilisateur** : récupérer le fichier `export-wix.csv` depuis le dashboard Wix de la commerçante. Placer dans `data/export-wix.csv` (gitignored).

- [ ] **Step 7.4.1 : Ajouter `data/` à `.gitignore`**

- [ ] **Step 7.4.2 : Créer un Sanity API token "Editor"** (sanity.io/manage → API → Tokens) et l'ajouter à `.env.local` :
```
SANITY_WRITE_TOKEN=skXXXX
```

- [ ] **Step 7.4.3 : Dry run du script** (sur un sous-ensemble de 3 lignes pour tester)

```powershell
$env:SANITY_WRITE_TOKEN="skXXXX"; pnpm tsx scripts/migrate-wix-to-sanity.ts data/export-wix.csv
```

Inspecter les logs : nombre de produits, catégories créées.

- [ ] **Step 7.4.4 : Vérifier dans Sanity Studio que tout est OK**

- [ ] **Step 7.4.5 : Upload manuel des images** (premier passage) via le Studio. Pour chaque produit, télécharger l'image depuis l'URL Wix, l'uploader. (Une amélioration future automatiserait ça, mais hors-scope V1.)

> **Alternative** : pour gagner du temps si beaucoup de produits, créer un sous-script `migrate-wix-images.ts` qui télécharge chaque `imageUrls[0]` et l'attache au produit existant via `client.assets.upload`. Optionnel.

- [ ] **Step 7.4.6 : Marquer quelques produits comme `isFeatured` pour la home**

Via le Studio, 4-8 produits → `isFeatured = true`.

- [ ] **Step 7.4.7 : Sur l'URL Vercel preview, vérifier que la home et la boutique affichent les produits**

### Task 7.5 : Documentation & passation

**Files:** `README.md`, `docs/RUNBOOK.md`

- [ ] **Step 7.5.1 : Créer `docs/RUNBOOK.md`**

```md
# Runbook Tootoons

## Modifier un produit
1. Aller sur https://<preview>/studio
2. Login (compte Sanity invité)
3. Onglet "Produit" → édition → Publish

## Migrer un nouvel export Wix
```bash
$env:SANITY_WRITE_TOKEN="skXXXX"
pnpm tsx scripts/migrate-wix-to-sanity.ts data/export-wix.csv
```

## Variables d'environnement
Voir `.env.local.example`.
```

- [ ] **Step 7.5.2 : Lighthouse audit manuel**

Sur l'URL Vercel preview, ouvrir Chrome DevTools → onglet Lighthouse → mode "Navigation" + categories Performance/SEO/Accessibility/Best Practices. Lancer sur `/` puis sur une page produit. Cible : **≥ 90** sur chaque catégorie.

Si un score est < 90, noter les recommandations Lighthouse les plus impactantes dans un nouveau fichier `docs/lighthouse-followup.md` et créer une issue. Le critère d'acceptation est satisfait dès que les scores ≥ 90 sont atteints sur les deux URLs.

- [ ] **Step 7.5.3 : Commit final**

```powershell
git add .
git commit -m "docs: runbook + readme final lots 0+1"
git push
```

---

## Critères d'acceptation (Lots 0+1)

- [ ] CI GitHub Actions verte sur main
- [ ] Vercel preview répond 200 sur `/`, `/boutique`, `/studio`
- [ ] Sanity Studio liste les 4 types (`product`, `category`, `blogPost`, `page`)
- [ ] Au moins 5 produits visibles dans la boutique (réels migrés depuis Wix)
- [ ] Au moins 1 produit `isFeatured` apparaît sur la home
- [ ] Cliquer sur un produit → `/produit/[slug]` charge avec gallery
- [ ] Tests unitaires verts : `pnpm test` (Vitest)
- [ ] Tests E2E verts : `pnpm test:e2e` (Playwright)
- [ ] Build prod sans warning bloquant : `pnpm build`
- [ ] Lighthouse ≥ 90 (Performance/SEO/Accessibilité) sur `/` et `/produit/[slug]`

---

## Hors-scope (reportés au prochain plan)

- Panier (Lot 2)
- Checkout Stripe (Lot 2)
- Webhook Stripe + mails Resend (Lot 2)
- Comptes Clerk (Lot 3)
- Admin commandes (Lot 3)
- Blog `/blog`, `/blog/[slug]` (Lot 4)
- Pages CGV/Mentions/Confidentialité (Lot 4)
- Carte cadeau (Lot 4)
- Redirections 301 depuis URLs Wix (Lot 4)
- Bandeau cookies (Lot 4)
- DNS final + Stripe live (Lot 5)
