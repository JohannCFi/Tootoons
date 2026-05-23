# Refonte tootoons.fr — Spec de conception

**Date** : 2026-05-23
**Auteur** : Johann (j14.cali@gmail.com)
**Statut** : Design approuvé, prêt pour plan d'implémentation

---

## 1. Contexte

Tootoons est une boutique en ligne de cadeaux personnalisables (textile, mugs, gourdes, papeterie, accessoires, décoration) basée à Vienne, avec atelier de fabrication et impression française. La commerçante utilise aujourd'hui Wix avec l'offre **Business à 40,80 €/mois** (domaine offert la 1ère année uniquement).

### Objectifs de la refonte

1. **Réduire le coût récurrent** sous les 40,80 €/mois, idéalement à quelques euros.
2. **Préserver toutes les fonctionnalités actuelles** : catalogue ~50-70 produits, panier, paiement en ligne, comptes clients, blog, cartes cadeaux, avis, formulaire de personnalisation sur devis.
3. **Garantir l'autonomie de la commerçante** sur les tâches récurrentes (ajout/modif produits, suivi commandes, blog). Le développeur peut intervenir pour les tâches non urgentes.
4. **Stabilité & sérénité** : pas de maintenance régulière à sa charge, hébergement sûr, sauvegardes intégrées.

### Hors-scope V1

- Newsletter (séparée, à faire plus tard).
- Configurateur de personnalisation côté client (la personnalisation reste un formulaire de contact pour devis).
- Décrément automatique du stock après commande (V2 si nécessaire).

---

## 2. Architecture globale

```
┌─────────────────────────── Visiteur (tootoons.fr) ──────────────────────────┐
                                       │
                ┌──────────────────────▼────────────────────────┐
                │     Next.js 15 (App Router) hébergé Vercel    │
                │  • SSG + ISR pour pages publiques             │
                │  • API Routes / Server Actions                │
                │  • Panier client (Context + localStorage)     │
                │  • Middleware Clerk (auth + admin gate)       │
                └───┬─────────────┬─────────────┬───────────┬───┘
                    │             │             │           │
            ┌───────▼─────┐ ┌─────▼──────┐ ┌────▼─────┐ ┌──▼─────────┐
            │   Sanity    │ │   Stripe   │ │  Clerk   │ │  Resend    │
            │ produits +  │ │ Checkout + │ │  users + │ │ mails      │
            │ blog + CMS  │ │ webhooks   │ │  auth    │ │ transac.   │
            └─────────────┘ └────────────┘ └──────────┘ └────────────┘
```

### Sources de vérité (single source of truth par domaine)

| Domaine | Service |
|---|---|
| Produits, catégories, blog, pages CMS | **Sanity** |
| Utilisateurs, sessions | **Clerk** |
| Commandes, paiements, clients Stripe, cartes cadeaux, codes promo | **Stripe** |
| Mails transactionnels | **Resend** |
| Tracking expéditions | **Stripe metadata** (pas de DB séparée) |

**Aucune base de données à provisionner ni maintenir.**

---

## 3. Modèle de données (Sanity)

### Schéma `product`

| Champ | Type | Notes |
|---|---|---|
| `title` | string (requis) | Nom produit |
| `slug` | slug (auto depuis title) | URL |
| `category` | référence → `category` | |
| `description` | portableText | Description riche |
| `shortDescription` | text | Pour cartes produit |
| `images` | array<image> | Hotspot Sanity activé |
| `price` | number | En centimes (évite erreurs flottants) |
| `compareAtPrice` | number (optionnel) | Prix barré |
| `variants` | array<{ name, sku, stock, priceDelta }> | Tailles/couleurs |
| `stock` | number | Si `variants` est vide. Si `variants.length > 0`, ce champ est masqué dans le Studio et ignoré côté code (validation Sanity custom). |
| `weight` | number | grammes, pour calcul frais de port |
| `tags` | array<string> | |
| `isPublished` | boolean | |
| `isFeatured` | boolean | Pour la home |
| `seoTitle`, `seoDescription` | string | SEO |

### Schéma `category`

| Champ | Type |
|---|---|
| `title` | string |
| `slug` | slug |
| `image` | image |
| `description` | text |
| `order` | number |

### Schéma `blogPost`

| Champ | Type |
|---|---|
| `title`, `slug`, `excerpt` | string/text |
| `coverImage` | image |
| `body` | portableText |
| `publishedAt` | datetime |
| `isPublished` | boolean |

### Schéma `page` (pour CGV, mentions, personnalisation, etc.)

| Champ | Type |
|---|---|
| `title`, `slug` | string/slug |
| `body` | portableText |
| `seoTitle`, `seoDescription` | string |

