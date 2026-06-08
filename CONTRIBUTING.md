# Contributing

Thank you for helping improve NEUS materials in this open project.

**If you are integrating NEUS into a product**, use **[docs.neus.network](https://docs.neus.network)** and the live product first - the table below is for people proposing changes here.

| Need | Where |
| --- | --- |
| Product documentation | [docs.neus.network](https://docs.neus.network) |
| Possible bugs | [Issues](https://github.com/neus/network/issues) |
| Ideas and questions | [Discussions](https://github.com/neus/network/discussions) |
| Security reports | [dev@neus.network](mailto:dev@neus.network) (do not post publicly) |
| Release notes | [CHANGELOG.md](./CHANGELOG.md) |

## What helps

- Bug reports with clear steps to reproduce and no secrets in the thread.
- Verifier suggestions that spell out the user-visible outcome you want.
- Updates to the SDK, examples, or documentation that match what the live product does today.
- Tests or examples when you change behavior that builders rely on.

**Do not** share keys, tokens, bearer secrets, or private proof content in public issues or change descriptions.

## Do not commit

These paths are local-only or generated elsewhere (see `.gitignore`):

- `.env`, `.npmrc`, secrets, and key material
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.neus/`, `.cursor/`, `.claude/settings*.json`
- `integrations/` (removed — install docs are the SSOT)
- `/scripts/` at repo root (maintainer tooling — not part of this public repo)
- `sdk/cjs/` and other build artifacts

Verifier schemas ship from **`protocol`** (`npm run verifier:sync`); keep `spec/VERIFIERS.json` and `docs/verifiers/schemas/` in sync when you change verifiers.

## Describing your change

Explain **what builders or end users will experience differently** (for example new fields, new errors, or renamed concepts). If you adjust verifiers or any documented HTTP surface, keep the written API reference and examples aligned with the live product.
