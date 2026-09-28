import { prisma } from "@/lib/db";

async function countExamples(): Promise<number> {
  try {
    const [c, a] = await Promise.all([
      prisma.compound.count({ where: { isExample: true } }),
      prisma.assay.count({ where: { isExample: true } }),
    ]);
    return c + a;
  } catch (error) {
    console.error("Failed to count example records", error);
    return 0;
  }
}

/**
 * Shown only while the database still contains example (fictional) records.
 * Disappears automatically once they are removed.
 */
export async function FictionalDataNotice() {
  if ((await countExamples()) === 0) return null;
  return (
    <div
      role="note"
      className="reveal rounded-2xl border border-orange/40 bg-orange-100/90 px-4 py-3.5 text-sm text-orange-800 shadow-soft"
    >
      <strong className="font-semibold">Note:</strong> records labelled{" "}
      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-orange/40">
        Example
      </span>{" "}
      are <strong className="font-semibold">fictional example data</strong> for development purposes. They are not real
      measurements and must not be used for research decisions.
    </div>
  );
}
