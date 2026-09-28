/**
 * Seed script for local development and demos.
 *
 * ALL DATA IN THIS FILE IS FICTIONAL. Compound names, codes, assay values,
 * references and notes are invented for demonstration purposes only and do
 * not represent real measurements. SMILES and InChIKey fields are left null
 * on purpose so nothing can be mistaken for a real chemical structure.
 *
 * Only rows flagged isExample are replaced; real data is left untouched.
 *
 * Run with: npx prisma db seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { ActivityLabel, PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type AssaySeed = {
  assayType: string;
  target?: string;
  resultValue?: number;
  resultUnit?: string;
  activityLabel: ActivityLabel;
  performedInCountry?: string;
};

type CompoundSeed = {
  code: string;
  label: string;
  formula?: string;
  sourceRegion: string;
  sourceNotes: string;
  diseaseTags: string[];
  assays: AssaySeed[];
};

const { ACTIVE, INACTIVE, INCONCLUSIVE } = ActivityLabel;

const compounds: CompoundSeed[] = [
  {
    code: "ADD-0001",
    label: "Kilimanjaro bark alkaloid (fictional)",
    sourceRegion: "Tanzania",
    sourceNotes: "Fictional example: bark extract fraction from a highland shrub.",
    diseaseTags: ["malaria"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Plasmodium falciparum (asexual blood stage)", resultValue: 0.42, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Tanzania" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 58, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Tanzania" },
      { assayType: "Selectivity index", resultValue: 138, resultUnit: "ratio", activityLabel: ACTIVE },
    ],
  },
  {
    code: "ADD-0002",
    label: "Sahel leaf flavonoid (fictional)",
    sourceRegion: "Mali",
    sourceNotes: "Fictional example: leaf extract described in a made-up ethnobotanical survey.",
    diseaseTags: ["malaria", "leishmaniasis"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Plasmodium falciparum (asexual blood stage)", resultValue: 3.1, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Mali" },
      { assayType: "In vitro growth inhibition", target: "Leishmania donovani (amastigote)", resultValue: 24, resultUnit: "µM (IC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Senegal" },
    ],
  },
  {
    code: "ADD-0003",
    label: "Rift Valley root terpenoid (fictional)",
    sourceRegion: "Kenya",
    sourceNotes: "Fictional example: root extract, placeholder collection record.",
    diseaseTags: ["tuberculosis"],
    assays: [
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium tuberculosis (reference strain)", resultValue: 2, resultUnit: "µg/mL (MIC)", activityLabel: ACTIVE, performedInCountry: "Kenya" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 40, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Kenya" },
      { assayType: "Intracellular killing", target: "Infected macrophages", resultValue: 1.2, resultUnit: "log10 CFU reduction", activityLabel: ACTIVE, performedInCountry: "South Africa" },
    ],
  },
  {
    code: "ADD-0004",
    label: "Cape fynbos coumarin (fictional)",
    sourceRegion: "South Africa",
    sourceNotes: "Fictional example: aerial parts extract.",
    diseaseTags: ["tuberculosis", "hiv"],
    assays: [
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium tuberculosis (reference strain)", resultValue: 16, resultUnit: "µg/mL (MIC)", activityLabel: INCONCLUSIVE, performedInCountry: "South Africa" },
      { assayType: "Enzyme inhibition", target: "HIV-1 reverse transcriptase", resultValue: 7.5, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "South Africa" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 95, resultUnit: "µM (CC50)", activityLabel: INACTIVE },
    ],
  },
  {
    code: "ADD-0005",
    label: "Niger Delta seed lactone (fictional)",
    sourceRegion: "Nigeria",
    sourceNotes: "Fictional example: seed oil fraction.",
    diseaseTags: ["sleeping-sickness"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Trypanosoma brucei rhodesiense (bloodstream form)", resultValue: 0.9, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Nigeria" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 12, resultUnit: "µM (CC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Nigeria" },
    ],
  },
  {
    code: "ADD-0006",
    label: "Congo basin vine quinone (fictional)",
    sourceRegion: "Democratic Republic of the Congo",
    sourceNotes: "Fictional example: stem extract from a lowland rainforest liana.",
    diseaseTags: ["sleeping-sickness", "leishmaniasis"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Trypanosoma brucei gambiense (bloodstream form)", resultValue: 1.8, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Democratic Republic of the Congo" },
      { assayType: "In vitro growth inhibition", target: "Leishmania major (promastigote)", resultValue: 45, resultUnit: "µM (IC50)", activityLabel: INACTIVE, performedInCountry: "Kenya" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 30, resultUnit: "µM (CC50)", activityLabel: INACTIVE },
    ],
  },
  {
    code: "ADD-0007",
    label: "Lake Victoria sponge peptide (fictional)",
    sourceRegion: "Uganda",
    sourceNotes: "Fictional example: freshwater organism isolate.",
    diseaseTags: ["schistosomiasis"],
    assays: [
      { assayType: "Worm motility", target: "Schistosoma mansoni (adult worms)", resultValue: 85, resultUnit: "% motility reduction", activityLabel: ACTIVE, performedInCountry: "Uganda" },
      { assayType: "Worm motility", target: "Schistosoma mansoni (schistosomula)", resultValue: 60, resultUnit: "% motility reduction", activityLabel: INCONCLUSIVE, performedInCountry: "Uganda" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 110, resultUnit: "µM (CC50)", activityLabel: INACTIVE },
    ],
  },
  {
    code: "ADD-0008",
    label: "Nile delta saponin (fictional)",
    sourceRegion: "Egypt",
    sourceNotes: "Fictional example: tuber extract.",
    diseaseTags: ["schistosomiasis"],
    assays: [
      { assayType: "Worm motility", target: "Schistosoma haematobium (adult worms)", resultValue: 40, resultUnit: "% motility reduction", activityLabel: INCONCLUSIVE, performedInCountry: "Egypt" },
      { assayType: "In vivo efficacy (rodent model)", target: "Schistosoma mansoni infection", resultValue: 22, resultUnit: "% worm burden reduction", activityLabel: INACTIVE, performedInCountry: "Egypt" },
    ],
  },
  {
    code: "ADD-0009",
    label: "Ethiopian highland resin (fictional)",
    sourceRegion: "Ethiopia",
    sourceNotes: "Fictional example: tree resin fraction.",
    diseaseTags: ["leishmaniasis"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Leishmania aethiopica (amastigote)", resultValue: 2.4, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Ethiopia" },
      { assayType: "In vitro growth inhibition", target: "Leishmania donovani (amastigote)", resultValue: 5.6, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Sudan" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 70, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Ethiopia" },
      { assayType: "Selectivity index", resultValue: 29, resultUnit: "ratio", activityLabel: ACTIVE },
    ],
  },
  {
    code: "ADD-0010",
    label: "Gold Coast mangrove phenolic (fictional)",
    sourceRegion: "Ghana",
    sourceNotes: "Fictional example: mangrove bark extract.",
    diseaseTags: ["buruli-ulcer"],
    assays: [
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium ulcerans", resultValue: 4, resultUnit: "µg/mL (MIC)", activityLabel: ACTIVE, performedInCountry: "Ghana" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 64, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Ghana" },
    ],
  },
  {
    code: "ADD-0011",
    label: "Cameroon highland stilbene (fictional)",
    sourceRegion: "Cameroon",
    sourceNotes: "Fictional example: leaf and twig extract.",
    diseaseTags: ["buruli-ulcer", "tuberculosis"],
    assays: [
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium ulcerans", resultValue: 32, resultUnit: "µg/mL (MIC)", activityLabel: INACTIVE, performedInCountry: "Cameroon" },
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium tuberculosis (reference strain)", resultValue: 8, resultUnit: "µg/mL (MIC)", activityLabel: INCONCLUSIVE, performedInCountry: "Cameroon" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 88, resultUnit: "µM (CC50)", activityLabel: INACTIVE },
    ],
  },
  {
    code: "ADD-0012",
    label: "Madagascar periwinkle-like indole (fictional)",
    sourceRegion: "Madagascar",
    sourceNotes: "Fictional example: endemic herb extract, placeholder voucher.",
    diseaseTags: ["malaria"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Plasmodium falciparum (drug-resistant line)", resultValue: 0.75, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Madagascar" },
      { assayType: "Gametocyte inhibition", target: "Plasmodium falciparum (stage V gametocytes)", resultValue: 9.2, resultUnit: "µM (IC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Madagascar" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 21, resultUnit: "µM (CC50)", activityLabel: INACTIVE },
    ],
  },
  {
    code: "ADD-0013",
    label: "Casamance fruit glycoside (fictional)",
    sourceRegion: "Senegal",
    sourceNotes: "Fictional example: fruit pulp extract.",
    diseaseTags: ["malaria", "hiv"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Plasmodium falciparum (asexual blood stage)", resultValue: 18, resultUnit: "µM (IC50)", activityLabel: INACTIVE, performedInCountry: "Senegal" },
      { assayType: "Cell-based antiviral", target: "HIV-1 replication (cell culture)", resultValue: 4.3, resultUnit: "µM (EC50)", activityLabel: ACTIVE, performedInCountry: "Senegal" },
    ],
  },
  {
    code: "ADD-0014",
    label: "Zambezi valley tannin (fictional)",
    sourceRegion: "Zambia",
    sourceNotes: "Fictional example: bark decoction fraction.",
    diseaseTags: ["hiv"],
    assays: [
      { assayType: "Enzyme inhibition", target: "HIV-1 integrase", resultValue: 12, resultUnit: "µM (IC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Zambia" },
      { assayType: "Enzyme inhibition", target: "HIV-1 protease", resultValue: 2.9, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "South Africa" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 150, resultUnit: "µM (CC50)", activityLabel: INACTIVE },
    ],
  },
  {
    code: "ADD-0015",
    label: "Kordofan gum arabinoside (fictional)",
    sourceRegion: "Sudan",
    sourceNotes: "Fictional example: tree gum fraction.",
    diseaseTags: ["leishmaniasis"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Leishmania donovani (amastigote)", resultValue: 38, resultUnit: "µM (IC50)", activityLabel: INACTIVE, performedInCountry: "Sudan" },
      { assayType: "In vitro growth inhibition", target: "Leishmania donovani (promastigote)", resultValue: 15, resultUnit: "µM (IC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Sudan" },
    ],
  },
  {
    code: "ADD-0016",
    label: "Rwenzori moss sesquiterpene (fictional)",
    sourceRegion: "Uganda",
    sourceNotes: "Fictional example: montane bryophyte extract.",
    diseaseTags: ["tuberculosis"],
    assays: [
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium tuberculosis (multidrug-resistant isolate)", resultValue: 1, resultUnit: "µg/mL (MIC)", activityLabel: ACTIVE, performedInCountry: "Uganda" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 9, resultUnit: "µM (CC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Uganda" },
      { assayType: "Intracellular killing", target: "Infected macrophages", resultValue: 0.3, resultUnit: "log10 CFU reduction", activityLabel: INACTIVE, performedInCountry: "Kenya" },
    ],
  },
  {
    code: "ADD-0017",
    label: "Sahara oasis date-palm acid (fictional)",
    sourceRegion: "North Africa",
    sourceNotes: "Fictional example: regional composite sample, placeholder provenance.",
    diseaseTags: ["schistosomiasis", "leishmaniasis"],
    assays: [
      { assayType: "Worm motility", target: "Schistosoma mansoni (adult worms)", resultValue: 15, resultUnit: "% motility reduction", activityLabel: INACTIVE, performedInCountry: "Morocco" },
      { assayType: "In vitro growth inhibition", target: "Leishmania major (amastigote)", resultValue: 6.8, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Tunisia" },
    ],
  },
  {
    code: "ADD-0018",
    label: "Okavango sedge lignan (fictional)",
    sourceRegion: "Botswana",
    sourceNotes: "Fictional example: wetland sedge rhizome extract.",
    diseaseTags: ["sleeping-sickness"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Trypanosoma brucei rhodesiense (bloodstream form)", resultValue: 11, resultUnit: "µM (IC50)", activityLabel: INCONCLUSIVE, performedInCountry: "Botswana" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 120, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Botswana" },
      { assayType: "In vivo efficacy (rodent model)", target: "Trypanosoma brucei infection", resultValue: 50, resultUnit: "% survival at day 30", activityLabel: INCONCLUSIVE, performedInCountry: "Kenya" },
    ],
  },
  {
    code: "ADD-0019",
    label: "Guinea savanna alkamide (fictional)",
    sourceRegion: "West Africa",
    sourceNotes: "Fictional example: multi-country composite from a made-up regional collection.",
    diseaseTags: ["malaria", "buruli-ulcer"],
    assays: [
      { assayType: "In vitro growth inhibition", target: "Plasmodium falciparum (asexual blood stage)", resultValue: 1.5, resultUnit: "µM (IC50)", activityLabel: ACTIVE, performedInCountry: "Burkina Faso" },
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium ulcerans", resultValue: 64, resultUnit: "µg/mL (MIC)", activityLabel: INACTIVE, performedInCountry: "Côte d'Ivoire" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 47, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Ghana" },
    ],
  },
  {
    code: "ADD-0020",
    label: "Great Lakes marine-derived macrolide (fictional)",
    sourceRegion: "East Africa",
    sourceNotes: "Fictional example: synthetic analogue series, placeholder origin.",
    diseaseTags: ["hiv", "tuberculosis"],
    assays: [
      { assayType: "Cell-based antiviral", target: "HIV-1 replication (cell culture)", resultValue: 0.6, resultUnit: "µM (EC50)", activityLabel: ACTIVE, performedInCountry: "Kenya" },
      { assayType: "Minimum inhibitory concentration", target: "Mycobacterium tuberculosis (reference strain)", resultValue: 4, resultUnit: "µg/mL (MIC)", activityLabel: ACTIVE, performedInCountry: "Tanzania" },
      { assayType: "Cytotoxicity", target: "Mammalian cell line", resultValue: 33, resultUnit: "µM (CC50)", activityLabel: INACTIVE, performedInCountry: "Kenya" },
      { assayType: "Selectivity index", resultValue: 55, resultUnit: "ratio", activityLabel: ACTIVE },
    ],
  },
];

async function main() {
  console.log("Seeding FICTIONAL example data...");

  // Repeatable: remove previous example rows only (real data is never touched).
  // Assays of example compounds are removed via the cascading foreign key.
  await prisma.assay.deleteMany({ where: { isExample: true } });
  await prisma.compound.deleteMany({ where: { isExample: true } });
  const taken = new Set(
    (await prisma.compound.findMany({ where: { code: { in: compounds.map((c) => c.code) } }, select: { code: true } })).map(
      (c) => c.code,
    ),
  );

  let assayCount = 0;
  let compoundCount = 0;
  for (const c of compounds) {
    if (taken.has(c.code)) {
      console.warn(`Skipping ${c.code}: code already used by a real (non-example) compound.`);
      continue;
    }
    compoundCount++;
    await prisma.compound.create({
      data: {
        code: c.code,
        name: `${c.code} ${c.label}`,
        // Intentionally null: this is fictional data and must not look like
        // real chemical structures.
        smiles: null,
        inchikey: null,
        formula: c.formula ?? null,
        sourceRegion: c.sourceRegion,
        sourceNotes: c.sourceNotes,
        diseaseTags: c.diseaseTags,
        countryOfOrigin: c.sourceRegion,
        sourceType: "OTHER",
        sourceName: "Fictional example seed",
        license: "Example data — not for research use",
        isExample: true,
        assays: {
          create: c.assays.map((a, i) => ({
            ...a,
            reference: `Fictional example dataset, record ${c.code}-A${i + 1}`,
            sourceType: "OTHER",
            sourceName: "Fictional example seed",
            license: "Example data — not for research use",
            sourceRecordId: `${c.code}-A${i + 1}`,
            isExample: true,
          })),
        },
      },
    });
    assayCount += c.assays.length;
  }

  console.log(`Seeded ${compoundCount} example compounds and ${assayCount} example assays.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
