# Verifier JSON Schemas

Integrator-facing request shapes for the public verifier catalog. The live catalog and user-facing docs live under **[Verification](../verification/verifiers)** in Mintlify.

- **`schemas/`** — JSON Schema per verifier (`ownership-basic.json`, `agent-delegation.json`, …). Hosted OAuth verifiers include fields the hosted flow fills automatically; supply only the documented request fields from each **Verification** page.
- **`../spec/VERIFIERS.json`** — Machine-readable catalog index (`inputSchemaPath` points here under `docs/verifiers/schemas/`).

Do not maintain parallel schema trees elsewhere in this repo.
