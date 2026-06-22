# Verifier JSON Schemas

Integrator-facing request shapes for the public verifier catalog. User-facing guides live under **[Verification](../verification/verifiers)**.

## Source of truth

| Artifact | Role |
| -------- | ---- |
| **`schemas/*.json`** | One JSON Schema per public verifier |
| **`../../spec/VERIFIERS.json`** | Catalog index; each `inputSchemaPath` is `docs/verifiers/schemas/<id>.json` |

Schemas and the spec are generated from the NEUS protocol verifier registry. Use these files as the current integrator-facing request shapes and open a PR against `protocol` if a verifier definition needs to change.