### Ce qui n'est PAS dans Sanity (volontaire)

- **Commandes** → Stripe. Statut d'expédition + numéro de suivi stockés dans `metadata` de la Stripe Checkout Session.
- **Clients** → Stripe Customers + Clerk. Lien : `stripeCustomerId` stocké dans `publicMetadata` Clerk.
- **Avis** → widget externe (Trustpilot free ou Judge.me free tier).
- **Cartes cadeaux** → produit Stripe dédié + codes promo natifs Stripe.

---

## 4. Pages et flux

### Pages publiques

| Route | Rendu | Source données |
|---|---|---|
| `/` | SSG + ISR 1h | Sanity (hero, produits featured, blog récent) |
| `/boutique` | SSG + ISR 1h | Sanity (paginé) |
| `/boutique/[categorie]` | SSG + ISR 1h | Sanity filtré |
| `/produit/[slug]` | SSG + ISR 10min | Sanity |
| `/panier` | Client | localStorage |
| `/checkout` | Server Action | crée Stripe Checkout Session → redirect |
| `/checkout/success?session_id=...` | Server | vérifie session, vide panier |
| `/personnalisation` | SSG + form | Sanity page + formulaire Resend |
| `/blog` | SSG + ISR 1h | Sanity |
| `/blog/[slug]` | SSG + ISR 10min | Sanity |
| `/carte-cadeau` | SSG | Produit Stripe spécial |
| `/contact` | SSG + form | Resend |
| `/cgv`, `/mentions-legales`, `/confidentialite` | SSG | Sanity (`page`) |

### Pages compte (Clerk)

| Route | Description |
|---|---|
| `/sign-in`, `/sign-up` | Composants Clerk |
| `/account` | Profil + adresses |
| `/account/orders` | Liste commandes via Stripe (filtrées par `stripeCustomerId`) |
| `/account/orders/[id]` | Détail + tracking |

**Note importante** : les commandes passées en mode invité ne sont rattachées à aucun compte Clerk. Elles n'apparaissent dans aucun `/account/orders`. Le client invité reçoit la confirmation et le suivi uniquement par e-mail. S'il crée un compte ultérieurement avec la même adresse mail, on ne réconcilie PAS automatiquement (V2 envisageable).

### Pages admin (Clerk + rôle `admin` dans `publicMetadata`)

| Route | Description |
|---|---|
| `/admin` | Dashboard (CA mois, commandes à expédier) |
| `/admin/orders` | Toutes commandes, filtres "à expédier / expédiée" |
| `/admin/orders/[id]` | Marquer expédiée + ajouter numéro suivi |

### Sanity Studio

Déployé séparément sur `studio.tootoons.fr` (hosting gratuit Sanity). C'est là que la commerçante ajoute/édite produits et articles de blog.

### Flux d'achat

```
1. Client clique "Ajouter au panier"
   → ajout state React + persist localStorage

2. Client va sur /panier, ajuste

3. Client clique "Commander"
   → si non connecté : modal Clerk "se connecter ou continuer en invité"
   → si connecté et stripeCustomerId absent : on en crée un (lazy) et on le persiste dans publicMetadata Clerk
   → POST /api/checkout (Server Action)
     • crée Stripe Checkout Session
     • line_items en mode `price_data` ad-hoc (prix lu depuis Sanity, source de vérité)
       → on NE synchronise PAS de Stripe `Price` objects ; Sanity reste la seule source de vérité prix
     • shipping rate (gratuit si total ≥ 49€, sinon X€ — placeholder à confirmer)
     • tax behavior "inclusive" (TVA incluse dans prix affichés)
     • metadata minimaliste = { userId, shippingStatus: "pending" }
       → on ne duplique PAS les items dans metadata (cap Stripe 500 chars/clé)
       → la liste des items est récupérable via `stripe.checkout.sessions.retrieve(id, { expand: ["line_items"] })`
   → redirect vers Stripe Checkout (page hébergée Stripe)

4. Client paie (CB, Apple Pay, Google Pay, PayPal en option)

5. Stripe redirige → /checkout/success
   → on vide le panier client
   → on affiche confirmation

6. En parallèle : webhook /api/webhooks/stripe sur événement `checkout.session.completed`
   → vérif signature Stripe
   → dedup obligatoire sur event.id (Upstash Redis free tier) car les mails Resend ne sont PAS idempotents
   → envoi mail confirmation client (Resend, template HTML)
   → envoi mail "nouvelle commande" à la commerçante
```

### Flux expédition

