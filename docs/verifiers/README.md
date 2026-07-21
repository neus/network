# Verifier JSON Schemas

Request shapes for the public verifier catalog. Guides for people integrating NEUS live under **[Verification](../verification/verifiers)**.

## Source of truth

| Artifact | Role |
| -------- | ---- |
| **`schemas/*.json`** | One JSON Schema per public verifier |
| **`../../spec/VERIFIERS.json`** | Catalog index; each `inputSchemaPath` is `docs/verifiers/schemas/<id>.json` |

Schemas and the spec are generated from the NEUS protocol verifier registry. Use these files as the current request shapes for API integrations and open a PR against `protocol` if a verifier definition needs to change.
