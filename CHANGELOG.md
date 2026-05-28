# Changelog

Release notes for **`@neus/sdk`**, **`@neus/mcp-server`**, docs, and examples.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- **NEUS Trust plugin & docs** — [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin) install hub (Cursor, VS Code/Codex, Claude Code; manual paths for other MCP hosts). Plugin version tracks **`@neus/sdk@1.1.0`** / **`@neus/mcp-server@1.1.0`**.

## [1.1.0] - 2026-05-26

### Highlights

- **OAuth-first MCP onboarding** — connect editors and assistants in three commands: `neus setup` → `neus auth` → `neus doctor --live`.
- **`@neus/mcp-server` on npm** with OAuth discovery metadata for MCP registries and installers.
- **Twelve public MCP tools** documented end-to-end, including encrypted secrets (`neus_secret_*`).
- **NEUS Trust plugin (v1.1.0)** — Claude Code marketplace install for hosted MCP + trust workflow skill.

### Added

- `@neus/mcp-server` npm package (discovery metadata only; runtime stays at `https://mcp.neus.network/mcp`).
- MCP docs: [Encrypted secrets](https://docs.neus.network/mcp/secrets), OAuth client reference (`neus-cli`), npm package table in [MCP setup](https://docs.neus.network/mcp/setup).
- [Roadmap](https://docs.neus.network/platform/status) — shipped work and planned milestones.
- CLI: `neus setup` reminds you to run `neus auth` when no credential is configured.
- Hosted MCP server-card includes OAuth discovery (`authorization.resource_metadata_url`).

### Changed

- **Default MCP auth path is OAuth**, not Profile access keys. Keys remain supported for **servers and CI only**.
- Docs and setup flows on [neus.network](https://neus.network) now recommend OAuth first.
- MCP discovery at `/.well-known/mcp.json` points to the hosted server with the current twelve-tool listing.
- `@neus/mcp-server` discovery metadata uses OAuth-first tool descriptions.

### Fixed

- Docs, setup flows, API discovery, and live MCP metadata now match.
- OpenClaw setup no longer passes unsupported `--client openclaw` to the CLI.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.0 neus setup
npx -y -p @neus/sdk@1.1.0 neus auth
npx -y -p @neus/sdk@1.1.0 neus doctor --live
```

If you already use a Profile access key for automation, keep `neus setup --access-key <npk_...>`. Interactive editors should prefer OAuth.

### Links

- [Roadmap](https://docs.neus.network/platform/status)
- [MCP setup](https://docs.neus.network/mcp/setup)
- [MCP OAuth](https://docs.neus.network/mcp/oauth)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.0.12] - 2026-05-26

### Added

- `@neus/sdk` with hosted MCP CLI (`neus setup`, `neus auth`, import/export) and OAuth browser flow.

[Unreleased]: https://github.com/neus/network/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/neus/network/compare/v1.0.12...v1.1.0
[1.0.12]: https://github.com/neus/network/releases/tag/v1.0.12
