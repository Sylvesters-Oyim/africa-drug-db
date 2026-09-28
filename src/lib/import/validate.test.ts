import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { loadImportFiles, parseCsv } from "./parse";
import { assayNaturalKey, validateTable } from "./validate";

const compoundsCsv = (rows: string[]) =>
  parseCsv(["code,name,source_region,source_type,source_name,collection_date,doi,disease_tags,is_example", ...rows].join("\n"));

test("valid compound rows are coerced", () => {
  const t = validateTable(
    "Compounds",
    compoundsCsv(["add-0101,Test,Kenya,database,ChEMBL 35,2024-03-15,https://doi.org/10.1234/ABC.1,Malaria; hiv,yes"]),
  );
  assert.deepEqual(t.errors, []);
  assert.equal(t.rows.length, 1);
  const d = t.rows[0].data;
  assert.equal(d.code, "ADD-0101");
  assert.equal(d.sourceType, "DATABASE");
  assert.equal(d.doi, "10.1234/ABC.1");
  assert.deepEqual(d.diseaseTags, ["malaria", "hiv"]);
  assert.equal(d.isExample, true);
  assert.equal((d.collectionDate as Date).toISOString(), "2024-03-15T00:00:00.000Z");
});

test("missing required columns are reported on row 1", () => {
  const t = validateTable("Compounds", parseCsv("code,name\nA-1,x\n"));
  assert.ok(t.errors.some((e) => e.rowNumber === 1 && e.column === "source_region"));
  assert.ok(t.errors.some((e) => e.rowNumber === 1 && e.column === "source_type"));
});

test("row-level errors carry spreadsheet row numbers", () => {
  const t = validateTable(
    "Compounds",
    compoundsCsv([
      "A-1,Ok,Kenya,LITERATURE,J,,,,",
      ",No code,Kenya,LITERATURE,J,,,,",
      "A-3,Bad enum,Kenya,BOOK,J,,,,",
      "A-4,Bad date,Kenya,OTHER,J,2024-02-30,,,",
      "A-5,Bad doi,Kenya,OTHER,J,,not-a-doi,,",
      "A-6,Bad tag,Kenya,OTHER,J,,,flu,",
      "a-1,Duplicate,Kenya,OTHER,J,,,,",
    ]),
  );
  const byRow = new Map(t.errors.map((e) => [e.rowNumber, e.message]));
  assert.match(byRow.get(3)!, /"code" is required/);
  assert.match(byRow.get(4)!, /source_type/);
  assert.match(byRow.get(5)!, /YYYY-MM-DD/);
  assert.match(byRow.get(6)!, /10\.xxxx/);
  assert.match(byRow.get(7)!, /Unknown disease tag/);
  assert.match(byRow.get(8)!, /Duplicate compound code "A-1" \(first seen on row 2\)/);
  assert.equal(t.rows.length, 1);
});

test("blank rows are skipped", () => {
  const t = validateTable("Compounds", compoundsCsv(["A-1,Ok,Kenya,OTHER,J,,,,", ",,,,,,,,", ""]));
  assert.deepEqual(t.errors, []);
  assert.equal(t.rows.length, 1);
});

test("assay numbers, relations and activity", () => {
  const csv = parseCsv(
    [
      "compound_code,assay_type,activity,measurement_type,relation,value,units,source_type,source_name",
      "A-1,Growth,active,IC50,,0.5,µM,LITERATURE,J",
      "A-1,Growth,MAYBE,IC50,,0.5,µM,LITERATURE,J",
      "A-1,Tox,INACTIVE,CC50,>,,µM,LITERATURE,J",
      "A-1,Tox2,INACTIVE,CC50,=,\"1,5\",µM,LITERATURE,J",
      "A-1,Tox3,INACTIVE,CC50,≥,100,µM,LITERATURE,J",
    ].join("\n"),
  );
  const t = validateTable("Assays", csv);
  assert.equal(t.rows[0].data.activityLabel, "ACTIVE");
  assert.equal(t.rows[0].data.resultValue, 0.5);
  assert.equal(t.rows[0].data.relation, "=", "relation defaults to = when a value is given");
  const byRow = new Map(t.errors.map((e) => [e.rowNumber, e.message]));
  assert.match(byRow.get(3)!, /activity/);
  assert.match(byRow.get(4)!, /requires a "value"/);
  assert.match(byRow.get(5)!, /comma as decimal/);
  assert.equal(t.rows.find((r) => r.data.assayType === "Tox3")?.data.relation, ">=");
});

test("assay natural key prefers the source record id", () => {
  assert.equal(assayNaturalKey("a-1", { sourceRecordId: "CHEMBL1", assayType: "x" }), "rid|A-1|chembl1");
  assert.equal(
    assayNaturalKey("A-1", { assayType: "Growth", target: null, organism: "P. falciparum", measurementType: "IC50", sourceName: "J" }),
    "nat|A-1|growth||p. falciparum|ic50|j|",
  );
});

test("semicolon-delimited CSV is detected", () => {
  const t = parseCsv("code;name;source_region;source_type;source_name\nA-1;X;Kenya;OTHER;J\n");
  assert.deepEqual(validateTable("Compounds", t).errors, []);
});

test("shipped templates parse and validate cleanly", async () => {
  const dir = join(process.cwd(), "public", "templates");
  for (const files of [["compounds.csv", "assays.csv"], ["africa-drug-db-import-template.xlsx"]]) {
    const loaded = await loadImportFiles(
      await Promise.all(files.map(async (f) => ({ name: f, data: await readFile(join(dir, f)) }))),
    );
    assert.deepEqual(loaded.fileErrors, []);
    const c = validateTable("Compounds", loaded.compounds!);
    const a = validateTable("Assays", loaded.assays!);
    assert.deepEqual([...c.errors, ...a.errors], [], files.join("+"));
    assert.equal(c.rows.length, 2);
    assert.equal(a.rows.length, 2);
    assert.ok(c.rows.every((r) => r.data.isExample === true));
  }
});
