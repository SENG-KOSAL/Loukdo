# Loukdo POS

Point of Sale system built with Next.js.

## Tech Stack

| Layer        | Choice                        |
| ------------ | ----------------------------- |
| Frontend     | Next.js 15 (App Router)       |
| Backend      | Next.js API routes + services |
| UI           | Material UI (MUI) v6          |
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
│   │   └── schema.prisma              # Database models
│   └── src/
│       ├── index.ts                   # Barrel exports
│       ├── generated/prisma/          # Prisma client (gitignored)
│       ├── services/                  # Business logic
│       ├── validators/                # Zod validation schemas
│       └── types/                     # Shared TypeScript types
│
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── public/
    └── src/
        ├── middleware.ts              # NextAuth route protection
        ├── app/
        │   ├── layout.tsx             # Root layout (MUI + Auth providers)
        │   ├── page.tsx               # Redirect to login/dashboard
        │   ├── (auth)/
        │   │   ├── login/page.tsx     # Sign-in page
        │   │   └── register/page.tsx  # Registration page
        │   ├── (dashboard)/
        │   │   └── page.tsx           # Protected dashboard
        │   └── api/
        │       └── auth/[...nextauth]/
        │           ├── auth.ts        # NextAuth config
        │           └── route.ts       # Auth API handlers
        ├── components/
        │   ├── providers/
        │   │   ├── ThemeRegistry.tsx  # MUI theme & cache
        │   │   └── AuthProvider.tsx   # NextAuth session provider
        │   └── layouts/
        │       └── DashboardLayout.tsx # Sidebar + AppBar shell
        ├── lib/
        │   └── api-client.ts          # Fetch wrapper
        └── stores/
            └── index.ts               # Zustand stores
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

### 2. Crep te the database

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

### 4. Generate Prisma client & push schema

```bash
# Generate the Prisma client from the schema
npm run -w backend db:generate

# Push the schema to PostgreSQL (creates tables)
npm run -w backend db:push
```

### 5. Run the dev server

```bash
npm run -w frontend dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

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
