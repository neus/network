# Changelog

Release notes for **`@neus/sdk`**, **`@neus/mcp-server`**, docs, and examples.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.1] - 2026-07-08

### Changed

- **Runtime mount moved into the SDK** — the `runtime-mount` module now lives in `@neus/sdk` (`@neus/sdk/runtime-mount`). The protocol hosted MCP server imports `buildRuntimeMountFromRoster` from the SDK instead of a bundled copy. The old `protocol/src/mcp/runtime-mount-bundle.js` was deleted; the Dockerfile and unit test were updated to use the SDK export.
- **MCP server card aligned to 1.3.1** — `protocol/mcp/server.json` and `protocol/public/.well-known/mcp/server-card.json` now report `1.3.1`, matching the published `@neus/mcp-server@1.3.1` npm card. The hosted runtime and the npm distribution card are lockstep again.

### Fixed

- **Docker build** — removed stale `COPY src/mcp/runtime-mount-bundle.js` from `protocol/mcp/Dockerfile` (the file was deleted; the import now resolves from the `@neus/sdk` package dependency).
- **Unit test** — `protocol/tests/unit/mcp-agent-mount.test.js` now imports from `@neus/sdk/runtime-mount` and uses the canonical `buildRuntimeBundle` export name.

## [1.3.0] - 2026-07-08

### Added

- **`llms.txt` at repo root** — machine-readable summary for ChatGPT, Claude, and Perplexity citation. Covers product summary, quick start, core surfaces, reading order, pricing, verifier catalog, and the CAIP-380 standard.
- **`pricing.txt` at repo root** — machine-readable pricing for AI agents evaluating NEUS. Free / Pro / Enterprise tiers, x402 pay-per-call, and approximate credit costs.
- **`docs/public/robots.txt`** — allows AI search and citation crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) so NEUS docs can be cited by AI search engines.
- **`.github/PULL_REQUEST_TEMPLATE.md`** — contributor template for builder-visible change, verifier/API alignment, and changelog entry.

### Changed

- **Streamlined public SDK surface** — the public API now exposes only the documented integrator paths. Internal modules remain in the package for CLI use but are no longer importable as public subpaths.
- **Docs home strengthened** — keyword-rich title and a primary hero CTA on the docs landing page.
- **Codex marketplace versioning** — the Codex plugin marketplace manifest now carries owner and version metadata, covered by the release version checker alongside Cursor and Claude.

### Fixed

- **SDK type definitions** — TypeScript declarations now match the actual runtime implementations for the mount and adapter modules.
- **`ai-content-moderation` contentType list** — aligned with the OpenAPI enum; removed unsupported values.
- **OpenAPI scope notes** — gate endpoints and x402 settlement are now annotated as intentionally outside the OpenAPI reference.
- **Runtime mount import path** — the SDK sample in the docs now imports from the correct module.
- **Receipt ID jargon** — the showcase example now uses "receipt ID" instead of the internal field name.

## [1.2.5] - 2026-07-03

### Added

- **Universal marketplace plugin** — the NEUS Trust plugin now ships platform-specific manifests for all four target IDEs from one repo: Cursor (`.cursor-plugin/`), Claude Code (`.claude-plugin/` + spec-compliant `.mcp.json`), and Codex (`.codex-plugin/` + `.agents/plugins/marketplace.json`). Each host consumes its native manifest shape and MCP config format, so one repo serves every marketplace without forking. Added `scripts/validate-universal-manifests.mjs` to enforce the Claude + Codex manifests and the spec-compliant `.mcp.json` (`type: "http"`) in CI. Release version-check and release-flow surfaces now bump the Claude + Codex manifests alongside Cursor's.

### Changed

- **Optimized plugin logo** — `plugins/neus-trust/.cursor-plugin/plugin.json` `logo` now points at a committed SVG (`./assets/icon.svg`, the canonical NEUS particle-ring mark) for crisp rendering at every marketplace resolution. PNG fallback retained at `assets/icon.png` for hosts that don't render SVG. Codex `interface.composerIcon`/`interface.logo` use the same SVG.

