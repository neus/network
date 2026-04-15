# Contributing

Public SDK, docs source, examples, and verifier specs. Integrate via **[docs.neus.network](https://docs.neus.network)** and the hosted APIs.

| Need | Channel |
| --- | --- |
| Docs | [docs.neus.network](https://docs.neus.network) |
| Bugs | [Issues](https://github.com/neus/network/issues) |
| Ideas | [Discussions](https://github.com/neus/network/discussions) |
| Security | [dev@neus.network](mailto:dev@neus.network) (do not file publicly) |

**Welcome:** focused bug reports (repro, no secrets), verifier proposals with expected behavior, SDK/docs/example fixes aligned with the live API, tests when contracts change.

**Do not** post keys, tokens, bearer secrets, or sensitive proof content in issues or PRs.

**CLI:** `npx -y -p @neus/sdk neus init` prints MCP JSON and doc URLs to stdout only. It does not write files or create accounts.

**Node:** root `package.json` — Node ≥ 20 (docs tooling). `sdk/package.json` — Node ≥ 20. Run `npm run test:sdk` or `npm --prefix sdk test` for SDK changes.

MCP: **[docs.neus.network/mcp](https://docs.neus.network/mcp/overview)**. This repo includes `mcp/` for the published `@neus/mcp-server` package; do not duplicate server implementations elsewhere in the tree.

**Docs:** Task-oriented, neutral tone. Link schemas instead of copying. Live verifier list: `GET /api/v1/verification/verifiers`. See [docs/verifiers/README.md](docs/verifiers/README.md).

**Specs:** `spec/VERIFIERS.json` and `spec/verifiers/schemas/*.json`; copies under `docs/verifiers/schemas/` for the doc site. PRs that change verifiers should state user-visible or contract impact.

**PRs:** Summarize contract impact for OpenAPI/spec/docs changes; note tests run for code.
