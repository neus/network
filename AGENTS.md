# AGENTS.md — network (public SDK, spec, docs)

**Audience:** AI agents working in the **network** repository.  
**Updated:** 2026-04-09


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
