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
│   │   └── schema.prisma              # Database models (User, Branch, Sale)
│   └── src/
│       ├── index.ts                   # Barrel exports
│       ├── generated/prisma/          # Generated Prisma client
│       ├── services/
│       │   ├── index.ts               # Re-exports
│       │   ├── prisma.ts              # PrismaClient singleton
│       │   ├── branch.ts              # Branch CRUD (getAll, create, delete, duplicate)
│       │   ├── user.ts                # User queries (findByUsername, createBranchAdmin, getUsersByBranch)
│       │   ├── sale.ts                # Sales queries (getSalesByBranch, createSale)
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
        ├── middleware.ts               # NextAuth route protection
        ├── app/
        │   ├── globals.css             # Tailwind v4 + shadcn theme variables
        │   ├── layout.tsx              # Root layout (MUI theme + Auth provider)
        │   ├── page.tsx                # Redirect to /dashboard/admin or /login
        │   ├── (auth)/
        │   │   ├── login/page.tsx      # Sign-in page (username + password)
        │   │   └── register/page.tsx   # Registration page
        │   ├── branch/
        │   │   └── [code]/
        │   │       └── login/page.tsx  # Branch-specific login page
        │   ├── dashboard/
        │   │   └── admin/
        │   │       ├── page.tsx        # Admin dashboard overview (stats, recent branches)
        │   │       └── branches/
        │   │           └── page.tsx    # Branch management (CRUD, card/list views)
        │   └── api/
        │       ├── auth/[...nextauth]/
        │       │   ├── auth.config.ts  # NextAuth config (middleware guard)
        │       │   ├── auth.ts         # Credentials provider setup
        │       │   └── route.ts        # Auth API handlers
        │       ├── branches/
        │       │   ├── route.ts        # Branches API (GET list, POST create)
        │       │   └── [id]/route.ts   # Branch API (GET, DELETE, POST duplicate)
        │       └── sales/
        │           └── route.ts        # Sales API (GET by branch, POST create)
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
        │   │   └── DashboardLayout.tsx   # Sidebar + AppBar shell (MUI)
        │   └── providers/
        │       ├── ThemeRegistry.tsx    # MUI theme provider + cache
        │       └── AuthProvider.tsx     # NextAuth session provider
        ├── lib/
        │   ├── api-client.ts           # Generic fetch wrapper
        │   ├── password.ts             # Client-side password utilities
        │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
        ├── stores/
        │   └── index.ts                # Zustand stores (sidebar state)
        └── types/
            └── next-auth.d.ts          # NextAuth type augmentation
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

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

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

## Available Commands

### Backend (`npm run -w backend <command>`)

| Command         | Description                 |
| --------------- | --------------------------- |
| `db:generate`   | Regenerate Prisma client    |
| `db:push`       | Push schema to database     |
| `db:migrate`    | Create and apply migration  |
| `db:studio`     | Open Prisma Studio UI       |
| `db:seed`       | Run seed script             |
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
