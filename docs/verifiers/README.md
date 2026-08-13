# Verifier JSON Schemas

Request shapes for the public verifier catalog. Guides for people integrating NEUS live under **[Verification](../verification/verifiers)**.

## Source of truth

| Artifact | Role |
| -------- | ---- |
| **`schemas/*.json`** | One JSON Schema per public verifier |
| **`../../spec/VERIFIERS.json`** | Catalog index; each `inputSchemaPath` is `docs/verifiers/schemas/<id>.json` |

Schemas and the spec live in this repo as the public verifier registry; the protocol picks up definitions from here. To propose a new public check, see [Propose a verifier](../verification/propose-a-verifier).
