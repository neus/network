<p align="center">
  <strong>Trust infrastructure for apps, agents, and ecosystems.</strong><br />
  Trust that travels. Verify trust before access, payment, or action.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
</p>

<p align="center">
  <a href="#why-neus"><strong>Why NEUS</strong></a>
  | <a href="#start-building"><strong>Start building</strong></a>
  | <a href="#live-surfaces"><strong>Live surfaces</strong></a>
</p>

---

## What NEUS is

NEUS makes trust portable across the internet so people, apps, and AI agents can prove what is real before access, payout, or execution.

**NEUS Portal** manages accounts, trust receipts, agents, and Vault. **NEUS Verify** runs trust checks and missing-requirement guidance. **NEUS MCP** connects assistants. **NEUS CLI / SDK** installs and embeds trust in your product.

Use Hosted Verify when NEUS should own the browser step. Use the SDK, widgets, API, or MCP when trust should live inside your app, backend, or agent workflow.

## Why NEUS

Trust keeps getting rebuilt inside each app, marketplace, workflow, and agent stack. NEUS is **trust infrastructure for apps, agents, and ecosystems**: reusable receipts instead of starting from zero.

| Need                         | NEUS gives you                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| Stop rebuilding trust        | A receipt your product can save, check, and reuse                       |
| Assistant setup              | One CLI setup for Claude Code, Codex, Cursor, and VS Code               |
| Gate access or rewards       | Hosted flows, widgets, and server checks for trusted access             |
| Trust agents before they act | Agent identity, scoped delegation, and receipts for trusted actions     |
| Audit what happened          | Receipt pages, receipt reads, tags, and durable references              |
| Ship without owning ceremony | Hosted Verify, SDK helpers, API checks, and MCP on the same trust model |

## Start building

### One command

Detects where you are working and wires hosted NEUS MCP for Claude Code, Codex, Cursor, or VS Code. OAuth sign-in runs automatically when no access key is set.

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus check
```

Ask your assistant: **"Use NEUS Verify before taking sensitive actions."**

| Path | Doc |
| ---- | --- |
| AI assistants | [Install NEUS](https://docs.neus.network/install) |
| MCP setup | [MCP setup](https://docs.neus.network/mcp/setup) |
| App verification | [Quickstart](https://docs.neus.network/quickstart) |

### Add trust to an app

Use Hosted Verify, `VerifyGate`, or the SDK when your app needs a reusable trust receipt.

- [Quickstart](https://docs.neus.network/quickstart) - register your app and run the workflow.
- Follow the workflow: [check -> verify -> save -> reuse](https://docs.neus.network/integration).
- Use [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) when you want NEUS to own the browser step.

### Add trust to an agent

- [Agents](https://docs.neus.network/agents/overview) - identity, scoped authority, and receipts for agents that act.
- Register identity with [`agent-identity`](https://docs.neus.network/agents/agent-identity).
- Add scoped authority with [`agent-delegation`](https://docs.neus.network/agents/agent-delegation).

Hosted MCP URL: **`https://mcp.neus.network/mcp`**

---

## Live surfaces

| Surface        | Use it for                                                          |
| -------------- | ------------------------------------------------------------------- |
| Hosted Verify  | Browser verification at `neus.network/verify`                       |
| Trust receipts | Reusable verification records, receipt pages, and eligibility checks |
| SDK            | Verification, polling, hosted URLs, and server-side gate checks     |
| Widgets        | `VerifyGate` and `ProofBadge` for React products                    |
| API            | Server reads, checks, verifier catalog, and verification endpoints  |
| Agents         | Agent identity, delegation, stable URLs, and action receipts        |
| MCP            | Live trust context for assistants, tools, and agent workflows       |

## Choose your path

| Path                  | Best next step                                               |
| --------------------- | ------------------------------------------------------------ |
| First app integration | [Quickstart](https://docs.neus.network/quickstart)           |
| Build a flow          | [Integration](https://docs.neus.network/integration)         |
| React gate            | [VerifyGate](https://docs.neus.network/widgets/verifygate)   |
| Server/API            | [API overview](https://docs.neus.network/api/overview)       |
| Agent trust           | [Agents overview](https://docs.neus.network/agents/overview) |
| Assistants/MCP        | [MCP setup](https://docs.neus.network/mcp/setup)             |

## Capability snapshot

The live verifier catalog is documented at [docs.neus.network/verification/verifiers](https://docs.neus.network/verification/verifiers). JSON Schemas live in [`docs/verifiers/schemas/`](./docs/verifiers/schemas/); the machine index is [`spec/VERIFIERS.json`](./spec/VERIFIERS.json).

| Capability             | Verifiers                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Ownership and identity | `ownership-basic`, `ownership-social`, `ownership-dns-txt`, `ownership-org-oauth`, `ownership-pseudonym` |
| Human and wallet trust | `proof-of-human`, `wallet-risk`, `wallet-link`                                                           |
| Assets and contracts   | `token-holding`, `nft-ownership`, `contract-ownership`                                                   |
| Content and safety     | `ai-content-moderation`                                                                                  |
| Agent trust            | `agent-identity`, `agent-delegation`                                                                     |

## This repository

Docs, SDK (`@neus/sdk`), widgets, examples, specs, and the NEUS Claude Code plugin.

## Where to go next

- [docs.neus.network](https://docs.neus.network) is the starting point for setup and product docs.
- [Integration](https://docs.neus.network/integration) walks through the flow: check, verify, save, reuse.

## Brand assets (docs + SDK)

Docs OG images and favicon live under `docs/images/`. SDK/widgets use `sdk/brand-mark.js` on `neus.network`. Plugin icon: `plugins/neus-trust/assets/icon.png`.

## Proof of reality

| Surface          | Link                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| Product          | [neus.network](https://neus.network)                                    |
| Hosted Verify    | [neus.network/verify](https://neus.network/verify)                      |
| Docs             | [docs.neus.network](https://docs.neus.network)                          |
| SDK              | [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)               |
| MCP              | [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk) (`neus setup`) |
| Examples         | [`examples/`](./examples)                                               |
| Verifier catalog | [Verifier docs](https://docs.neus.network/verification/verifiers)       |

## Support

| Channel                                                      | Use for                                     |
| ------------------------------------------------------------ | ------------------------------------------- |
| [Docs](https://docs.neus.network)                            | Product and integration guidance            |
| [Changelog](./CHANGELOG.md)                                  | Release notes and upgrade paths             |
| [Platform status](https://docs.neus.network/platform/status) | Maturity, beta scope, upgrade expectations  |
| [Discussions](https://github.com/neus/network/discussions)   | Questions and implementation patterns       |
| [Issues](https://github.com/neus/network/issues)             | Bugs and requests                           |
| [dev@neus.network](mailto:dev@neus.network)                  | Security                                    |

## License

- **SDK and tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 to Apache-2.0 in August 2028
