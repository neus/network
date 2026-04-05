# AGENTS.md

## Cursor Cloud specific instructions

This is a JavaScript SDK + docs monorepo. There is no database, Docker, or local backend; the SDK is a client for the remote NEUS API (`https://api.neus.network`).

### Repository layout

| Directory | Purpose |
|-----------|---------|
| `sdk/` | Main `@neus/sdk` package (JS, ESM). All lint/test/build commands run here. |
| `docs/` | Mintlify-powered documentation site + OpenAPI spec |
| `contracts/` | Reference Solidity contracts (no Hardhat/Foundry tooling) |
| `examples/` | Node.js, React, curl usage examples |
| `spec/` | Verifier JSON schemas |

### Key commands

- **SDK dependencies:** `cd sdk && npm install` (uses `package-lock.json`)
- **SDK lint:** `cd sdk && npm run lint` (ESLint 8; the repo has pre-existing warnings/errors in committed code — this is expected)
- **SDK test:** `cd sdk && npm test` (Vitest — 73 unit tests, all mocked, no network needed)
- **SDK build:** `cd sdk && npm run build` (esbuild: widgets + CJS bundles)
- **Docs validation:** `npm run docs:validate` (from repo root; runs markdownlint + Redocly OpenAPI lint)
- **Docs dev server:** `npm run docs:dev` (from repo root; starts Mintlify dev server — optional)

### Notes

- The root `package.json` only has docs scripts; the SDK has its own `package.json` in `sdk/`.
- ESLint reports warnings and errors on committed code. This is the repo's baseline state — do not try to fix pre-existing lint issues unless specifically asked.
- Live integration tests are opt-in via `NEUS_SDK_LIVE_TESTS=1`. Unit tests mock `fetch` and run fully offline.
- `constructVerificationMessage()` requires a `chainId` parameter (not just `walletAddress` and `verifierIds`).
- Node.js >= 20 is required (CI uses 20.19.0).
