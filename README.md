<h1 align="center">NEUS Network</h1>

<p align="center">
  <strong>Portable Trust Infrastructure for Humans and AI.</strong>
</p>

<p align="center">
  Turn supported identity, ownership, risk, and permission checks into Portable Proofs for profiles, product gates, paid access, and AI agents.
</p>

<p align="center">
  <em>Run a check once. Save the result. Reuse it where accepted.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="@neus/sdk on npm" /></a>
  <a href="https://www.npmjs.com/package/@neus/mcp-server"><img src="https://img.shields.io/npm/v/%40neus%2Fmcp-server?logo=npm&label=%40neus%2Fmcp-server&color=98C0EF" alt="@neus/mcp-server on npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
  <a href="https://neus.network/proof/0x1487d0d9826ffc2c415b33745a058711f1c4d8928d64df5c7104752ed6d62cc0"><img src="https://img.shields.io/badge/NEUS-Verified%20Proof-98C0EF?style=flat&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI%2BPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNy41IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjE2LjAwIiBjeT0iNS4wMCIgcj0iMS4zNSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjIxLjUwIiBjeT0iNi40NyIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjI1LjUzIiBjeT0iMTAuNTAiIHI9IjEuMzUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIyNy4wMCIgY3k9IjE2LjAwIiByPSIxLjM1IiBmaWxsPSIjZmZmIi8%2BPGNpcmNsZSBjeD0iMjUuNTMiIGN5PSIyMS41MCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjIxLjUwIiBjeT0iMjUuNTMiIHI9IjEuMzUiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxNi4wMCIgY3k9IjI3LjAwIiByPSIxLjM1IiBmaWxsPSIjZmZmIi8%2BPGNpcmNsZSBjeD0iMTAuNTAiIGN5PSIyNS41MyIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjYuNDciIGN5PSIyMS41MCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjUuMDAiIGN5PSIxNi4wMCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjYuNDciIGN5PSIxMC41MCIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjxjaXJjbGUgY3g9IjEwLjUwIiBjeT0iNi40NyIgcj0iMS4zNSIgZmlsbD0iI2ZmYiIvPjwvc3ZnPg%3D%3D" alt="NEUS verified portable proof" /></a>
</p>

<p align="center">
  <a href="#why-neus"><strong>Why NEUS</strong></a>
  | <a href="#choose-a-path"><strong>Choose a path</strong></a>
  | <a href="#live-surfaces"><strong>Live surfaces</strong></a>
  | <a href="#support"><strong>Support</strong></a>
</p>

---

## Why NEUS

People and products repeat the same identity, ownership, risk, and permission work in every new system. NEUS saves supported results as Portable Proofs so a connected product can evaluate them under its own rules.

Use one proof model for profiles, product gates, paid access, and AI agents. A proof is reusable only when the receiving product accepts its source and the proof still meets its policy.

NEUS does not replace authentication, specialist verification providers, application policy, payment processing, agent runtimes, or complete audit logs. The integration must call the check and enforce the result on the protected path.

| Need | What you get with NEUS |
| ---- | ------------------------ |
| Reuse a completed check | A proof with source, status, scope, and expiry |
| Keep proofs in one profile | Private-by-default proof management and selective sharing |
| Add verification to an app | Hosted sign-in, API, SDK, and React widgets |
| Sell protected access | Published checks, price, hosted checkout, and a server confirmation |
| Set limits on an AI agent | Owner, allowed and denied actions, spend limit, expiry, and revocation |

## Choose a path

One command. Then click **Connect**.

```bash
npx -y -p @neus/sdk neus setup
```

Then ask:

> Show my NEUS profile and current proofs. Do not create anything.

