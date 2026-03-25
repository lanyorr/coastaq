# Coastaq - Multi-Vendor Marketplace

## Overview

Coastaq is a full-stack multi-vendor marketplace built with React + Vite (frontend) and Express (backend) in a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/coastaq)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Cart**: Zustand (persisted to localStorage)
- **Payments**: Stripe Connect + PayPal (stubs - need API keys)
- **Image Upload**: Cloudinary (stub - needs API keys)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── coastaq/            # React + Vite marketplace frontend
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
- **shops**: id, name, description, logo, banner, isApproved, userId, subscriptionStatus (TRIAL/ACTIVE/EXPIRED/CANCELLED), trialEndsAt, subscriptionCurrentPeriodEnd
- **categories**: id, name, parentId (self-referential for hierarchy)
- **products**: id, title, description, price, stock, condition, location, images[], categoryId, shopId
- **orders**: id, userId, status, total, shipping fields, paymentMethod, paymentId
- **order_items**: id, orderId, productId, quantity, price

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