```
1. Commerçante se connecte à /admin/orders
2. Voit les commandes "à expédier"
3. Clique sur une commande → /admin/orders/[id]
4. Saisit numéro de suivi + transporteur → "Marquer expédiée"
   → Server Action : update metadata Stripe (shippingStatus, trackingNumber, carrier)
   → mail au client (Resend) "votre commande est partie + tracking"
```

---

## 5. Sécurité, fiabilité, edge cases

### Authentification

- **Clerk** gère sessions, CSRF, brute force, rate limiting.
- Rôle `admin` = flag `publicMetadata.role = "admin"` set depuis le dashboard Clerk.
- Middleware Next.js `middleware.ts` : redirect `/admin/*` non-admin vers `/` + log 403.

### Paiement

- **Aucune donnée carte ne transite chez nous** (Stripe Checkout hébergé = conformité PCI gratuite).
- Webhook signé avec `STRIPE_WEBHOOK_SECRET`.
- **Idempotence obligatoire** : dedup sur `event.id` via **Upstash Redis free tier** (10 000 commandes/jour gratuites). Nécessaire car le webhook envoie des mails Resend qui ne sont pas idempotents — un événement dupliqué = un mail dupliqué côté client. On stocke `processed:{event.id}` avec TTL 7 jours.

### Gestion du stock V1

- Lecture du stock Sanity pour bloquer l'ajout panier si épuisé.
- Pas de décrément automatique : la commerçante décrémente manuellement après expédition.
- Justification : faible volume (~50-70 SKUs, faible trafic), simplicité maximale.
- **V2 envisageable** : décrément auto via webhook `checkout.completed` qui écrit dans Sanity (réversible si annulation/remboursement).

### Edge cases couverts en V1

| Scénario | Comportement |
|---|---|
| Client ferme l'onglet pendant checkout | Stripe Checkout expire en 24h, pas de commande |
| Paiement refusé | Stripe retourne le client au panier intact |
| Reload `/checkout/success` | Vérif `session_id` server-side, idempotent |
| Image Sanity manquante | Placeholder + log erreur |
| Sanity en panne | ISR sert la version cachée (Vercel garde 7j) |
| Webhook Stripe en double | Dedup `event.id` |
| Accès `/admin` non admin | 403 + redirect home |
| Stock épuisé pendant ajout panier | Message "rupture", désactivation bouton |

### Performance & SEO

- Images Sanity via CDN + `next/image` (WebP/AVIF, lazy load).
- Pages produits prerendered (SSG) → Lighthouse cible ≥ 90 (Performance, SEO, Accessibilité).
- Schema.org `Product` + `Offer` (Google Shopping ready).
- Sitemap dynamique (`app/sitemap.ts` lit Sanity).
- Redirections 301 depuis anciennes URLs Wix dans `vercel.json` (préserve SEO existant).

### Sauvegardes & DR

- **Sanity** : historique versions natif (rollback illimité).
- **Stripe** : historique commandes/paiements natif.
- **Code** : GitHub (source of truth code).
- **Vercel** : rollback instantané depuis n'importe quel commit (`vercel rollback`).

Aucun backup manuel à programmer. RPO/RTO < 5 minutes.

### Conformité RGPD

- Bandeau cookies minimal (Vercel Analytics cookieless, Stripe gère ses propres cookies).
- Mentions légales + CGV + Politique de confidentialité éditables dans Sanity.
- Droit à l'oubli : `/account/delete` → Clerk delete + **anonymisation** du Stripe Customer (nom = "Client supprimé", email vidé, métadonnées vidées). On ne supprime PAS le Customer Stripe car Stripe l'interdit s'il a un historique de paiement — l'anonymisation satisfait le RGPD tout en préservant la comptabilité.

---

## 6. Découpage en lots livrables

| Lot | Durée estimée | Livrable | Statut go/no-go |
|---|---|---|---|
| **0 — Setup + script de migration** | 1 j | Repos initialisés, comptes services créés, Sanity Studio déployé, **script CSV-Wix → Sanity testé** | Bloque tout |
| **1 — Vitrine** | 2-3 j | Catalogue navigable (home, /boutique, /produit/[slug]), exécution du script de migration produits | Déployable seul |
| **2 — Panier + checkout** | 2-3 j | Achat fonctionnel en Stripe test mode, mails transactionnels | Déployable seul |
| **3 — Comptes + admin** | 2 j | Clerk wiring, espace client, mini back-office expédition | Déployable seul |
| **4 — Pages annexes + SEO** | 1-2 j | Blog, CGV/mentions, carte cadeau, sitemap, redirections 301, cookies | Déployable seul |
| **5 — Go-live** | ½ j | Stripe en live, DNS basculé, commande test réelle, formation Sanity (1h), décommissionnement Wix | Final |

