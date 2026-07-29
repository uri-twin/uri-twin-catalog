#!/usr/bin/env node

import assert from "node:assert/strict";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";

import {validateCatalog} from "../src/catalog.mjs";

const catalog = validateCatalog(JSON.parse(await readFile(new URL("../catalog.v1.json", import.meta.url), "utf8")));
const localRoot = String(process.env.URI_TWIN_ORG_ROOT || "").trim();
const temporary = localRoot ? null : await mkdtemp(join(tmpdir(), "uri-twin-catalog-"));

try {
  for (const entry of catalog.repositories) {
    const checkout = localRoot ? join(localRoot, entry.id) : join(temporary, entry.id);
    if (!localRoot) {
      const cloned = spawnSync("git", ["clone", "--quiet", "--depth", "1", "--branch", entry.default_ref, "--", entry.repository, checkout], {
        encoding: "utf8",
        env: {...process.env, GIT_TERMINAL_PROMPT: "0"},
      });
      if (cloned.status !== 0) throw new Error(`catalog_clone_failed:${entry.id}`);
    }
    const packageDocument = JSON.parse(await readFile(join(checkout, "package.json"), "utf8"));
    assert.equal(packageDocument.name, entry.package, `${entry.id}: package name`);
    assert.equal(`v${packageDocument.version}`, entry.latest_tag, `${entry.id}: latest tag`);
    if (entry.baseline) {
      const baseline = JSON.parse(await readFile(join(checkout, entry.baseline.path), "utf8"));
      assert.equal(baseline.schema, entry.baseline.schema, `${entry.id}: baseline schema`);
    }
  }
  process.stdout.write(`${JSON.stringify({ok: true, repositories: catalog.repositories.length, source: localRoot ? "local" : "git"}, null, 2)}\n`);
} finally {
  if (temporary) await rm(temporary, {recursive: true, force: true});
}
