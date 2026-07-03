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
├── docker-compose.yml                 # PostgreSQL service
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

- Node.js >= 18
- Docker (for PostgreSQL)
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Set environment variables

Edit `.env` in the root directory:

```env
DATABASE_URL="postgresql://loukdo:loukdo@localhost:5432/loukdo?schema=public"
AUTH_SECRET="generate-a-random-secret-at-least-32-chars"
```

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Push database schema

```bash
npm run -w backend db:push
```

### 5. Run the dev server

```bash
npm run -w frontend dev
```

Open [http://localhost:3000](http://localhost:3000).

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