**Total : ~10-13 jours de dev**, étalable.

---

## 7. Coût récurrent post-lancement

| Service | Coût mensuel |
|---|---|
| Vercel Hobby | 0 € |
| Sanity free | 0 € |
| Clerk free (< 10k MAU) | 0 € |
| Resend free (< 3000 mails/mois) | 0 € |
| Domaine `.fr` (Cloudflare ou OVH) | ~0,85 € (10 €/an) |
| Stripe | 0 € fixe + 1,4 % + 0,25 €/transaction |
| **Total fixe** | **~1 €/mois** |

**Économies vs Wix Business** : ~480 €/an (39,80 € × 12). Les frais de transaction Stripe existent aussi chez Wix donc pas un différentiel.

---

## 7bis. Direction artistique

S'inspirer **fidèlement** du style visuel actuel de tootoons.fr pour préserver l'identité de marque :

| Aspect | Direction |
|---|---|
| Palette | Blanc dominant, accents bleu marine (navy). Touches colorées via les visuels produits eux-mêmes (cartoon, illustrations). |
| Typographie | Sans-serif contemporaine, bonne lisibilité. Police pour titres légèrement plus marquée. À choisir parmi Google Fonts (gratuit, performant) : par ex. Inter / Manrope (corps) + Fraunces ou Bricolage Grotesque (titres) pour évoquer le côté artisanal. |
| Ton éditorial | Chaleureux, accessible, "fun" sans être enfantin. Tutoiement à confirmer avec elle (le site actuel utilise le vouvoiement implicite "Faites plaisir..."). |
| Photographie | Lifestyle + studio, pas minimaliste. Garder les visuels existants au max via la migration CSV. |
| Identité graphique | Logo cartoon Tootoons préservé tel quel. Drapeau français visible (mention "Création française"). |
| Mise en page | Aérée, structure en silos thématiques (textile / mugs / gourdes / etc.), hero large format en home. |
| Iconographie | Style illustré pour les icônes utilitaires (panier, compte) — pas d'icônes système Material génériques. |
| Animations | Discrètes, transitions douces. Pas d'effets WAOW. |

Composants UI à construire avec **shadcn/ui** comme base technique mais **fortement customisés** (couleurs, radius, typo) pour éviter le look "AI generic" / "shadcn default". Référence : reproduire l'ambiance Wix actuelle en mieux (plus rapide, plus net), pas un look complètement neuf.

---

## 8. Stack technique récapitulative

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (composants) |
| CMS | Sanity (free tier) |
| Auth | Clerk (free tier) |
| Paiement | Stripe Checkout + webhooks |
| Mails transactionnels | Resend |
| Hébergement | Vercel Hobby |
| Dedup webhooks | Upstash Redis (free tier) |
| Domaine | Cloudflare Registrar ou OVH |
| Analytics | Vercel Web Analytics (cookieless) |
| Avis clients | Widget externe (à choisir : Trustpilot ou Judge.me) |
| Repo | GitHub |

---

## 9. Points à confirmer avec la commerçante

À valider avec elle avant lot 5 (go-live) :

- [ ] Tarifs frais de port exacts (placeholder : gratuit ≥ 49 €, X € sinon).
- [ ] Choix du service d'avis clients (Trustpilot vs Judge.me vs autre).
- [ ] Liste exhaustive des transporteurs proposés (pour le formulaire admin tracking).
- [ ] Validation visuelle du design (on copie le look Wix actuel par défaut).
- [ ] Texte CGV / mentions légales actuels (à reprendre tels quels).
- [ ] Accès au compte Wix pour export CSV produits + export clients.

---

## 10. Vérification end-to-end

Avant chaque déploiement, exécuter :

1. **Tests unitaires** : `pnpm test` (composants critiques : panier, calcul total, validation form)
2. **Tests E2E** (Playwright) : parcours d'achat complet en mode test Stripe
3. **Lighthouse CI** : score Performance/SEO/Accessibilité ≥ 90 sur page d'accueil et fiche produit
4. **Webhook Stripe** : `stripe trigger checkout.session.completed` en local + vérif mail reçu via Resend
5. **Build prod** : `pnpm build` doit passer sans warning bloquant
6. **Preview Vercel** : recette manuelle d'au moins 1 parcours d'achat complet

Pour le go-live (lot 5) :
- 1 commande test réelle avec carte personnelle (montant minimal), puis remboursement Stripe.
- Vérif mail client + mail commerçante reçus.
- Vérif `/admin/orders` affiche la commande.
- Vérif redirections 301 sur 3-5 URLs Wix critiques.
