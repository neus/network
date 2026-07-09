# Changelog

Release notes for **`@neus/sdk`**, **`@neus/mcp-server`**, docs, and examples.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.2] - 2026-07-09

### Fixed

- **Cursor marketplace install** — the NEUS Trust plugin again ships the Cursor MCP config required for one-click install.
- **Trust workflow skill** — clearer setup, trust-before-action flow, and NEUS Verify summaries (Passed / Action needed / Blocked).
- **Docs and examples** — NEUS Verify examples match the live assistant guidance.

### Changed

- **Plugin and marketplace copy** — clearer language around identity, permissions, trust receipts, and Vault.
- **`@neus/sdk` and `@neus/mcp-server`** — `1.3.2`.

### Upgrade

```bash
npm i @neus/sdk@1.3.2
# or zero-install
npx -y -p @neus/sdk@1.3.2 neus doctor --live
```

## [1.3.1] - 2026-07-08

### Changed

- **Connect agent context** — `neus mount` and `@neus/sdk/runtime-mount` are the supported path for loading a Trusted Agent into a project.
- **`@neus/sdk` and `@neus/mcp-server`** — `1.3.1`.

### Upgrade

```bash
npm i @neus/sdk@1.3.1
# or zero-install
npx -y -p @neus/sdk@1.3.1 neus doctor --live
```

## [1.3.0] - 2026-07-08

### Added

- **`llms.txt` and `pricing.txt`** — machine-readable product and pricing summaries for AI search and citation.
- **Docs crawlability** — AI search crawlers can index the public docs.

### Changed

- **SDK public API** — only documented integrator exports are public; CLI-only modules stay available through their own import paths.
- **Docs home** — clearer landing page and primary call to action.
- **Codex marketplace** — NEUS Trust plugin install metadata for Codex.

### Fixed

- **TypeScript types** — mount and adapter declarations match the runtime SDK.
- **`ai-content-moderation`** — content types match the published API.
- **Docs samples** — correct runtime-mount import path; examples say “receipt ID” in user-facing copy.

### Upgrade

```bash
npm i @neus/sdk@1.3.0
# or zero-install
npx -y -p @neus/sdk@1.3.0 neus doctor --live
```

## [1.2.5] - 2026-07-03

### Added

- **NEUS Trust plugin for every editor** — one install path for Cursor, Claude Code, Codex, and VS Code.

### Changed

- **Plugin branding** — crisp SVG mark in marketplaces, with PNG fallback where needed.
- **Cursor install** — marketplace listing and MCP config match Cursor’s expected format.
- **Brand assets** — plugin and docs icons match the live NEUS mark.

### Upgrade

```bash
npm i @neus/sdk@1.2.5
# or zero-install
npx -y -p @neus/sdk@1.2.5 neus doctor --live
```

## [1.2.4] - 2026-06-23

### Fixed

- **Version consistency** — SDK, MCP server, plugin, and trust workflow skill all report `1.2.4`.

### Upgrade

```bash
npm i @neus/sdk@1.2.4
# or zero-install
npx -y -p @neus/sdk@1.2.4 neus doctor --live
```

## [1.2.3] - 2026-06-21

### Added

- **VS Code** — `neus setup` and the install docs include VS Code alongside Cursor, Claude Code, and Codex.
- **Editor sign-in** — marketplace installs discover NEUS OAuth automatically in supported editors.

### Fixed

- **`neus doctor --live`** — works with browser OAuth sessions, not only access keys.
- **Reachability checks** — a sign-in challenge from the MCP server is treated as reachable, not down.

### Changed

- **`@neus/sdk` and `@neus/mcp-server`** — `1.2.3`.

### Upgrade

```bash
npm i @neus/sdk@1.2.3
# or zero-install
npx -y -p @neus/sdk@1.2.3 neus doctor --live
```

## [1.2.2] - 2026-06-21

### Fixed

- **OAuth docs** — install guidance matches the real editor sign-in flow: short-lived access tokens with silent refresh, long-lived session.
- **Cursor setup** — no longer warns about a stale local token format.

### Changed

- **`@neus/sdk` and `@neus/mcp-server`** — `1.2.2`.

### Upgrade

```bash
npm i @neus/sdk@1.2.2
# or zero-install
npx -y -p @neus/sdk@1.2.2 neus doctor --live
```

## [1.2.1] - 2026-06-18

### Fixed

- **npm install** — clean installs include the CLI and agent-context modules required by `neus setup` and `neus mount`.
- **Browser / Next.js builds** — Node-only adapters are no longer pulled into the main `@neus/sdk` entry; import `@neus/sdk/runtime-adapters` only in CLI or server code.

### Changed

- **`@neus/sdk` and `@neus/mcp-server`** — `1.2.1`.

### Upgrade

```bash
npm i @neus/sdk@1.2.1
# or zero-install
npx -y -p @neus/sdk@1.2.1 neus doctor --live
```

## [1.2.0] - 2026-06-18

### Added

- **Connect agent context** — load a Trusted Agent’s identity, permissions, skills, and receipt links into a project.
- **`neus mount <agentId>`** — writes project context for Cursor, Claude Code, or Codex.
- **`neus setup --agent <agentId>`** — MCP setup plus optional project mount.
- **`neus_agent_mount`** — MCP tool to load the same agent context in-session.
- **SDK** — `@neus/sdk/runtime-mount` and `@neus/sdk/runtime-adapters`.

### Changed

- **`neus doctor --live`** — reports whether the project agent context and Trusted Agent link are ready.
- **Agent card** — **Connect in** copies the mount command for your editor.

