# AGENTS.md — network (public SDK, spec, docs)

**Audience:** AI agents working in the **network** repository.  
**Updated:** 2026-04-09

---

## Scope

This repository is **public**. It ships the SDK, OpenAPI description, verifier JSON Schemas under `spec/` and `docs/verifiers/schemas/`, and published documentation sources. It does **not** ship the private web application behind `neus.network`.

---

## Repo layout

| What | Where |
|------|--------|
| SDK | `sdk/` |
| Verifier schemas / catalog assets | `spec/`, `docs/verifiers/` |
| OpenAPI | `docs/openapi/` |
| Examples | `examples/` |

---

## Contract alignment (do not invent)

1. Treat **`GET /api/v1/verification/verifiers`** and **`docs/openapi/public-api.json`** as the live contract references for runtime behavior.
2. Keep verifier IDs and JSON Schemas aligned with **`spec/verifiers/schemas/*.json`** and the mirrored copies under **`docs/verifiers/schemas/`** (see `CONTRIBUTING.md`).
3. Run scripts from **`network/package.json`** before claiming docs or SDK changes are complete.

---

## See also

- [`README.md`](./README.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
