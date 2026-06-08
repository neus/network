# Verifier JSON Schemas

Integrator-facing request shapes for the public verifier catalog. User-facing guides live under **[Verification](../verification/verifiers)**.

## Source of truth

| Artifact | Role |
| -------- | ---- |
| **`schemas/*.json`** | One JSON Schema per public verifier |
| **`../../spec/VERIFIERS.json`** | Catalog index; each `inputSchemaPath` is `docs/verifiers/schemas/<id>.json` |

Schemas and the spec are generated from **`protocol`** (`verifierRegistry.js` via `npm run verifier:sync`). Do not add parallel schema trees or hand-maintained duplicates in this repo.
