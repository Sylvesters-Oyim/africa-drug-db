# Africa Drug Discovery Database

A SaaS web app for searching, filtering and browsing **chemical compounds** and their **assay results**, with a focus on
drug discovery in Africa and on diseases with a heavy burden on the continent (malaria, tuberculosis, HIV, sleeping
sickness, schistosomiasis, leishmaniasis, Buruli ulcer).

This is the v1 starter: public browse and search of compounds and assays. Authentication, payments, an admin panel and
ML features are intentionally **not** included yet.

> **Seed data is fictional.** The database seed (`prisma/seed.ts`) contains made-up compounds (codes such as
> `ADD-0001`), invented assay values and placeholder references for development and demo purposes only. SMILES and
> InChIKey fields are left empty on purpose. None of it is real measurement data. The site shows the same notice.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- Tailwind CSS v4
- PostgreSQL via [Prisma](https://www.prisma.io) 7 (`prisma-client` generator + `@prisma/adapter-pg`)
- npm; deployable on Vercel (no custom server)

## Pages

| Route             | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| `/`               | Overview, database stats and quick links by disease                                  |
| `/compounds`      | Compound list. Search by name (`?q=`), filter by disease (`?disease=`) and region (`?region=`) |
| `/compounds/[id]` | Compound details plus a table of its assay results (404 for unknown ids)             |
| `/assays`         | Assay results. Filter by activity (`?activity=ACTIVE`) and assay type (`?type=`), linking to compounds |

Filtering is done server-side with Prisma from URL search params, so every filtered view is a shareable URL.
All pages that read the database use `export const dynamic = "force-dynamic"`, so `npm run build` does not need a
database connection.

## Project layout

```
prisma/
  schema.prisma        # data model
  migrations/          # SQL migrations (committed)
  seed.ts              # FICTIONAL example data
prisma.config.ts       # Prisma 7 config (schema path, migrations, seed command, DATABASE_URL)
src/
  app/                 # App Router pages (/, /compounds, /compounds/[id], /assays)
  components/          # shared UI (header, footer, badges, pagination, ...)
  lib/db.ts            # Prisma client singleton
  lib/                 # small helpers (search params, formatting, disease tags)
  generated/prisma/    # generated Prisma client (git-ignored, created by `prisma generate`)
```

## Local setup

Requirements: Node.js 20.19+ and Docker (or any local PostgreSQL 14+).

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Start Postgres (see docker-compose.yml)
docker compose up -d

# 3. Configure environment
cp .env.example .env

# 4. Create the database schema
npx prisma migrate dev

# 5. Load the fictional seed data
npx prisma db seed

# 6. Start the dev server at http://localhost:3000
npm run dev
```

Without Docker, point `DATABASE_URL` in `.env` at any PostgreSQL database you have access to.

Useful scripts:

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | Production build                               |
| `npm run lint`      | ESLint                                         |
| `npm run typecheck` | TypeScript check                               |
| `npm run db:migrate`| `prisma migrate dev` (create/apply migrations) |
| `npm run db:deploy` | `prisma migrate deploy` (apply in production)  |
| `npm run db:seed`   | `prisma db seed`                               |

## Deploying to Vercel

1. Create a hosted Postgres database, e.g. on [Neon](https://neon.tech) (the Vercel Marketplace Neon integration also
   works and sets the env var for you). Copy its connection string (use `?sslmode=require`).
2. Import this GitHub repo in Vercel (framework preset: Next.js; the defaults are fine).
3. In **Project → Settings → Environment Variables**, add `DATABASE_URL` with the connection string for Production
   (and Preview if you want previews to have data).
4. Apply the migrations to the hosted database once, from your machine:
   ```bash
   DATABASE_URL="postgresql://...neon.tech/...?sslmode=require" npx prisma migrate deploy
   # optional: load the fictional demo data
   DATABASE_URL="postgresql://..." npx prisma db seed
   ```
   (Alternatively change the Vercel build command to `prisma migrate deploy && next build`.)
5. Deploy. `postinstall` runs `prisma generate`, and the build itself does not connect to the database.

## Schema overview

**Compound**

| Field          | Type       | Notes                                              |
| -------------- | ---------- | -------------------------------------------------- |
| `id`           | `String`   | cuid, primary key                                  |
| `name`         | `String`   | indexed                                            |
| `smiles`       | `String?`  |                                                    |
| `inchikey`     | `String?`  |                                                    |
| `formula`      | `String?`  |                                                    |
| `sourceRegion` | `String`   | African country or region, indexed                 |
| `sourceNotes`  | `String?`  |                                                    |
| `diseaseTags`  | `String[]` | lowercase slugs, e.g. `malaria`, `buruli-ulcer`    |
| `createdAt`    | `DateTime` |                                                    |

**Assay**

| Field                | Type            | Notes                                        |
| -------------------- | --------------- | -------------------------------------------- |
| `id`                 | `String`        | cuid, primary key                            |
| `compoundId`         | `String`        | FK → `Compound.id`, `ON DELETE CASCADE`      |
| `assayType`          | `String`        | e.g. "Minimum inhibitory concentration"      |
| `target`             | `String?`       | organism, enzyme or cell line                |
| `resultValue`        | `Float?`        |                                              |
| `resultUnit`         | `String?`       | e.g. "µM (IC50)"                             |
| `activityLabel`      | `ActivityLabel` | enum: `ACTIVE`, `INACTIVE`, `INCONCLUSIVE`   |
| `reference`          | `String?`       |                                              |
| `performedInCountry` | `String?`       |                                              |
| `createdAt`          | `DateTime`      |                                              |

Disease tags and their display labels are defined in `src/lib/diseases.ts`.

## Seed data

`npx prisma db seed` wipes the `Compound` and `Assay` tables and inserts 20 fictional compounds from a range of African
countries and regions, each with 2 to 4 fictional assay results. **Do not treat any of it as real data.**

## Roadmap notes

- Auth can be added later (e.g. Auth.js or Clerk) with `proxy.ts` protecting routes; data access is in server
  components via `src/lib/db.ts`, so adding per-user checks there is straightforward.
- Full-text / structure search (e.g. `pg_trgm`, RDKit cartridge) can replace the simple `contains` name search.
