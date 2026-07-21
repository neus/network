<h1 align="center">NEUS Network — Portable Trust Infrastructure</h1>

<p align="center">
  <img src="./docs/images/neus-social-card.png" alt="NEUS Network social card" width="640" />
</p>

<p align="center">
  <strong>The trust layer for people and AI.</strong> Portable identity, ownership, and authorization that travels.
</p>

<p align="center">
  Prove once. Reuse everywhere — shared context, clear authority, and an audit trail for every action.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="@neus/sdk on npm" /></a>
  <a href="https://www.npmjs.com/package/@neus/mcp-server"><img src="https://img.shields.io/npm/v/%40neus%2Fmcp-server?logo=npm&label=%40neus%2Fmcp-server&color=98C0EF" alt="@neus/mcp-server on npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
  <a href="https://neus.network/proof/0x1487d0d9826ffc2c415b33745a058711f1c4d8928d64df5c7104752ed6d62cc0"><img src="https://img.shields.io/badge/NEUS-Verified%20Receipt-98C0EF?style=flat&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI%2BPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNy41IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjE2LjAwIiBjeT0iNS4wMCIgcj0iMS4zNSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjIxLjUwIiBjeT0iNi40NyIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjI1LjUzIiBjeT0iMTAuNTAiIHI9IjEuMzUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIyNy4wMCIgY3k9IjE2LjAwIiByPSIxLjM1IiBmaWxsPSIjZmZmIi8%2BPGNpcmNsZSBjeD0iMjUuNTMiIGN5PSIyMS41MCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjIxLjUwIiBjeT0iMjUuNTMiIHI9IjEuMzUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxNi4wMCIgY3k9IjI3LjAwIiByPSIxLjM1IiBmaWxsPSIjZmZmIi8%2BPGNpcmNsZSBjeD0iMTAuNTAiIGN5PSIyNS41MyIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjYuNDciIGN5PSIyMS41MCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjUuMDAiIGN5PSIxNi4wMCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjYuNDciIGN5PSIxMC41MCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjEwLjUwIiBjeT0iNi40NyIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjwvc3ZnPg%3D%3D" alt="NEUS verified trust receipt" /></a>
</p>

<p align="center">
  <a href="#why-neus"><strong>Why NEUS</strong></a>
  | <a href="#start-building"><strong>Start building</strong></a>
  | <a href="#live-surfaces"><strong>Live surfaces</strong></a>
  | <a href="#support"><strong>Support</strong></a>
</p>

---

## Why NEUS

Every new app, agent, and partner usually starts from zero — no shared context about identity, ownership, or authority. NEUS turns those checks into **portable trust receipts** so people and AI keep context as they move, act under clear limits, and leave an audit trail behind.

A receipt is something you already earned: who someone is, what they own, what they’re allowed to do. Put it on a profile, require it at a gate, or check it from your API — same receipt, every surface.

| Need | What you get with NEUS |
| ---- | ------------------------ |
| Stop re-proving the same facts in every product | One portable receipt apps and agents can reuse |
| Carry identity and ownership with the actor | Profiles and ownership proofs that travel across gates |
| Authorize actions with clear limits | Scoped permissions, current status, and enforce-before-act checks |
| Keep shared context for people and AI | Live trust context in the editor, product, and API |
| Audit who did what — and under which authority | Receipt pages, stable references, and reviewable history |
| Ship trust without rebuilding each flow | Hosted Verify, widgets, SDK, and MCP on one model |

## Start building

### One command for assistants

