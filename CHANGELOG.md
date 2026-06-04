# Changelog

Release notes for **`@neus/sdk`**, **`@neus/mcp-server`**, docs, and examples.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **`@neus/sdk/mcp-hosts`** - browser-safe MCP install constants, setup/auth commands, and product "Open in" host metadata for Cursor, Claude Code, and Codex.
### Changed

- **Brand marks** - procedurally generated docs OG cards (Michroma + particle-ring, 1200×630) under `docs/images/og-*.png`; `npm run generate:docs-og` from `neus` brand generator.
- **`neus setup`** - public setup is focused on hosted MCP for Claude Code, Codex, Cursor, and VS Code.
- **`neus import --from auto`** - prefers Claude Code, Cursor, and Claude Desktop.
- Public docs and plugin guidance now stay focused on hosted MCP and assistant setup.
- **Marketplace + MCP registry copy** - GTM-aligned descriptions for `.claude-plugin/marketplace.json`, NEUS Trust plugin, `server.json` tool blurbs, examples, and discovery keywords (publish with `@neus/mcp-server` republish).

### Removed

- Legacy `docs/images/neus-mark.png`, `docs/images/neus-logo.svg` (embedded monogram), and `sdk/neus-logo.svg`.

## [1.1.2] - 2026-06-04

### Added

- **`@neus/sdk/mcp-hosts`** - single SSOT for MCP install URLs, setup/auth commands, and product "Open in" hosts (Cursor, Claude Code, Codex).

### Changed

- **`neus import --from auto`** - prefers Claude Code, Cursor, and Claude Desktop when multiple agent workspaces are detected.
- Public setup docs keep assistant MCP setup separate from internal operations.

### Fixed

- Product/UI alignment: Codex setup uses `--client codex` and Codex-owned OAuth, not VS Code client flags.

## [1.1.1] - 2026-05-28

### Highlights

- **MCP discovery + runtime alignment** - `neus_context` returns signed-in profile context; discovery metadata and docs match live hosted MCP behavior.
- **NEUS for AI assistants** - install hub, plugin, and docs use one OAuth-first messaging stack across Cursor, Codex, VS Code, and Claude Code.

### Changed

- **`@neus/mcp-server` `server.json`** - updated tool descriptions, session bootstrap prompt, and ide-plugin discovery URL (requires npm republish; runtime ships with protocol deploy).
- **`neus setup` / CLI** - Codex uses `~/.codex/config.toml` through `codex mcp add`; VS Code keeps its own MCP config paths. Setup hints point to [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin).
- **NEUS Trust plugin (v1.1.1)** - marketplace version tracks **`@neus/sdk@1.1.1`** / **`@neus/mcp-server@1.1.1`**.
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

- **OAuth-first MCP onboarding** - connect editors and assistants in three commands: `neus setup` -> `neus auth` -> `neus doctor --live`.
- **`@neus/mcp-server` on npm** with OAuth discovery metadata for MCP registries and installers.
- **Twelve public MCP tools** documented end-to-end, including encrypted secrets (`neus_secret_*`).
- **NEUS Trust plugin (v1.1.0)** - Claude Code marketplace install for hosted MCP + trust workflow skill.

### Added

- `@neus/mcp-server` npm package (discovery metadata only; runtime stays at `https://mcp.neus.network/mcp`).
- MCP docs: [Encrypted secrets](https://docs.neus.network/mcp/secrets), OAuth client reference (`neus-cli`), npm package table in [MCP setup](https://docs.neus.network/mcp/setup).
- [Roadmap](https://docs.neus.network/platform/status) - shipped work and planned milestones.
- CLI: `neus setup` reminds you to run `neus auth` when no credential is configured.
- Hosted MCP server-card includes OAuth discovery (`authorization.resource_metadata_url`).

### Changed

- **Default MCP auth path is OAuth**, not Profile access keys. Keys remain supported for **servers and CI only**.
- Docs and setup flows on [neus.network](https://neus.network) now lead with OAuth first.
- MCP discovery at `/.well-known/mcp.json` points to the hosted server with the current twelve-tool listing.
- `@neus/mcp-server` discovery metadata uses OAuth-first tool descriptions.

### Fixed

- Docs, setup flows, API discovery, and live MCP metadata now match.
- CLI setup no longer suggests unsupported MCP client names.

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