- **Cursor Marketplace template alignment** — renamed `.claude-plugin/` → `.cursor-plugin/` (marketplace + plugin manifests) and `plugins/neus-trust/.mcp.json` → `mcp.json` to match the official `cursor/plugin-template` structure. `plugin.json` now uses `logo` (not `icon`); the skill auto-discovers from `skills/` per template convention. Vendored `scripts/validate-template.mjs` so CI can validate the marketplace structure. CI path triggers and release version-check paths updated to the new `.cursor-plugin/` locations. Zero disruption to the OAuth flow or skill content.
- **Cursor-native MCP config** — `plugins/neus-trust/mcp.json` now uses Cursor's expected `mcpServers.<name>.url` shape (no `type: 'http'`, no `authorization` block). The SDK's `neus setup` now writes the same Cursor-native shape into `~/.cursor/mcp.json`, while VS Code, Claude Code, and Codex keep their respective spec-compliant formats. Added `scripts/validate-cursor-mcp.mjs` and wired both validators into CI so marketplace schema drift is caught before submission.
- **Official Cursor schema conformance** — `.cursor-plugin/marketplace.json` and `plugins/neus-trust/.cursor-plugin/plugin.json` now strictly conform to Cursor's published JSON Schemas (`additionalProperties: false`). Removed non-schema fields from the marketplace plugin entry (`homepage`, `repository`, `license`, `version`, `author`, `category`, `keywords`, `tags` — these belong only in `plugin.json`); moved marketplace `version`/`description` under `metadata`. Removed `author.url` from `plugin.json` (schema allows only `name` + `email`). Vendored the official schemas under `schemas/` and added `scripts/validate-cursor-schemas.mjs` so CI enforces the same constraints Cursor's marketplace ingestion applies. Updated `release.yml` version check to read `marketplace.json` `metadata.version`.
- **Brand asset SSOT alignment** — plugin `icon.svg` and `icon.png` now match the canonical NEUS mark served from `neus.network/images/neus-brand-pack/` (previously diverged variants). Docs `favicon.svg` synced with the canonical brand-pack favicon. SDK `brand-mark.js` `NEUS_BRAND_PACK_VERSION` bumped from `2026-06-07-app-icon-raster-v1` to `2026-06-24-hq-vector-glass-v12` so VerifyGate and ProofBadge widgets cache-bust against the current live CDN deploy. Widget dist bundles rebuilt with the corrected version. Added `<title>NEUS</title>` to the plugin SVG for accessibility.

### Upgrade

```bash
npm i @neus/sdk@1.2.5
# or zero-install
npx -y -p @neus/sdk@1.2.5 neus doctor --live
```

## [1.2.4] - 2026-06-23

### Fixed

- **Marketplace + skill version alignment** — plugin `marketplace.json`, `plugins/neus-trust/.claude-plugin/plugin.json`, `@neus/mcp-server` `server.json`, `@neus/sdk` lockfile, examples, and the `neus-trust-workflow` skill frontmatter now all report `1.2.4`.

### Upgrade

```bash
npm i @neus/sdk@1.2.4
# or zero-install
npx -y -p @neus/sdk@1.2.4 neus doctor --live
```

## [1.2.3] - 2026-06-21

### Added

- **VS Code host** — `MCP_INSTALL_HOSTS`, `IDE_HOST_LABELS`, and `IDE_HOST_BRAND_LOGOS` now include `vscode`, so the install UI and `neus setup` surface VS Code alongside Cursor, Claude Code, and Codex.
- **OAuth resource metadata** — the NEUS Trust plugin `.mcp.json` now declares `resourceMetadataUrl` (`https://mcp.neus.network/.well-known/oauth-protected-resource`) per RFC 9728, so IDE-native OAuth (Cursor, Claude Code, Codex, VS Code) auto-discovers auth metadata without a manual Bearer header.

### Fixed

- **`neus doctor --live` with browser OAuth** — when only a browser-issued OAuth token is present (`~/.neus/mcp-tokens.json`), the CLI now uses it as the live credential and silently rotates it via `refreshToken` when expired. URL-only IDE configs (no static access key) are now reported as "IDE-native OAuth configured" instead of "No account credential found."
- **401-as-reachable** — `runLiveMcpDiagnostics` now treats a 401 from the MCP server as proof the server is reachable and OAuth is configured, rather than marking it unreachable. The full authenticated tool list still runs when a valid credential is available.

### Changed

- **Version alignment** — `@neus/mcp-server`, `server.json`, plugin, marketplace, and `server-card.json` aligned to `1.2.3` (lockstep with `@neus/sdk`).

### Upgrade

```bash
npm i @neus/sdk@1.2.3
# or zero-install
npx -y -p @neus/sdk@1.2.3 neus doctor --live
```

## [1.2.2] - 2026-06-21

### Fixed

- **MCP OAuth docs alignment** — purged stale "60 min / silently dies / cannot refresh" comments and docs that contradicted the actual URL-only OAuth config path. `buildNeusMcpHttpConfig` already returns URL-only config for JWT-shaped tokens; the IDE runs DCR + PKCE + silent refresh for up to 30 days via `offline_access`, matching Linear, GitHub, and Notion. The access token is a short-lived JWT refreshed silently by the host; the session is long-lived, not the access token.
- **Dead regression guard removed** — the Cursor MCP sync helper no longer warns about a JWT in `~/.cursor/mcp.json`; the SDK no longer writes that state, so the warning was stale.

### Changed

