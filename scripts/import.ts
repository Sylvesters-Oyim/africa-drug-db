/**
 * Import compounds and/or assays from CSV or XLSX files.
 *
 *   npm run import -- --compounds data/compounds.csv --assays data/assays.csv --dry-run
 *   npm run import -- --file data/import.xlsx
 *
 * Writing to a non-local database additionally requires --yes.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { formatResult, runImport, type ImportFile } from "../src/lib/import";
import { createClient, getArg, isLocalDatabase } from "./lib";

const USAGE = `Usage: npm run import -- [--compounds <file>] [--assays <file>] [--file <xlsx|csv>]... [--dry-run] [--yes]`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    return;
  }
  const dryRun = args.includes("--dry-run");
  const paths: string[] = [];
  const compounds = getArg(args, "--compounds");
  const assays = getArg(args, "--assays");
  if (compounds) paths.push(compounds);
  if (assays) paths.push(assays);
  args.forEach((a, i) => {
    if (a === "--file" && args[i + 1]) paths.push(args[i + 1]);
  });
  if (!paths.length) {
    console.error(USAGE);
    process.exit(2);
  }

  const local = isLocalDatabase();
  console.log(`Target database: ${local ? "local" : "REMOTE"}${dryRun ? " (dry run: read-only)" : ""}`);
  if (!dryRun && !local && !args.includes("--yes")) {
    console.error("Refusing to write to a non-local database without --yes. Run with --dry-run first.");
    process.exit(2);
  }

  const files: ImportFile[] = [];
  for (const p of paths) files.push({ name: basename(p), data: await readFile(p) });

  const prisma = createClient();
  try {
    const result = await runImport(prisma, files, { dryRun });
    console.log(formatResult(result));
    const failed = result.errors.length > 0 || result.fileErrors.length > 0;
    process.exitCode = failed ? 1 : 0;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
