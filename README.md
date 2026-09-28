# Africa Drug Discovery Database

A SaaS web app for searching, filtering and browsing **chemical compounds** and their **assay results**, with a focus on
drug discovery in Africa and on diseases with a heavy burden on the continent (malaria, tuberculosis, HIV, sleeping
sickness, schistosomiasis, leishmaniasis, Buruli ulcer).

Public browse and search of compounds and assays, plus a password-protected admin area and CLI for loading real data
from spreadsheets with provenance, licensing and access-and-benefit-sharing (ABS) metadata.

> **Seed data is fictional.** The database seed (`prisma/seed.ts`) contains made-up compounds (codes such as
> `ADD-0001`), invented assay values and placeholder references, all flagged `isExample = true`. Example records are
> labelled "Example" on the site, and the "fictional data" notice is shown **only while example records exist**: it
> disappears once they are removed (see [Removing the example data](#removing-the-example-data)).

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
| `/admin`          | Password-protected data admin (not linked from the public site, `noindex`). See [Admin area](#admin-area) |

Filtering is done server-side with Prisma from URL search params, so every filtered view is a shareable URL.
All pages that read the database use `export const dynamic = "force-dynamic"`, so `npm run build` does not need a
database connection.

## Project layout

```
prisma/
  schema.prisma        # data model
  migrations/          # SQL migrations (committed)
  seed.ts              # FICTIONAL example data (isExample = true)
prisma.config.ts       # Prisma 7 config (schema path, migrations, seed command, DATABASE_URL)
public/templates/      # import templates (compounds.csv, assays.csv, combined .xlsx)
scripts/
  import.ts            # CLI importer (npm run import)
  clear-examples.ts    # delete example records (npm run clear-examples)
  generate-templates.ts# regenerate public/templates (npm run templates)
src/
  app/                 # App Router pages (/, /compounds, /compounds/[id], /assays, /admin/...)
  app/admin/           # admin pages, server actions (actions.ts) and admin-only components
  components/          # shared UI (header, footer, badges, pagination, ...)
  lib/db.ts            # Prisma client singleton
  lib/import/          # shared import library: column definitions, CSV/XLSX parsing, validation, upsert
  lib/admin/           # admin session auth + form helpers
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
| `npm run db:seed`   | `prisma db seed` (replaces example rows only)  |
| `npm test`          | Unit tests for import validation/parsing       |
| `npm run import`    | CLI importer (see below)                       |
| `npm run clear-examples` | Delete example records (see below)        |
| `npm run templates` | Regenerate `public/templates/` from the column definitions |

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
   This repo's `vercel-build` script already runs `prisma migrate deploy && next build`, so new migrations are
   applied to the production database on every production deploy (preview deployments share that database, so
   avoid pushing schema changes on other branches).
5. Deploy. `postinstall` runs `prisma generate`, and `next build` itself does not connect to the database.
6. To enable the admin area, add `ADMIN_PASSWORD` (see [Admin area](#admin-area)) and redeploy.

## Schema overview

Both models carry the same **provenance** fields, and both have `isExample Boolean @default(false)`.

| Provenance field | Type          | Notes                                                              |
| ---------------- | ------------- | ------------------------------------------------------------------ |
| `sourceType`     | `SourceType?` | enum: `LITERATURE`, `DATABASE`, `LAB_DEPOSIT`, `OTHER`             |
| `sourceName`     | `String?`     | e.g. "ChEMBL 35", a journal, or the depositing lab                 |
| `sourceUrl`      | `String?`     | link to the record or paper                                        |
| `doi`            | `String?`     | stored without the `https://doi.org/` prefix                       |
| `citation`       | `String?`     | human-readable citation                                            |
| `license`        | `String?`     | free text, e.g. "CC BY-SA 3.0" (ChEMBL) or a licence agreement name |
| `sourceRecordId` | `String?`     | ID in the source, e.g. a ChEMBL ID; used to de-duplicate assays    |

**Compound**

| Field             | Type        | Notes                                                        |
| ----------------- | ----------- | ------------------------------------------------------------ |
| `id`              | `String`    | cuid, primary key                                            |
| `code`            | `String`    | **unique** public code, e.g. `ADD-0001`; the import key      |
| `name`            | `String`    | indexed                                                      |
| `smiles`, `inchikey`, `formula` | `String?` | chemistry (InChIKey validated on import)       |
| `sourceRegion`    | `String`    | African country or region used by the public filter          |
| `sourceNotes`     | `String?`   |                                                              |
| `diseaseTags`     | `String[]`  | slugs from `src/lib/diseases.ts`, e.g. `malaria`             |
| `countryOfOrigin` | `String?`   | where the source material was collected                      |
| `collectionDate`  | `DateTime?` | date only (stored at UTC midnight)                           |
| `absPermitRef`    | `String?`   | Nagoya Protocol / ABS permit reference (e.g. IRCC / ABSCH ID) |
| provenance fields | see above   |                                                              |
| `isExample`       | `Boolean`   | fictional demo data                                          |
| `createdAt`       | `DateTime`  |                                                              |

**Assay**

| Field                | Type            | Notes                                                    |
| -------------------- | --------------- | -------------------------------------------------------- |
| `id`                 | `String`        | cuid, primary key                                        |
| `compoundId`         | `String`        | FK → `Compound.id`, `ON DELETE CASCADE`                  |
| `assayType`          | `String`        | e.g. "Minimum inhibitory concentration"                  |
| `measurementType`    | `String?`       | IC50, EC50, CC50, MIC, Ki, % inhibition, ...             |
| `relation`           | `String?`       | `=`, `<`, `>`, `<=`, `>=`, `~` (defaults to `=` when a value is imported) |
| `resultValue`        | `Float?`        | "value" in the templates                                 |
| `resultUnit`         | `String?`       | "units" in the templates, e.g. µM                        |
| `target`             | `String?`       | molecular target, enzyme or cell line                    |
| `organism`           | `String?`       | organism tested                                          |
| `activityLabel`      | `ActivityLabel` | enum: `ACTIVE`, `INACTIVE`, `INCONCLUSIVE`               |
| `reference`          | `String?`       | legacy free-text reference                               |
| `performedInCountry` | `String?`       |                                                          |
| provenance fields    | see above       |                                                          |
| `isExample`          | `Boolean`       | fictional demo data                                      |
| `createdAt`          | `DateTime`      |                                                          |

The migration `20260928160000_provenance_and_real_data` is additive: it back-fills `Compound.code` from the seed names
(`ADD-0001 ...`) and flags all rows that existed before it as `isExample = true`.

Disease tags and their display labels are defined in `src/lib/diseases.ts`.

## Loading real data

### 1. Fill in the template

Download a template from `public/templates/` (also linked from `/admin/import`):

- `africa-drug-db-import-template.xlsx`: sheets **Compounds**, **Assays** and **Instructions** (every column,
  required vs optional, allowed values). Required headers are orange; enum columns have drop-downs.
- `compounds.csv` and `assays.csv`: the same columns as plain CSV (UTF-8; `,` `;` or tab delimited).

Each template has two example rows marked `is_example = TRUE`; delete or overwrite them. Assays link to compounds by
`compound_code`, which must exist in the same upload or already be in the database.

Required columns: compounds `code`, `name`, `source_region`, `source_type`, `source_name`; assays
`compound_code`, `assay_type`, `activity`, `source_type`, `source_name`. Everything else is optional, but record
`license`, a DOI/URL and any `abs_permit_ref` for real data. Header matching ignores case, spaces and underscores.

Validation checks required fields, enums (`source_type`, `activity`, `relation`), numbers (dot decimal separator),
dates (`YYYY-MM-DD` or Excel dates), URLs, DOIs, InChIKeys, disease tags, duplicate rows and unknown compound codes.
Every error is reported with its sheet, row number and column.

### 2. How re-imports are de-duplicated

- **Compounds** are matched by `code` (stored upper-case): an existing code is updated, a new one is created.
- **Assays** are matched by `compound_code` + `source_record_id` (e.g. a ChEMBL activity ID) when that is present,
  otherwise by `compound_code` + `assay_type` + `target` + `organism` + `measurement_type` + `source_name` + `doi`
  (case-insensitive).
- Only columns present in the file are written; an empty cell clears that field on a matched record. Rows whose
  values are identical are reported as "unchanged", so importing the same file twice changes nothing.
- Imports are **all-or-nothing**: they run in one database transaction, and any row error means nothing is written.

### 3a. Import with the CLI

```bash
# Preview (read-only): counts of creates/updates/unchanged plus per-row errors
npm run import -- --compounds data/compounds.csv --assays data/assays.csv --dry-run

# Commit
npm run import -- --compounds data/compounds.csv --assays data/assays.csv

# A combined workbook works too (sheets named Compounds and Assays)
npm run import -- --file data/import.xlsx --dry-run
```

The CLI uses `DATABASE_URL` from the environment / `.env`. It prints whether the target is `local` or `REMOTE` (never
the URL), and writing to a non-local database requires an extra `--yes`. Always dry-run against production first, for
example with the production URL in `.env.local` (from `vercel env pull`):

```bash
env -u DATABASE_URL npx tsx --env-file=.env.local scripts/import.ts --file data/import.xlsx --dry-run
```

(`env -u` matters: an already-exported `DATABASE_URL` takes precedence over `--env-file`.)

### 3b. Import in the browser

Sign in at `/admin`, open **Import**, choose the file(s), click **Preview (dry run)** and review the counts and the row
error table. **Import** unlocks only after a clean preview of the same files. Uploads are limited to 4 MB per file (use
the CLI for larger files).

### Removing the example data

```bash
npm run clear-examples                          # shows how many example/real records there are
npm run clear-examples -- --yes                 # deletes example records (local database only)
npm run clear-examples -- --yes --allow-remote  # deliberately target a remote DB (e.g. production)
```

Example compounds cascade-delete their assays. Real records are never touched. Once no example records remain, the
public "fictional data" notice disappears automatically. You can also delete individual records in the admin area.

## Admin area

`/admin` is protected by one shared password:

1. Set `ADMIN_PASSWORD` (a long random string) in Vercel → Project → Settings → Environment Variables for
   Production, then **redeploy** (environment changes apply to new deployments). Optionally set
   `ADMIN_SESSION_SECRET`; otherwise the session signing key is derived from `ADMIN_PASSWORD`, so changing the password
   signs everyone out.
2. Visit `https://<your-domain>/admin` and sign in.

Without `ADMIN_PASSWORD`, `/admin` shows "Admin is not configured" and every admin server action refuses to run.

What it does:

- **Import**: dry-run preview and all-or-nothing import of CSV/XLSX files (same library as the CLI).
- **Compounds / Assays**: searchable lists; add and edit forms with all fields including provenance, origin and ABS
  permit; delete with confirmation. Forms use the same validation as the importer.
- Changes appear on the public pages immediately.

Security notes: sessions are an HMAC-signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookie scoped to `/admin` with a
12-hour lifetime; the password is compared in constant time; failed logins are slowed down; every admin page and
server action checks the session on the server; `/admin` responses send `X-Robots-Tag: noindex` and `no-store`, and
the public navigation does not link to it. Preview deployments share the production database, so treat admin
access on any deployment as production access.

## Seed data

`npx prisma db seed` removes existing example rows (`isExample = true`) and inserts 20 fictional compounds from a range
of African countries and regions, each with 2 to 4 fictional assay results, all flagged `isExample = true`. Real
records are never deleted, and seed codes already used by real compounds are skipped. **Do not treat any of the seed
data as real.**

## Roadmap notes

- Per-user accounts (e.g. Auth.js or Clerk) can replace the single admin password; all admin checks go through
  `requireAdmin()` in `src/lib/admin/auth.ts`.
- Full-text / structure search (e.g. `pg_trgm`, RDKit cartridge) can replace the simple `contains` name search.
