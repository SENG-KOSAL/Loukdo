# Loukdo POS

Point of Sale system built with Next.js.

## Tech Stack

| Layer        | Choice                        |
| ------------ | ----------------------------- |
| Frontend     | Next.js 15 (App Router)       |
| Backend      | Next.js API routes + services |
| UI           | shadcn/ui (Tailwind v4)       |
| Layout       | Material UI (MUI) v6          |
| Auth         | NextAuth.js v5                |
| Database     | PostgreSQL 16                 |
| ORM          | Prisma                        |
| Validation   | Zod                           |
| State        | Zustand                       |
| Monorepo     | npm workspaces                |

## Project Structure

```
loukdo/
├── package.json                       # npm workspaces root
├── .env                               # Environment variables
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma              # Database models (User, Branch, Sale, Product, etc.)
│   └── src/
│       ├── index.ts                   # Barrel exports
│       ├── generated/prisma/          # Generated Prisma client
│       ├── services/
│       │   ├── index.ts               # Re-exports
│       │   ├── prisma.ts              # PrismaClient singleton
│       │   ├── branch.ts              # Branch CRUD (getAll, create, delete, duplicate)
│       │   ├── user.ts                # User queries (findByUsername, createBranchAdmin, getUsersByBranch)
│       │   ├── sale.ts                # Sales queries (getSalesByBranch, createSale)
│       │   ├── exchangeRate.ts        # NBC Cambodia FX rate fetcher + cache
│       │   └── password.ts            # Scrypt hash/verify helpers
│       ├── validators/
│       │   └── index.ts               # Zod schemas (login, register, createBranch)
│       └── types/
│           └── index.ts               # Shared TypeScript interfaces
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── postcss.config.js               # Tailwind v4 + autoprefixer
    ├── components.json                 # shadcn/ui configuration
    ├── public/
    └── src/
        ├── middleware.ts               # Route protection (ADMIN role + branch ownership)
        ├── app/
        │   ├── globals.css             # Tailwind v4 + shadcn theme variables
        │   ├── layout.tsx              # Root layout (MUI theme + Auth provider)
        │   ├── page.tsx                # Redirect to /dashboard/admin or /login
        │   ├── (auth)/
        │   │   ├── login/page.tsx      # Admin sign-in (hardcoded admin/admin)
        │   │   └── register/page.tsx   # Registration placeholder
        │   ├── branch/
        │   │   └── [code]/
        │   │       ├── page.tsx        # Branch dashboard (module cards + stats)
        │   │       ├── login/page.tsx  # Per-branch login page
        │   │       ├── pos/page.tsx    # POS terminal (placeholder)
        │   │       ├── products/page.tsx
        │   │       ├── categories/page.tsx
        │   │       ├── sales/page.tsx
        │   │       ├── users/page.tsx
        │   │       ├── inventory/page.tsx
        │   │       └── settings/page.tsx
        │   ├── dashboard/
        │   │   └── admin/
        │   │       ├── page.tsx        # Admin dashboard (stats, FX rates, recent branches)
        │   │       └── branches/
        │   │           └── page.tsx    # Branch management (CRUD, grid/list views)
        │   └── api/
        │       ├── auth/[...nextauth]/
        │       │   ├── auth.config.ts  # NextAuth config (middleware guard + session mapping)
        │       │   ├── auth.ts         # Credentials provider (admin + branch login)
        │       │   └── route.ts        # Auth API handlers
        │       └── v1/
        │           ├── branches/
        │           │   ├── route.ts    # List (ADMIN), create (ADMIN), lookup by code (public)
        │           │   └── [id]/route.ts  # Get, delete, duplicate (ADMIN only)
        │           ├── sales/
        │           │   └── route.ts    # List/create sales by session branchId
        │           └── exchange-rates/
        │               └── route.ts    # NBC Cambodia FX rates (authenticated)
        ├── components/
        │   ├── ui/                     # shadcn/ui primitives
        │   │   ├── badge.tsx
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── dialog.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── select.tsx
        │   │   ├── separator.tsx
        │   │   ├── sheet.tsx
        │   │   └── table.tsx
        │   ├── layouts/
        │   │   ├── DashboardLayout.tsx  # Admin sidebar + AppBar (MUI)
        │   │   └── BranchLayout.tsx     # Branch sidebar + top bar (Tailwind)
        │   └── providers/
        │       ├── ThemeRegistry.tsx    # MUI theme provider + cache
        │       └── AuthProvider.tsx     # NextAuth SessionProvider wrapper
        ├── lib/
        │   ├── api-client.ts           # Generic fetch wrapper
        │   ├── password.ts             # Client-side scrypt helpers
        │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
        ├── stores/
        │   └── index.ts                # Zustand store (sidebar toggle state)
        └── types/
            └── next-auth.d.ts          # NextAuth type augmentation (username, role, branchId, branchCode)
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **PostgreSQL** 16 (running locally on port 5432)
- **npm**

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Connect to PostgreSQL and create the database and user:

```bash
# macOS (Homebrew) — start PostgreSQL if not running
brew services start postgresql@16