Connect once. Your assistant gets portable trust context — identity, authority, and receipts — so it can reuse what’s already proven, authorize actions against real limits, and keep an audit trail without leaving the editor.

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus check
```

Then ask your assistant:

> Use NEUS so my identity, permissions, and context travel with me. Reuse receipts when you can, verify when you must, authorize actions against those limits, and leave an audit trail.

| Path | Next step |
| ---- | --------- |
| AI assistants (Cursor, Claude Code, Codex, VS Code) | [Install NEUS](https://docs.neus.network/install) |
| MCP setup | [MCP setup](https://docs.neus.network/mcp/setup) · Hosted URL: `https://mcp.neus.network/mcp` |
| First app integration | [Quickstart](https://docs.neus.network/quickstart) |
| Prove once, reuse everywhere | [Integration guide](https://docs.neus.network/integration) |
| React gate | [VerifyGate](https://docs.neus.network/widgets/verifygate) |
| Server / API | [API overview](https://docs.neus.network/api/overview) |
| Agent trust | [Agents overview](https://docs.neus.network/agents/overview) |

Optional IDE plugin: install **`neus-trust@neus`** from this repo’s marketplace — see [Install NEUS](https://docs.neus.network/install).

### Add trust to an app

Drop in Hosted Verify, `VerifyGate`, or the SDK when your app needs portable trust — shared context at the gate, authority before access, receipts you can audit later.

- [Quickstart](https://docs.neus.network/quickstart) — register your app and ship the first receipt.
- Pattern: [prove once, reuse everywhere](https://docs.neus.network/integration).
- [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) for browser sign-in and checks.

### Add trust to an agent

Give agents identity and scoped authority as receipts — so tools run under real limits, and every action stays auditable.

- [Agents overview](https://docs.neus.network/agents/overview): identity, permissions, and reusable receipts.
- Register identity with [`agent-identity`](https://docs.neus.network/agents/agent-identity).
- Add permissions with [`agent-delegation`](https://docs.neus.network/agents/agent-delegation).

---

## Live surfaces

| Surface | Use it for |
| ------- | ---------- |
| [Product](https://neus.network) | Profiles, gates, and hosted product UX |
| [Hosted Verify](https://neus.network/verify) | Browser verification for people and orgs |
| [Trust receipts](https://docs.neus.network/platform/receipts-and-results) | Portable records of identity, authority, and outcomes |
| [SDK](https://docs.neus.network/sdks/javascript) · [@neus/sdk](https://www.npmjs.com/package/@neus/sdk) | Issue, poll, and check receipts from your app |
| [Widgets](https://docs.neus.network/widgets/overview) | `VerifyGate` and `ProofBadge` for React products |
| [API](https://docs.neus.network/api/overview) | Server reads, checks, verifier catalog, and verification endpoints |
| [Agents](https://docs.neus.network/agents/overview) | Agent identity, scoped authority, and audit-ready receipts |
| [MCP](https://docs.neus.network/mcp/overview) | Portable trust context in the editor — `neus setup`; registry metadata: [`@neus/mcp-server`](https://www.npmjs.com/package/@neus/mcp-server) |
| [Examples](./examples) | Runnable app and agent samples |
| [Verifier catalog](https://docs.neus.network/verification/verifiers) | Live check IDs and inputs |

## Capability snapshot

The live verifier catalog is documented at [docs.neus.network/verification/verifiers](https://docs.neus.network/verification/verifiers). JSON Schemas live in [`docs/verifiers/schemas/`](./docs/verifiers/schemas/); the machine index is [`spec/VERIFIERS.json`](./spec/VERIFIERS.json).

| Capability | Verifiers |
| ---------- | --------- |
| Ownership and identity | `ownership-basic`, `ownership-social`, `ownership-dns-txt`, `ownership-org-oauth`, `ownership-pseudonym` |
| Human and wallet trust | `proof-of-human`, `wallet-risk`, `wallet-link` |
| Assets and contracts | `token-holding`, `nft-ownership`, `contract-ownership` |
| Content and safety | `ai-content-moderation` |
| Agent trust | `agent-identity`, `agent-delegation` |

## This repository

Public docs, SDK (`@neus/sdk`), MCP registry package (`@neus/mcp-server`), widgets, examples, specs, and the **`neus-trust`** Claude Code / Cursor plugin ([install](https://docs.neus.network/install)).

## Open standard

Wallet-signed request envelopes follow the [CAIP-380 (Portable Proof)](https://github.com/ChainAgnostic/CAIPs/pull/380) ChainAgnostic draft. Their hash, DID binding, and signature can be checked without NEUS; verifier outcomes remain part of the NEUS trust receipt. See the [offline fixture](./examples/caip-380/minimal-evm.json) and [NEUS docs](https://docs.neus.network/learn/standards/caip-380).

## Support

| Channel | Use for |
| ------- | ------- |
| [Docs](https://docs.neus.network) | Product and integration guidance |
| [Changelog](./CHANGELOG.md) | Release notes and upgrade paths |
| [Platform status](https://docs.neus.network/platform/status) | Maturity, beta scope, and upgrade expectations |
| [Discussions](https://github.com/neus/network/discussions) | Questions and implementation patterns |
| [Issues](https://github.com/neus/network/issues) | Bugs and requests |
| [SECURITY.md](./SECURITY.md) · [dev@neus.network](mailto:dev@neus.network) | Vulnerability disclosure |

## License

- **SDK and tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 to Apache-2.0 in August 2028
