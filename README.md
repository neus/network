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
 NEUS makes trust portable across the internet so people, apps, and AI agents can prove what is real before access, payout, or execution.
</p>

<p align="center">
 <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="npm" /></a>
 <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
 <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
</p>

<p align="center">
 <a href="#why-neus"><strong>Why NEUS</strong></a>
 | <a href="#build-with-neus"><strong>Build with NEUS</strong></a>
 | <a href="#agents-and-mcp"><strong>Agents and MCP</strong></a>
 | <a href="#connect-assistants-mcp"><strong>Assistants (MCP)</strong></a>
</p>

---

## What NEUS is today

NEUS turns verification into reusable trust receipts. Apps can issue a receipt once, check it before a gate or action, and reuse it later instead of asking trusted users or agents to start from zero.

- **Hosted Verify** drop in a live browser flow at [neus.network/verify](https://neus.network/verify).
- **Trust receipts** give apps a reusable result for gates, proof pages, profiles, and audits.
- **SDK, widgets, and API** let builders add verification and eligibility checks without owning every verifier flow.
- **Agent identity and delegation** give automated workflows attributable identity, scoped authority, and audit-ready receipts.
- **MCP** gives assistants and tools access to live trust context, proof reads, verifier metadata, and guided verification.

## Why NEUS

Trust keeps getting rebuilt inside each app, marketplace, workflow, and agent stack. That creates repeated onboarding, brittle access checks, manual reviews, and weak audit trails.

NEUS gives teams one trust layer for the moments that matter:

| Business outcome | What NEUS provides |
| --- | --- |
| Stop re-verifying from zero | Reuse trust receipts before prompting another verification |
| Gate access and rewards | Check receipts before content, communities, drops, bounties, tiers, or payouts |
| Trust agents before they act | Bind identity, controller, scope, and delegation to agent activity |
| Keep decisions auditable | Use receipts as durable evidence for who or what passed a trust decision |
| Ship faster | Use hosted flows, SDK helpers, widgets, API checks, and MCP instead of rebuilding the full trust stack |

## Three ways to use it

### Product and hosted flows

Use Hosted Verify when you want NEUS to own the browser verification flow and return users to your product. Your app stores the resulting receipt and checks it before allowing trusted actions.

- Start with [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify).
- Explore the live product at [neus.network/verify](https://neus.network/verify).
- See proof and profile surfaces at [neus.network](https://neus.network).

### Build with NEUS

Use the JavaScript SDK, React widgets, and HTTP API when you want trust checks inside your product, backend, or workflow.

- Follow the main build flow: [check -> verify -> save -> reuse](https://docs.neus.network/integration).
- Install the SDK: [@neus/sdk](https://www.npmjs.com/package/@neus/sdk) and [SDK docs](https://docs.neus.network/sdks/overview).
- Use server-side checks and reads through the [API overview](https://docs.neus.network/api/overview).
- Gate React experiences with [VerifyGate](https://docs.neus.network/widgets/verifygate).

### Agents and MCP

Use NEUS for agents that need identity, scoped authority, and receipts for trusted actions. MCP gives assistants and tools the same live trust context that apps use.

- Start with [Agents](https://docs.neus.network/agents/overview).
- Add identity and delegation with [`agent-identity`](https://docs.neus.network/agents/agent-identity) and [`agent-delegation`](https://docs.neus.network/agents/agent-delegation).
- Connect tools through [NEUS MCP](https://docs.neus.network/mcp/overview).
- Install the Claude Code marketplace package with [NEUS for Claude Code](https://docs.neus.network/mcp/claude-code-marketplace).

## Connect assistants (MCP)

Wire Cursor, VS Code, Claude Code, and other MCP hosts to the **same** hosted endpoint. One CLI, no extra plugins required for editors.

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

| Topic | Link |
| --- | --- |
| Full setup, manual JSON, and headers | [MCP setup](https://docs.neus.network/mcp/setup) |
| Tools and recommended order | [MCP overview](https://docs.neus.network/mcp/overview) |
| Discovery URLs (server card, `.well-known`) | [Discovery and endpoints](https://docs.neus.network/mcp/endpoints) |
| Claude Code plugin (optional skill bundle) | [NEUS for Claude Code](https://docs.neus.network/mcp/claude-code-marketplace) |

Hosted MCP URL: **`https://mcp.neus.network/mcp`**

---

## What is live now

| Surface | Live capability |
| --- | --- |
| Hosted Verify | Browser verification flow for supported verifiers |
| Trust receipts | Reusable receipt identifiers, proof pages, profile surfaces, and eligibility checks |
| SDK | `verify`, polling, hosted checkout URLs, and gate checks |
| API | Proof checks, proof reads, verifier catalog, and advanced verification endpoints |
| Widgets | `VerifyGate` and `ProofBadge` for React products |
| Agents | Agent identity, delegation, stable agent URLs, and cookbook flows |
| MCP | Hosted MCP endpoint for context, catalog, proof checks, proof reads, agent linking, and guided verification |

## Start here

| Path | Best next step |
| --- | --- |
| Understand the product | [Why NEUS](#why-neus) and [docs overview](https://docs.neus.network) |
| Build a trust flow | [Integration](https://docs.neus.network/integration) |
| Add the SDK | [SDK overview](https://docs.neus.network/sdks/overview) |
| Gate UI or access | [VerifyGate](https://docs.neus.network/widgets/verifygate) |
| Use the API | [API overview](https://docs.neus.network/api/overview) |
| Add agent trust | [Agents overview](https://docs.neus.network/agents/overview) |
| Connect assistants (fastest) | [`npx -y -p @neus/sdk neus setup`](#connect-assistants-mcp) then [MCP setup](https://docs.neus.network/mcp/setup) |

## Capability snapshot

The live verifier catalog is documented at [docs.neus.network/verification/verifiers](https://docs.neus.network/verification/verifiers). Verifier lists and schemas are also available in [`spec/`](./spec/VERIFIERS.json).

| Capability | Verifiers |
| --- | --- |
| Ownership and identity | `ownership-basic`, `ownership-social`, `ownership-dns-txt`, `ownership-org-oauth`, `ownership-pseudonym` |
| Human and wallet trust | `proof-of-human`, `wallet-risk`, `wallet-link` |
| Assets and contracts | `token-holding`, `nft-ownership`, `contract-ownership` |
| Content and safety | `ai-content-moderation` |
| Agent trust | `agent-identity`, `agent-delegation` |

## System map

| Repo | What builders use it for |
| --- | --- |
| `neus` | Hosted product: verify, profiles, proof pages, gates, and end-user experience |
| `protocol` | Hosted HTTP API and verification behavior your app and MCP clients call |
| `network` | This repository: docs, SDK (`@neus/sdk`), widgets, examples, specs, and Claude marketplace metadata |

## Where to go next

- [docs.neus.network](https://docs.neus.network) is the starting point for setup and product docs.
- [Integration](https://docs.neus.network/integration) walks through the flow: check, verify, save, reuse.

## Proof of reality

| Surface | Link |
| --- | --- |
| Product | [neus.network](https://neus.network) |
| Hosted Verify | [neus.network/verify](https://neus.network/verify) |
| Docs | [docs.neus.network](https://docs.neus.network) |
| SDK | [npm: @neus/sdk](https://www.npmjs.com/package/@neus/sdk) |
| Examples | [`examples/`](./examples) |
| Verifier catalog | [Verifier docs](https://docs.neus.network/verification/verifiers) |

## Support

| Channel | Use for |
| --- | --- |
| [Docs](https://docs.neus.network) | Product and integration guidance |
| [Discussions](https://github.com/neus/network/discussions) | Questions and implementation patterns |
| [Issues](https://github.com/neus/network/issues) | Bugs and requests |
| [dev@neus.network](mailto:dev@neus.network) | Security |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidance.

## License

- **SDK and tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 to Apache-2.0 in August 2028
