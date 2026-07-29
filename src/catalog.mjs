const CATALOG_SCHEMA = "uri-twin.catalog/v1";
const ID = /^uri-twin-[a-z0-9-]+$/;
const FAMILY = /^[a-z][a-z0-9-]*$/;
const REF = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const TAG = /^v\d+\.\d+\.\d+$/;
const SCHEMA = /^[a-z0-9.-]+\/[vV]\d+$/;
const REPOSITORY = /^https:\/\/github\.com\/uri-twin\/(uri-twin-[a-z0-9-]+)\.git$/;

function relativePath(value) {
  const path = String(value || "");
  return Boolean(path && !path.startsWith("/") && !path.split("/").includes(".."));
}

export function validateCatalog(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("catalog_document_invalid");
  if (input.schema !== CATALOG_SCHEMA || input.version !== 1) throw new Error("catalog_schema_invalid");
  if (input.organization?.id !== "uri-twin" || input.organization?.url !== "https://github.com/uri-twin") {
    throw new Error("catalog_organization_invalid");
  }
  if (!Array.isArray(input.repositories) || !input.repositories.length) throw new Error("catalog_repositories_missing");

  const ids = new Set();
  const families = new Set();
  for (const entry of input.repositories) {
    if (!entry || typeof entry !== "object" || !ID.test(String(entry.id || "")) || ids.has(entry.id)) {
      throw new Error("catalog_repository_id_invalid");
    }
    ids.add(entry.id);
    if (!FAMILY.test(String(entry.family || "")) || families.has(entry.family)) throw new Error("catalog_family_invalid");
    families.add(entry.family);
    const repositoryMatch = REPOSITORY.exec(String(entry.repository || ""));
    if (!repositoryMatch || repositoryMatch[1] !== entry.id) throw new Error("catalog_repository_url_invalid");
    if (!REF.test(String(entry.default_ref || "")) || String(entry.default_ref).includes("..")) throw new Error("catalog_ref_invalid");
    if (entry.package !== `@uri-twin/${entry.id.replace(/^uri-twin-/, "")}`) throw new Error("catalog_package_invalid");
    if (!TAG.test(String(entry.latest_tag || ""))) throw new Error("catalog_tag_invalid");
    if (!Array.isArray(entry.supported_schemas) || !entry.supported_schemas.length
      || new Set(entry.supported_schemas).size !== entry.supported_schemas.length
      || entry.supported_schemas.some((schema) => !SCHEMA.test(String(schema)))) {
      throw new Error("catalog_supported_schemas_invalid");
    }
    if (entry.baseline !== null) {
      if (!entry.baseline || !relativePath(entry.baseline.path) || !SCHEMA.test(String(entry.baseline.schema || ""))) {
        throw new Error("catalog_baseline_invalid");
      }
      if (!entry.supported_schemas.includes(entry.baseline.schema)) throw new Error("catalog_baseline_schema_unlisted");
    }
  }
  return input;
}

export function familyEntry(catalog, family) {
  return validateCatalog(catalog).repositories.find((entry) => entry.family === family) || null;
}

export function baselineSource(catalog, family) {
  const entry = familyEntry(catalog, family);
  if (!entry?.baseline) return null;
  return {
    repository: entry.repository,
    ref: entry.default_ref,
    path: entry.baseline.path,
    schema: entry.baseline.schema,
    latest_tag: entry.latest_tag,
  };
}