### Upgrade

```bash
npx -y -p @neus/sdk@1.2.0 neus setup
npx -y -p @neus/sdk@1.2.0 neus mount <agentId> --apply cursor
npx -y -p @neus/sdk@1.2.0 neus doctor --live
```

## [1.1.7] - 2026-06-16

### Fixed

- **Gate checkout** — `getGate` and `fulfillGate` call the correct hosted API paths.
- **Revoke receipt** — `revokeOwnProof` no longer fails on response parsing.

### Changed

- **`@neus/sdk` and `@neus/mcp-server`** — `1.1.7`.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.7 neus setup
npx -y -p @neus/sdk@1.1.7 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [Hosted gate checkout](https://docs.neus.network/platform/hosted-gate-checkout)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.6] - 2026-06-12

### Fixed

- **`neus auth`** — browser sign-in no longer crashes on Node ESM.
- **OAuth docs** — authorize flow documents the hosted login redirect; access-key guidance is clearer.

### Changed

- **`@neus/sdk` and `@neus/mcp-server`** — `1.1.6`.
- **`neus setup --oauth`** — forces browser sign-in even when an access key is present.
- **`neus doctor`** — reports the installed package version.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.6 neus setup
npx -y -p @neus/sdk@1.1.6 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.5] - 2026-06-07

### Changed

- **Install docs** — one install path at [docs.neus.network/install](https://docs.neus.network/install).
- **First-touch copy** — README, install, MCP, plugin, and SDK lead with trust receipts and NEUS Verify.
- **`@neus/sdk` and `@neus/mcp-server`** — `1.1.5`.

### Removed

- Redundant host install files — use `npx -y -p @neus/sdk neus setup` instead.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.5 neus setup
npx -y -p @neus/sdk@1.1.5 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [MCP journeys](https://docs.neus.network/mcp/journeys)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.3] - 2026-06-05

### Highlights

- **Install NEUS** — docs start from hosted MCP setup for supported editors.
- **Claude Code plugin** — marketplace install loads the trust workflow skill correctly.
- **Install router** — [docs.neus.network/install](https://docs.neus.network/install) routes by environment.

### Added

- Install page with platform cards.
- Cline support in docs and setup hints.

### Changed

- Plugin and marketplace descriptions match the product tagline.
- Install links point to `https://docs.neus.network/install`.
- Clearer agent-identity and showcase docs.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.3 neus setup
npx -y -p @neus/sdk@1.1.3 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [MCP setup](https://docs.neus.network/mcp/setup)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.2] - 2026-06-04

### Added

- **`@neus/sdk/mcp-hosts`** — helpers for MCP install URLs, setup commands, and “Open in” editor links.

### Changed

- **`neus import --from auto`** — prefers Claude Code, Cursor, and Claude Desktop when multiple configs are found.
- Docs keep assistant MCP setup separate from server-side setup.

### Fixed

- Codex setup uses `--client codex` and Codex-owned sign-in.

## [1.1.1] - 2026-05-28

### Highlights

- **Signed-in MCP context** — `neus_context` returns the current profile when connected.
- **One install story** — OAuth-first setup across Cursor, Codex, VS Code, and Claude Code.

### Changed

- Clearer MCP tool descriptions and install discovery.
- `neus setup` writes the correct config path for each editor.
- Docs and plugin skill start with `neus_context`; `neus_me` is for refresh or public lookup only.
- **`@neus/sdk` and `@neus/mcp-server`** — `1.1.1`.

### Fixed

- npm discovery metadata matches the live hosted MCP server.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.1 neus setup
npx -y -p @neus/sdk@1.1.1 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [MCP setup](https://docs.neus.network/mcp/setup)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.0] - 2026-05-26

### Highlights

- **OAuth-first MCP onboarding** — `neus setup` → sign in → `neus doctor --live`.
- **`@neus/mcp-server` on npm** — discovery metadata for MCP registries and installers.
- **Public MCP tools** — including encrypted Vault secrets (`neus_secret_*`).
- **NEUS Trust plugin** — Claude Code marketplace install with the trust workflow skill.

### Added

- `@neus/mcp-server` npm package (discovery only; runtime stays at `https://mcp.neus.network/mcp`).
- MCP docs for encrypted secrets and OAuth.
- [Status / roadmap](https://docs.neus.network/platform/status).
- Hosted MCP OAuth discovery for editor sign-in.

### Changed

- **Default auth is OAuth.** Profile access keys remain for servers and CI only.
- Docs and setup on [neus.network](https://neus.network) lead with OAuth.
- MCP discovery points at the hosted server and current public tool list.

### Fixed

- Docs, setup flows, and live MCP metadata match.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.0 neus setup
npx -y -p @neus/sdk@1.1.0 neus doctor --live
```

If you already use a Profile access key for automation, keep `neus setup --access-key <npk_...>`. Interactive editors should prefer OAuth.

### Links

- [Install NEUS](https://docs.neus.network/install)
- [MCP setup](https://docs.neus.network/mcp/setup)
- [MCP OAuth](https://docs.neus.network/mcp/oauth)
- [Status / roadmap](https://docs.neus.network/platform/status)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.0.12] - 2026-05-26

### Added

- `@neus/sdk` with hosted MCP CLI (`neus setup`, `neus auth`, import/export) and OAuth browser flow.

[Unreleased]: https://github.com/neus/network/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/neus/network/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/neus/network/compare/v1.0.12...v1.1.0
[1.0.12]: https://github.com/neus/network/releases/tag/v1.0.12
