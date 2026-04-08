# Contributing to NEUS Network (open source)

**Documentation:** [docs.neus.network](https://docs.neus.network)

| Need | Channel |
|------|---------|
| Product integration | [docs.neus.network](https://docs.neus.network) |
| Bugs | [GitHub Issues](https://github.com/neus/network/issues) |
| Ideas | [GitHub Discussions](https://github.com/neus/network/discussions) |
| Security vulnerabilities | [dev@neus.network](mailto:dev@neus.network) — do not file publicly |

## What we welcome

- **Bug reports** with a minimal repro (sanitized logs, no secrets).
- **Verifier proposals** (new checks or clarified inputs) with expected user-visible behavior.
- **SDK, widgets, docs, and examples** improvements that match the live API.
- **Tests** when behavior or contracts change.

Do **not** include private keys, API tokens, bearer secrets, or sensitive content from private proofs in issues or pull requests.

## SDK CLI

The **`neus`** binary (`neus init`) is **stdout-only** by design: hosted MCP snippet and documentation URLs. Do not add file writes, account creation, or key generation without an explicit product decision and semver major.

## Documentation standards

Write for **integrators and builders**: clear procedures, neutral tone, task-oriented pages.

- Prefer linking to **field lists** and schemas instead of duplicating them.
- Fetch the current verifier catalog from **`GET /api/v1/verification/verifiers`**; static copies in the repo are for tooling and docs, not a substitute for the live response at runtime.
- Published docs ship from this repository to **docs.neus.network**. Verifier Markdown under `docs/verifiers/` and JSON Schemas under `docs/verifiers/schemas/` complement the guides; see [docs/verifiers/README.md](docs/verifiers/README.md).

## Verifier specs and schemas

- `spec/VERIFIERS.json` lists verifiers with `inputSchemaPath` pointing at `spec/verifiers/schemas/*.json`. The same schema files are mirrored under `docs/verifiers/schemas/` for the documentation site.
- When verifier metadata or schemas change, describe **user-visible or contract impact** in the pull request.

## Pull requests

- Summarize **behavior or contract impact** when docs, OpenAPI, or verifier specs change.
- Note **tests run** (for code changes).
- For substantive edits to **legal** pages, request review before merging.
