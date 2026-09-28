import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read directly from the environment so `prisma generate` (postinstall)
    // still works when DATABASE_URL is not set, e.g. in CI.
    url: process.env["DATABASE_URL"],
  },
});
