# @uri-twin/catalog

Machine-readable organization index for reviewed URI Twin repositories.

`catalog.v1.json` maps one unique family to its Git repository, package,
default ref, optional reviewed baseline and supported schemas. Consumers can
resolve a family through this catalog without inventing repository names or
baseline paths.

The catalog grants no authority. It contains no credentials, command payloads
or mutable API state. A listed baseline still has to pass the consumer's own
schema and policy validation, and release attestation remains a separate gate.

```bash
npm install
npm test
URI_TWIN_ORG_ROOT=.. npm run verify
```

CI also clones every public repository declared by the catalog and checks that
the package name, version tag and baseline schema agree with the index.

## Current families

| Family | Repository | Baseline |
| --- | --- | --- |
| `core` | `uri-twin-core` | contracts only |
| `plesk` | `uri-twin-plesk` | `baseline/plesk-surface.v1.json` |

Adding a family requires a real repository, connector integration and a green
manifest-route conformance test. Discovery alone is not sufficient.
