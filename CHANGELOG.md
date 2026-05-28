# Changelog

Release notes for **`@neus/sdk`**, **`@neus/mcp-server`**, docs, and examples.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.1.1] - 2026-05-28

### Highlights

- **MCP discovery + runtime alignment** — `neus_context` returns signed-in profile context; discovery metadata and docs match live hosted MCP behavior.
- **NEUS for AI assistants** — install hub, plugin, and docs use one OAuth-first messaging stack across Cursor, VS Code/Codex, and Claude Code.

### Changed

- **`@neus/mcp-server` `server.json`** — updated tool descriptions, session bootstrap prompt, and ide-plugin discovery URL (requires npm republish; runtime ships with protocol deploy).
- **`neus setup` / CLI** — VS Code/Codex MCP config paths on macOS and Linux; setup hints point to [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin).
- **NEUS Trust plugin (v1.1.1)** — marketplace version tracks **`@neus/sdk@1.1.1`** / **`@neus/mcp-server@1.1.1`**.
- Docs, plugin skill, and public README aligned to trust-infrastructure positioning and streamlined MCP startup (`neus_context` once; `neus_me` for refresh or public lookup only).

### Fixed

- npm discovery metadata drift vs git and live MCP after the 1.1.0 publish window.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.1 neus setup
npx -y -p @neus/sdk@1.1.1 neus auth
npx -y -p @neus/sdk@1.1.1 neus doctor --live
```

### Links

- [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin)
- [MCP setup](https://docs.neus.network/mcp/setup)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

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

[Unreleased]: https://github.com/neus/network/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/neus/network/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/neus/network/compare/v1.0.12...v1.1.0
[1.0.12]: https://github.com/neus/network/releases/tag/v1.0.12
