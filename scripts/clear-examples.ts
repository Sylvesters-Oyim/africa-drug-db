/**
 * Delete all example (fictional) records: compounds with isExample = true
 * (their assays cascade) plus any assays flagged isExample on real compounds.
 *
 *   npm run clear-examples            # shows what would be deleted
 *   npm run clear-examples -- --yes   # deletes (local database only)
 *   npm run clear-examples -- --yes --allow-remote   # deliberately target a remote DB
 */
import "dotenv/config";
import { createClient, isLocalDatabase } from "./lib";

async function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes("--yes");
  const allowRemote = args.includes("--allow-remote");
  const local = isLocalDatabase();
  if (confirm && !local && !allowRemote) {
    console.error("Refusing to delete from a non-local database without --allow-remote.");
    process.exitCode = 2;
    return;
  }

  const prisma = createClient();
  try {
    const [compounds, assays, realCompounds, realAssays] = await Promise.all([
      prisma.compound.count({ where: { isExample: true } }),
      prisma.assay.count({ where: { OR: [{ isExample: true }, { compound: { isExample: true } }] } }),
      prisma.compound.count({ where: { isExample: false } }),
      prisma.assay.count({ where: { isExample: false, compound: { isExample: false } } }),
    ]);
    console.log(`Target database: ${local ? "local" : "REMOTE"}`);
    console.log(`Example records: ${compounds} compounds, ${assays} assays`);
    console.log(`Real records kept: ${realCompounds} compounds, ${realAssays} assays`);

    if (!confirm) {
      console.log("Nothing deleted. Re-run with --yes to delete the example records.");
      return;
    }
    const realWithExampleAssays = await prisma.compound.count({
      where: { isExample: true, assays: { some: { isExample: false } } },
    });
    if (realWithExampleAssays > 0) {
      console.error(
        `Refusing: ${realWithExampleAssays} example compound(s) have non-example assays attached; fix those first.`,
      );
      process.exitCode = 1;
      return;
    }
    const [a, c] = await prisma.$transaction([
      prisma.assay.deleteMany({ where: { isExample: true } }),
      prisma.compound.deleteMany({ where: { isExample: true } }),
    ]);
    console.log(`Deleted ${c.count} compounds and ${a.count} assays.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