# Create the database user and database
psql postgres -c "CREATE USER loukdo WITH PASSWORD '112233';"
psql postgres -c "CREATE DATABASE loukdo OWNER loukdo;"
```

> **Linux (systemd):** replace `brew services start` with `sudo systemctl start postgresql-16`

### 3. Set environment variables

The `.env` file at the project root is pre-configured:

```env
DATABASE_URL="postgresql://loukdo:112233@localhost:5432/loukdo?schema=public"
AUTH_SECRET="1QAqagR0rQGtrgN0UIQyfRLi+GHqHHpZoRWQz4KtltA="
```

To generate a new `AUTH_SECRET` (optional):

```bash
openssl rand -base64 32
```

### 4. Generate Prisma client & apply migrations

```bash
# Generate the Prisma client from the schema
npm run -w backend db:generate

# Create and apply migrations (creates/updates tables)
npm run -w backend db:migrate
```

> **Note:** If you've pulled changes that modify the database schema (e.g. added a `username` or `Branch` model), run `npm run -w backend db:migrate` (or `npx prisma migrate dev` in the `backend/` directory) to keep your database in sync.

### 5. Run the dev server

```bash
npm run -w frontend dev
```

Open [http://192.168.1.8:3000](http://192.168.1.8:3000) — you will be redirected to the login page.

## Authentication

The system has two completely separate login flows that never mix:

### Admin Console

| Field     | Value  |
|-----------|--------|
| URL       | `/login` |
| Username  | `admin` |
| Password  | `admin` |

Admin credentials are **hardcoded** in `auth.ts`. Admin login sends `loginType: "admin"` and redirects to `/dashboard/admin` on success. The admin console is used to manage branch locations, view sales data, and oversee the network.

### Branch Login

Each branch has its own login page at `/branch/{code}/login`. Branch users are stored in the database (`User` table with a `branchId` foreign key). When logging in, the system:

1. Extracts `branchCode` from the URL path
2. Sends `loginType: "branch"` + `branchCode` in the credentials payload
3. Looks up the user by username in the database
4. Verifies the password against the stored scrypt hash
5. Confirms `user.branchId` matches the branch identified by `branchCode`
6. On success, redirects to `/branch/{code}` (branch landing page)
7. On failure, shows "Invalid credentials or unauthorized branch access"

Branch users **cannot** access the admin console at `/dashboard/*`, and admin users **cannot** access branch portals.

### 6. (Optional) Open Prisma Studio

```bash
npm run -w backend db:studio
```

## API Documentation

Interactive Swagger UI docs are generated from `@swagger` JSDoc annotations in the API route handlers.

- **Docs UI:** http://192.168.1.8:3000/api-docs
- **OpenAPI spec (JSON):** http://192.168.1.8:3000/api/docs

To test endpoints with **"Try it out"**, log in first at `/login` (or a branch login page) in the same browser. The API authenticates via NextAuth session cookies, and Swagger UI is served from the same origin, so your browser session cookie is sent automatically. Swagger UI's "Authorize" button is not used for cookie auth.

> Note: NextAuth endpoints (`/api/auth/*`) are framework-managed and are intentionally not documented.

## Available Commands

### Backend (`npm run -w backend <command>`)

| Command         | Description                 |
| --------------- | --------------------------- |
| `db:generate`   | Regenerate Prisma client    |
| `db:push`       | Push schema to database     |
| `db:migrate`    | Create and apply migration  |
| `db:studio`     | Open Prisma Studio UI       |
| `db:seed`       | Run seed script             |
| `db:clear`      | Clear all data from tables  |
| `lint`          | Type-check backend          |

### Frontend (`npm run -w frontend <command>`)

| Command   | Description               |
| --------- | ------------------------- |
| `dev`     | Start dev server          |
| `build`   | Build for production      |
| `start`   | Start production server   |
| `lint`    | Run Next.js lint          |


after create new schema
npm run -w backend db:push

## Vendors & Purchase Orders

Branch-scoped suppliers and stock ordering. Access requires the `vendors.manage` / `purchaseOrders.manage` permissions (on by default for `BRANCH_ADMIN`; `SUPER_ADMIN` always has them; grant to other roles in Settings → Role Permissions).

- **Models:** `Vendor`, `PurchaseOrder`, `PurchaseOrderItem`, `StockMovement` (see `backend/prisma/schema.prisma`).
- **Status flow:** `DRAFT` → `ORDERED` → `PARTIALLY_RECEIVED` → `RECEIVED`; `DRAFT`/`ORDERED` can be `CANCELLED`. Only drafts can be edited or deleted.
- **Receiving stock** (`POST /api/v1/purchase-orders/:id/receive`) runs in one transaction: it increases inventory, records a `PURCHASE_RECEIPT` stock movement (with before/after quantities) per line, and updates the PO status. Product cost is not changed.
- **API:** `/api/v1/vendors`, `/api/v1/purchase-orders` (+ `/:id`, `/:id/status`, `/:id/receive`), `/api/v1/stock-movements` (read-only).
- **UI:** `/dashboard/admin/vendors`, `/dashboard/admin/purchase-orders`, `/branch/:code/vendors`, `/branch/:code/purchase-orders`.

After pulling these changes run `npm run -w backend db:push` and `npm run -w backend db:generate`.

## Seed Mock Data

Run the seed command after the schema exists:

```bash
npm run -w backend db:seed
```

> **Warning:** This is a local-development command. It permanently removes all
> existing users, sales, sale items, role-permission overrides, inventory,
> products, categories, and branches before inserting the mock catalog.

The editable fixture is `backend/prisma/seed-data.json`. It contains Khmer
mock data for:

- Cambodia branch names and machine-readable branch codes
- Branch-scoped categories
- Products with Khmer names, prices, costs, SKUs, and barcodes
- Inventory quantities and low-stock thresholds

The seed script validates the fixture, including category references and unique
branch codes/SKUs, before it deletes any database records. To customize the
mock data, edit `backend/prisma/seed-data.json`, then rerun the seed command.

Each fixture branch includes one development-only `BRANCH_ADMIN` account. Find
the source credentials in that branch's `admin` object in
`backend/prisma/seed-data.json`:

| Branch code | Username | Password |
| --- | --- | --- |
| `phnom-penh` | `phnom-penh-admin` | `demo12345` |
| `siem-reap` | `siem-reap-admin` | `demo12345` |

The seed script hashes these passwords before storing them in the database.
They are public local-development credentials only; never use them in a
deployed environment. The seed intentionally does not create other users,
role permissions, or sales.

---

after create new schema
npm run -w backend db:push
