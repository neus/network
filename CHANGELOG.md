# Changelog

Release notes for **`@neus/sdk`**, **`@neus/mcp-server`**, docs, and examples.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.1.5] - 2026-06-07

### Changed

- **Install SSOT** — `docs/install.mdx`, `docs/mcp/setup.mdx`, and `docs/mcp/journeys.mdx` replace the legacy `integrations/` tree.
- **Public copy** — first-touch README, install, MCP registry, plugin, and SDK surfaces use the GTM hierarchy (trust infrastructure → trust receipts → NEUS Verify).
- **Version alignment** — `@neus/sdk`, `@neus/mcp-server`, plugin, marketplace, and `server.json` aligned to `1.1.5`.

### Removed

- **`integrations/`** — redundant host install files; use `npx -y -p @neus/sdk neus setup` and [Install NEUS](https://docs.neus.network/install).
- **`.github/PULL_REQUEST_TEMPLATE.md`** — use GitHub issue templates and a clear PR description instead.
- **Repo-root `scripts/`** — maintainer guardrails and OG generators are not part of the public integrator surface.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.5 neus setup
npx -y -p @neus/sdk@1.1.5 neus auth
npx -y -p @neus/sdk@1.1.5 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [MCP journeys](https://docs.neus.network/mcp/journeys)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.3] - 2026-06-05

### Highlights

- **NEUS Trust install flow** - product docs now start from hosted MCP setup for supported agent environments.
- **Claude plugin path fix** - `skills` field changed from `./skills/neus-trust-workflow` to `skills/neus-trust-workflow` to prevent Claude Code path-escape validation from silently dropping the plugin.
- **Install router** - new docs page at `/install` routes users by environment.
- **Version alignment** - `@neus/sdk`, `@neus/mcp-server`, plugin, marketplace, and `server.json` all aligned to `1.1.3`.

### Added

- **`docs/install.mdx`** - single install router with platform cards and trust block.
- **`integrations/`** - host setup files for Cursor, Claude Code, VS Code, Codex, OpenAI, CI, MCP discovery, and Cline.
- **Cline support** - added to docs, CLI hints, and integration adapters.

### Changed

- **`server.json`** title changed from "NEUS MCP" to "NEUS Trust"; description aligned to product tagline.
- **`plugin.json`** and **`marketplace.json`** descriptions aligned to product tagline.
- **Homepage URLs** - all metadata `homepage`/`websiteUrl` fields now point to `https://docs.neus.network/install`.
- **Docs reframe** - `docs/mcp/ide-plugin.mdx` reframed as "Install NEUS Trust"; Claude marketplace commands collapsed into `<Accordion>`.
- **Branding cleanup** - removed "NEUS for AI assistants" as a page/card title across docs, READMEs, and SDK. Replaced with "Install NEUS Trust".
- **`docs/mcp/setup.mdx`** - fixed corrupted UTF-8 characters (em-dash, middle-dot, arrow).
- **`docs/agents/agent-identity.mdx`** - removed speculative external links (`agentskills.io`, `skills.sh`).
- **`examples/trust-receipts-showcase/README.md`** - "trust marketplace" → "trust showcase".
- **`sdk/README.md`** - fixed MCP docs table alignment.
- **Placeholder realism** - replaced `gate_abc123` with `gate_your-app-name` in all docs and READMEs.

### Removed

- Legacy `docs/images/neus-mark.png`, `docs/images/neus-logo.svg` (embedded monogram), and `sdk/neus-logo.svg`.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.3 neus setup
npx -y -p @neus/sdk@1.1.3 neus auth
npx -y -p @neus/sdk@1.1.3 neus doctor --live
```

### Links

- [Install NEUS Trust](https://docs.neus.network/install)
- [MCP setup](https://docs.neus.network/mcp/setup)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.2] - 2026-06-04

### Added

- **`@neus/sdk/mcp-hosts`** - shared helper for MCP install URLs, setup/auth commands, and product "Open in" hosts (Cursor, Claude Code, Codex).

### Changed

- **`neus import --from auto`** - prefers Claude Code, Cursor, and Claude Desktop when multiple agent workspaces are detected.
- Public setup docs keep assistant MCP setup separate from server-side setup.

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
