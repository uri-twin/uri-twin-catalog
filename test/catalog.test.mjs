import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {baselineSource, familyEntry, validateCatalog} from "../src/catalog.mjs";

const catalog = JSON.parse(await readFile(new URL("../catalog.v1.json", import.meta.url), "utf8"));

test("catalog indexes each URI Twin family once", () => {
  const validated = validateCatalog(catalog);
  assert.deepEqual(validated.repositories.map((entry) => entry.family), ["core", "plesk"]);
  assert.equal(familyEntry(validated, "missing"), null);
});

test("Plesk resolves to its reviewed Git baseline and supported schema", () => {
  assert.deepEqual(baselineSource(catalog, "plesk"), {
    repository: "https://github.com/uri-twin/uri-twin-plesk.git",
    ref: "main",
    path: "baseline/plesk-surface.v1.json",
    schema: "uri-twin.baseline/v1",
    latest_tag: "v0.2.2",
  });
});

test("catalog rejects duplicate families, unsafe repositories and unlisted baseline schemas", () => {
  const duplicate = structuredClone(catalog);
  duplicate.repositories[1].family = "core";
  assert.throws(() => validateCatalog(duplicate), /catalog_family_invalid/);

  const credential = structuredClone(catalog);
  credential.repositories[1].repository = "https://token@github.com/uri-twin/uri-twin-plesk.git";
  assert.throws(() => validateCatalog(credential), /catalog_repository_url_invalid/);

  const schema = structuredClone(catalog);
  schema.repositories[1].supported_schemas = ["subactor.twin-fact/v1"];
  assert.throws(() => validateCatalog(schema), /catalog_baseline_schema_unlisted/);
});