- **Version alignment** — `@neus/mcp-server`, `server.json`, and `server-card.json` aligned to `1.2.2` (lockstep with `@neus/sdk`).

### Upgrade

```bash
npm i @neus/sdk@1.2.2
# or zero-install
npx -y -p @neus/sdk@1.2.2 neus doctor --live
```

## [1.2.1] - 2026-06-18

### Fixed

- **npm pack contents** — ship `cli-commands.js`, `runtime-mount.js`, and `runtime-adapters.js` (fixes `Can't resolve './runtime-adapters.js'` and missing `NEUS_SETUP_CLI` / `NEUS_AUTH_CLI` from `mcp-hosts.js` on clean `npm install`).
- **Browser / Next.js builds** — stop re-exporting Node-only `runtime-adapters` from the main `@neus/sdk` entry; use `@neus/sdk/runtime-adapters` in CLI and server contexts only.

### Changed

- **Version alignment** — `@neus/mcp-server`, plugin, marketplace, and `server.json` aligned to `1.2.1` (lockstep with `@neus/sdk`).

### Upgrade

```bash
npm i @neus/sdk@1.2.1
# or zero-install
npx -y -p @neus/sdk@1.2.1 neus doctor --live
```

## [1.2.0] - 2026-06-18

### Added

- **Runtime Mount (`neus.runtime-mount.v1`)** — one proof-backed bundle for identity, delegation, policy, skills, and trust receipt refs. Use from any IDE, worker, or backend.
- **`neus mount <agentId>`** — resolve mount via MCP (`neus_agent_mount` when hosted) or client assembly; writes `.neus/mount.json`.
- **`--apply cursor|claude|codex`** — project adapters write host rule files + mount manifest.
- **`neus setup --agent <agentId>`** — MCP setup plus optional project mount.
- **`neus_agent_mount`** — public MCP tool #13 (authenticated).
- **SDK exports** — `@neus/sdk/runtime-mount`, `@neus/sdk/runtime-adapters`.

### Changed

- **`neus doctor --live`** — reports project mount file, agent link readiness, and `agentVerified`.
- **Profile agent UI** — **Mount in IDE** downloads mount artifacts and copies the mount CLI command.

### Upgrade

```bash
npx -y -p @neus/sdk@1.2.0 neus setup
npx -y -p @neus/sdk@1.2.0 neus auth
npx -y -p @neus/sdk@1.2.0 neus mount <agentId> --apply cursor
npx -y -p @neus/sdk@1.2.0 neus doctor --live
```

## [1.1.7] - 2026-06-16

### Fixed

- **`NeusClient.getGate` / `fulfillGate`** — use `GET` / `POST` on `/api/v1/profile/gates/{gateId}` (and `/fulfill`) on `api.neus.network`. Earlier `1.1.6` builds called `/api/v1/gates/*`, which does not exist on the hosted API.
- **`NeusClient.revokeOwnProof`** — use the parsed `_makeRequest` response directly (fixes a double JSON parse runtime failure).

### Changed

- **Version alignment** — `@neus/sdk`, `@neus/mcp-server`, plugin, and `server.json` aligned to `1.1.7`.
- **SDK tests** — contract tests lock gate snapshot/fulfill URL paths and revoke-self response handling.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.7 neus setup
npx -y -p @neus/sdk@1.1.7 neus auth
npx -y -p @neus/sdk@1.1.7 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [Hosted gate checkout](https://docs.neus.network/platform/hosted-gate-checkout)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

## [1.1.6] - 2026-06-12

### Fixed

- **CLI OAuth browser open** — `neus auth` no longer crashes with `require is not defined` in ESM (`.mjs`); uses `import { exec } from 'node:child_process'`.
- **MCP docs** — OAuth authorize flow documents hosted-login redirect (not in-page render); removed false Cline one-command claim; added `#access-keys` section.

### Changed

- **Version alignment** — `@neus/sdk`, `@neus/mcp-server`, plugin, and `server.json` aligned to `1.1.6`.
- **CLI diagnostics** — `neus doctor` initialize reports package version from `sdk/package.json`.
- **`--oauth` flag** — `neus setup` and `neus auth` ignore `NEUS_ACCESS_KEY` when `--oauth` is passed; `neus setup --json` reports `authRequired` and `nextCommand` when browser sign-in is needed.

### Upgrade

```bash
npx -y -p @neus/sdk@1.1.6 neus setup
npx -y -p @neus/sdk@1.1.6 neus auth
npx -y -p @neus/sdk@1.1.6 neus doctor --live
```

### Links

- [Install NEUS](https://docs.neus.network/install)
- [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)
- [npm: @neus/mcp-server](https://www.npmjs.com/package/@neus/mcp-server)

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
- MCP discovery at `/.well-known/mcp.json` points to the hosted server with the current public tool listing (13 tools as of 1.2.0).
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
