# Coastaq - Multi-Vendor Marketplace

## Overview

Coastaq is a full-stack multi-vendor marketplace built with React + Vite (frontend) and Express (backend) in a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/coastaq)
- **Mobile App**: Expo React Native (artifacts/coastaq-mobile) — iOS/Android/Web, shares the same Express backend
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Cart**: Zustand (persisted to localStorage)
- **Payments**: PayPal (sandbox active; PayPal buttons + hosted card fields)
- **Image Upload**: Multer (local uploads at /api/uploads/)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   ├── coastaq/            # React + Vite marketplace frontend
│   └── coastaq-mobile/     # Expo React Native mobile app (iOS/Android/Web)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema, DB connection, shared seed data
│       └── src/
│           └── seed-data.ts # 125 sample products (one per subcategory), shared by seed & bootstrap
├── scripts/
│   └── src/seed.ts         # Dev database seeder (uses @workspace/db seed-data)
└── pnpm-workspace.yaml
```

## Database Schema

- **users**: id, email, passwordHash, name, role (BUYER/SELLER/ADMIN)
- **shops**: id, name, description, logo, banner, isApproved, userId, subscriptionStatus, slug (unique, auto-generated from name), email, website, phone, whatsapp, address, city, country, businessHours, accentColor, facebookUrl, instagramUrl, tiktokUrl, twitterUrl, youtubeUrl
- **categories**: id, name, parentId (self-referential for hierarchy)
- **products**: id, title, description, price, stock, condition, location, images[], categoryId, shopId
- **orders**: id, userId, status, total, shipping fields, paymentMethod, paymentId, paymentStatus (pending/escrowed/released/refunded/disputed), escrowAmount, sellerAmount (95%), platformFee (5%), sellerId, escrowStartedAt, deliveredAt, releasedAt, disputeReason, trackingNumber, courierName
- **order_items**: id, orderId, productId, quantity, price
- **escrow_transactions**: id, orderId, sellerId, type (deposit/release/refund/dispute), amount, note, createdAt
- **conversations**: id, productId, buyerId, sellerId, lastMessageAt, createdAt — one conversation per buyer+seller+product
- **messages**: id, conversationId, senderId, content, readAt, createdAt

## API Routes

All routes under `/api`:
- `POST /api/auth/register` - Register (BUYER or SELLER)
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (requires token)
- `GET /api/products` - List products (supports ?search=, ?categoryId=, ?shopId=, ?page=, ?limit=)
- `POST /api/products` - Create product (SELLER/ADMIN)
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/categories` - List categories (hierarchical)
- `POST /api/categories` - Create category (ADMIN)
- `GET /api/shops` - List approved shops
- `GET /api/shops/my` - Get seller's shop
- `PUT /api/shops/my` - Update seller's shop
- `GET /api/shops/:id` - Get shop by ID
- `GET /api/orders` - List buyer's orders
- `GET /api/orders/seller` - List seller's orders
- `GET /api/orders/:id` - Get order
- `POST /api/checkout/stripe` - Create Stripe session (needs STRIPE_SECRET_KEY)
- `POST /api/checkout/paypal` - Create PayPal order (needs PAYPAL_CLIENT_ID)
- `POST /api/checkout/manual` - Place order (for demo/testing)
- `GET /api/admin/sellers` - List sellers (ADMIN)
- `POST /api/admin/sellers/:id/approve` - Approve seller (ADMIN)
- `POST /api/admin/sellers/:id/reject` - Reject seller (ADMIN)
- `GET /api/admin/analytics` - Platform analytics (ADMIN)
- `POST /api/upload/image` - Upload image (needs CLOUDINARY_* keys)
- `GET /api/escrow/seller/summary` - Seller escrow earnings summary (SELLER)
- `GET /api/escrow/seller/orders` - Seller orders with escrow details (SELLER)
- `GET /api/escrow/seller/transactions` - Seller escrow transaction history (SELLER)
- `POST /api/escrow/:orderId/confirm-receipt` - Buyer confirms receipt, releases escrow (BUYER)
- `POST /api/escrow/:orderId/dispute` - Buyer opens dispute, holds escrow (BUYER)
- `GET /api/escrow/admin/orders` - List all escrow orders with ?status= filter (ADMIN)
- `GET /api/escrow/admin/stats` - Platform escrow statistics (ADMIN)
- `POST /api/escrow/admin/:orderId/release` - Admin releases escrow to seller (ADMIN)
- `POST /api/escrow/admin/:orderId/refund` - Admin refunds escrow to buyer (ADMIN)
- `GET /api/subscription/status` - Get seller subscription status (SELLER)
- `POST /api/subscription/activate` - Activate/renew subscription for 30 days (SELLER) — demo stub, no real payment
- `POST /api/subscription/cancel` - Cancel subscription (SELLER)

## Demo Accounts

- **Admin**: admin@coastaq.com / admin123
- **Seller**: seller@coastaq.com / seller123
- **Buyer**: buyer@coastaq.com / buyer123

## Environment Variables

Already set (via Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret

Needed for full functionality:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Seeding

Run seed script: `pnpm --filter @workspace/scripts run seed`

This creates:
- 5 parent categories (Electronics, Fashion, Home & Garden, Vehicles, Sports) with subcategories
- 1 admin user, 1 approved seller, 1 buyer
- 1 approved shop (TechHaven Store) with 6 sample products

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`
- `artifacts/*` are leaf workspace packages checked with `tsc --noEmit`
- Root `tsconfig.json` is a solution file for libs only

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively builds
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types

## Platform Fee

Stripe Connect is set up for 10% platform fee (90% goes to sellers). This requires Stripe API keys and seller Stripe Connect onboarding to function.

## Localization Layer

Full i18n/l10n system in `artifacts/coastaq/src/lib/locale/`:

- **`currencies.ts`** — 45 currencies with symbols, codes, locales; `FALLBACK_RATES` map; `fetchExchangeRates()` fetches live rates from `open.er-api.com/v6/latest/USD` (no API key, CORS-friendly), cached in localStorage `cq_fx_rates` with 24h TTL
- **`translations.ts`** — 12 languages: English, French, Arabic, Swahili, Spanish, German, Portuguese, Chinese, Hindi, Japanese, Korean, Turkish; ~50 keys each; `LANGUAGES` map with flag emoji + rtl flag; `COUNTRY_DEFAULTS` map for auto-detection; `t()` function with en fallback
- **`context.tsx`** — `LocaleProvider` + `useLocale()` hook; auto-detects language from `navigator.language` + `Intl.DateTimeFormat().resolvedOptions().timeZone`; RTL support via `document.documentElement.dir`; `formatPrice(usdAmount)` converts and formats to selected currency; persists selections in `cq_lang` and `cq_currency` localStorage keys
- **`LocaleSwitcher.tsx`** — compact flag+language and currency dropdowns in Navbar (hidden on xs, visible sm+; also in mobile hamburger menu)

### Translated components
- `Navbar.tsx` — all nav text via `t()`
- `Home.tsx` — hero title/subtitle/search/buttons/stats, escrow strip, sidebar, product grid header
- `ProductCard.tsx` — price via `formatPrice()`, condition badge, escrow badge via `t()`
- `ProductDetails.tsx` — main price via `formatPrice()`
- `Cart.tsx` — all strings via `t()`, all prices via `formatPrice()`
