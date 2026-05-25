<p align="center">
 <a href="https://neus.network">
 <img
   src="https://neus.network/images/neus-brand-pack/og-default-1200x630-neus.png"
   width="600"
   height="315"
   alt="NEUS"
 />
 </a>
</p>

<p align="center">
 <strong>Trust infrastructure for apps, agents, and ecosystems.</strong><br />
 Trust that travels. Add reusable trust receipts before access, payment, or agent action.
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

NEUS turns identity, ownership, authority, risk, content, and actions into reusable trust receipts. Your app or agent can check a receipt before allowing access, payment, tool use, delegation, or audit-sensitive work.

Use the hosted product when you want NEUS to own the browser ceremony. Use the SDK, widgets, API, or MCP when you want the receipt inside your product, backend, or agent workflow.

## Why NEUS

Trust keeps getting rebuilt inside each app, marketplace, workflow, and agent stack. NEUS gives teams one trust layer for the moments that matter:

| Need                         | NEUS gives you                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| Stop re-building trust from zero  | A receipt your product can save, check, and reuse                       |
| Gate access or rewards       | Hosted flows, widgets, and server checks for trusted access             |
| Trust agents before they act | Agent identity, scoped delegation, and receipts for trusted actions     |
| Audit what happened          | Proof pages, receipt reads, tags, and durable references                |
| Ship without owning ceremony | Hosted Verify, SDK helpers, API checks, and MCP on the same trust model |

## Start building

### 1. Add trust to an app

Use Hosted Verify, `VerifyGate`, or the SDK when your app needs a reusable trust receipt.

- Start with [Quickstart](https://docs.neus.network/quickstart).
- Follow the integration loop: [check -> verify -> save -> reuse](https://docs.neus.network/integration).
- Use [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) when you want NEUS to own the browser step.

### 2. Add trust to an agent

Use NEUS when an agent needs identity, scoped authority, and receipts for trusted actions.

- Start with [Agents](https://docs.neus.network/agents/overview).
- Register identity with [`agent-identity`](https://docs.neus.network/agents/agent-identity).
- Add scoped authority with [`agent-delegation`](https://docs.neus.network/agents/agent-delegation).

### 3. Connect assistants and tools

Wire Cursor, VS Code, Claude Code, and other MCP hosts to the same hosted NEUS endpoint.

```bash
npx -y -p @neus/sdk neus setup
```

Optional: add your NEUS Profile access key in one step (enables account-aware tools such as `neus_me`):

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Confirm the install, then start each session with tool **`neus_context`**:

```bash
npx -y -p @neus/sdk neus doctor
```

Bring an existing agent setup:

```bash
npx -y -p @neus/sdk neus import --dry-run
npx -y -p @neus/sdk neus import --from openclaw
npx -y -p @neus/sdk neus export --to manifest
```

| Topic                                       | Link                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Full setup, manual JSON, and headers        | [MCP setup](https://docs.neus.network/mcp/setup)                              |
| Tools and recommended order                 | [MCP overview](https://docs.neus.network/mcp/overview)                        |
| Discovery URLs (server card, `.well-known`) | [Discovery and endpoints](https://docs.neus.network/mcp/endpoints)            |
| Claude Code skill bundle                    | [NEUS for Claude Code](https://docs.neus.network/mcp/claude-code-marketplace) |

Hosted MCP URL: **`https://mcp.neus.network/mcp`**

---

## Live surfaces

| Surface        | Use it for                                                           |
| -------------- | -------------------------------------------------------------------- |
| Hosted Verify  | Browser verification at `neus.network/verify`                        |
| Trust receipts | Reusable receipt IDs, proof pages, profile surfaces, and eligibility |
| SDK            | Verification, polling, hosted URLs, and server-side gate checks      |
| Widgets        | `VerifyGate` and `ProofBadge` for React products                     |
| API            | Server reads, checks, verifier catalog, and verification endpoints   |
| Agents         | Agent identity, delegation, stable URLs, and action receipts         |
| MCP            | Live trust context for assistants, tools, and agent workflows        |

## Start here

| Path                  | Best next step                                               |
| --------------------- | ------------------------------------------------------------ |
| First app integration | [Quickstart](https://docs.neus.network/quickstart)           |
| Build a flow       | [Integration](https://docs.neus.network/integration)         |
| React gate            | [VerifyGate](https://docs.neus.network/widgets/verifygate)   |
| Server/API            | [API overview](https://docs.neus.network/api/overview)       |
| Agent trust           | [Agents overview](https://docs.neus.network/agents/overview) |
| Assistants/MCP        | [MCP setup](https://docs.neus.network/mcp/setup)             |

## Capability snapshot

The live verifier catalog is documented at [docs.neus.network/verification/verifiers](https://docs.neus.network/verification/verifiers). Verifier lists and schemas are also available in [`spec/`](./spec/VERIFIERS.json).

| Capability             | Verifiers                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Ownership and identity | `ownership-basic`, `ownership-social`, `ownership-dns-txt`, `ownership-org-oauth`, `ownership-pseudonym` |
| Human and wallet trust | `proof-of-human`, `wallet-risk`, `wallet-link`                                                           |
| Assets and contracts   | `token-holding`, `nft-ownership`, `contract-ownership`                                                   |
| Content and safety     | `ai-content-moderation`                                                                                  |
| Agent trust            | `agent-identity`, `agent-delegation`                                                                     |

## This repository

Docs, SDK (`@neus/sdk`), widgets, examples, specs, and Claude Code skill metadata.

## Where to go next

- [docs.neus.network](https://docs.neus.network) is the starting point for setup and product docs.
- [Integration](https://docs.neus.network/integration) walks through the flow: check, verify, save, reuse.

## Proof of reality

| Surface          | Link                                                              |
| ---------------- | ----------------------------------------------------------------- |
| Product          | [neus.network](https://neus.network)                              |
| Hosted Verify    | [neus.network/verify](https://neus.network/verify)                |
| Docs             | [docs.neus.network](https://docs.neus.network)                    |
| SDK              | [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk)         |
| Examples         | [`examples/`](./examples)                                         |
| Verifier catalog | [Verifier docs](https://docs.neus.network/verification/verifiers) |

## Support

| Channel                                                    | Use for                               |
| ---------------------------------------------------------- | ------------------------------------- |
| [Docs](https://docs.neus.network)                          | Product and integration guidance      |
| [Discussions](https://github.com/neus/network/discussions) | Questions and implementation patterns |
| [Issues](https://github.com/neus/network/issues)           | Bugs and requests                     |
| [dev@neus.network](mailto:dev@neus.network)                | Security                              |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidance.

## License

- **SDK and tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 to Apache-2.0 in August 2028
