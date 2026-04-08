# AGENTS.md — network (public SDK, spec, docs)

**Audience:** AI agents working in the **network** repository.  
**Updated:** 2026-04-07

---

## Start here (multi-repo)

**Monorepo manifest:** [`../AGENTS.md`](../AGENTS.md) (parent folder—session loop, bootstrap, boundaries).

**Tooling map:** [`../TOOLING_SSOT.md`](../TOOLING_SSOT.md) (`.cursor` / `.claude` mirrors).

This repo is **public**. It does **not** contain verifier implementation or private hub UI.

---

## Repo role

| What | Where |
|------|--------|
| SDK | `sdk/` |
| Verifier schemas / public spec | `spec/`, `docs/verifiers/` |
| OpenAPI / public API docs | `docs/openapi/` |
| Examples | `examples/` |

---

## Agent loop (short)

1. Read [`../AGENTS.md`](../AGENTS.md) if the task spans repos or public API shape.
2. Align field names and verifier IDs with **backend SSOT** and **`network/spec`**—do not invent schemas.
3. Run package scripts (`npm test`, lint) as defined in **`network/package.json`** before claiming done.

---

## See also

- [`README.md`](./README.md)
- [`protocol/AGENTS.md`](../protocol/AGENTS.md) when backend behavior is in scope (from a full workspace checkout).
