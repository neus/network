# Verifier specs

Machine-readable assets for the verifier catalog.

- [`VERIFIERS.json`](../VERIFIERS.json) — verifier index
- [`schemas/`](./schemas/) — JSON Schema per verifier

**Product documentation:** [docs.neus.network/verification/verifiers](https://docs.neus.network/verification/verifiers) — the API returns current verifier IDs, schemas, and metadata.

JSON Schemas in this repository describe request and response shapes for tooling and validation. At runtime, fetch **`GET /api/v1/verification/verifiers`**; do not treat static copies as a substitute for the live response.