After the connection is visible, test a protected action. NEUS answers **Passed**, **Action needed**, or **Blocked** when a check is requested. Full steps: [MCP setup](https://docs.neus.network/mcp/setup). Hosted URL `https://mcp.neus.network/mcp`.

| Path | Next step |
| ---- | --------- |
| Assistant | [Connect NEUS](https://docs.neus.network/mcp/setup) |
| App | [Hosted sign-in](https://docs.neus.network/cookbook/auth-hosted-verify) |
| Sell access | [Recipe](https://docs.neus.network/quickstart) |
| Agent limits | [Agents](https://docs.neus.network/agents/overview) |

---

## Live surfaces

| Surface | Use it for |
| ------- | ---------- |
| [Product](https://neus.network) | Profiles, gates, and hosted product UX |
| [Hosted Verify](https://neus.network/verify) | Browser verification for people and orgs |
| [Proofs](https://docs.neus.network/platform/proofs) | Portable records of identity, authority, and outcomes |
| [SDK](https://docs.neus.network/sdks/javascript) ([@neus/sdk](https://www.npmjs.com/package/@neus/sdk)) | Issue, poll, and check proofs from your app |
| [Widgets](https://docs.neus.network/widgets/overview) | `VerifyGate` and `ProofBadge` for React products |
| [API](https://docs.neus.network/api/overview) | Server reads, checks, verifier catalog, and verification endpoints |
| [Agents](https://docs.neus.network/agents/overview) | Agent identity, scoped authority, and audit-ready proofs |
| [MCP](https://docs.neus.network/mcp/overview) | Profile, proof, and permission checks for supported MCP clients. `neus setup`; registry metadata: [`@neus/mcp-server`](https://www.npmjs.com/package/@neus/mcp-server) |
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

Public docs, SDK (`@neus/sdk`), MCP registry package (`@neus/mcp-server`), widgets, examples, specs, and the **`neus-mcp`** plugin ([setup](https://docs.neus.network/mcp/setup)).

## Open standard

NEUS is the driving reference implementation of [CAIP-380 (Portable Proof)](https://standards.chainagnostic.org/CAIPs/caip-380) ([PR](https://github.com/ChainAgnostic/CAIPs/pull/380)), a ChainAgnostic standard at Draft status. Wallet-signed request envelopes have a deterministic SHAKE-256 hash (`qHash`), CAIP-2 chain context, and CAIP-10 / `did:pkh` identities. Their hash, DID binding, and signature can be checked without NEUS; verifier outcomes remain part of the NEUS portable proof. The envelope is chain-agnostic. Any CAIP-2 namespace. Signing follows the chain's native scheme. See [Standards & interoperability](https://docs.neus.network/learn/standards), the [offline examples](./examples/caip-380), the [CAIP-380 docs](https://docs.neus.network/learn/standards/caip-380), and the [Technical Whitepaper](https://docs.neus.network/whitepaper).

## Support

| Channel | Use for |
| ------- | ------- |
| [Docs](https://docs.neus.network) | Product and integration guidance |
| [Changelog](./CHANGELOG.md) | Release notes and upgrade paths |
| [Platform](https://docs.neus.network/platform/overview) | Hosted product, API, and upgrade path |
| [Discussions](https://github.com/neus/network/discussions) | Questions and implementation patterns |
| [Issues](https://github.com/neus/network/issues) | Bugs and requests |
| [SECURITY.md](./SECURITY.md), [dev@neus.network](mailto:dev@neus.network) | Vulnerability disclosure |

## Status

NEUS is under active development. Published APIs and verifier schemas may change between minor versions before the long-term stability freeze. We version everything we ship and document every breaking change in the [changelog](./CHANGELOG.md).

## Audit

Smart contracts were audited by [SafeStack AI](https://safestackai.com) in March 2026. The audit completed with no critical, high, medium, or low severity findings. See the [Trust Center](https://neus.network/trust-center#smart-contract-audit) for details.

## Partners and programs

- **Webacy, ZKPassport, Phala Network:** integration partnerships for verification, zero-knowledge identity, and confidential compute
- **NVIDIA Inception:** early-stage AI startup program
- **Google for Startups:** cloud and AI startup program
- **Optimism Retro Funding Season 8:** grant recipient

## License

All code in this repository is Apache-2.0, including the reference smart contracts. The CAIP-380 specification is released under CC0 1.0. NEUS names and logos are protected trademarks; see [TRADEMARKS.md](./TRADEMARKS.md).
