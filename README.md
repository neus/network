<p align="center">
  <a href="https://neus.network">
    <img src="sdk/neus-logo.svg" width="80" alt="NEUS" />
  </a>
</p>

<h1 align="center">NEUS</h1>

<p align="center">
  <strong>Verify once. Reuse proof receipts anywhere.</strong><br/>
  NEUS is the programmable trust, authorization, and billing layer for apps, APIs, and agents.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
</p>

<p align="center">
  <a href="https://docs.neus.network/quickstart"><strong>Quickstart</strong></a> ·
  <a href="https://docs.neus.network"><strong>Docs</strong></a> ·
  <a href="https://docs.neus.network/api/overview"><strong>API Reference</strong></a> ·
  <a href="https://docs.neus.network/mcp/overview"><strong>MCP</strong></a> ·
  <a href="./examples"><strong>Examples</strong></a>
</p>

---

Every app, tool, and agent eventually needs the same three things:

- prove who or what is acting
- prove what it can access
- prove what was paid for and what receipt was issued

NEUS standardizes that into one portable proof receipt.

## What NEUS is today

- Hosted Verify at `/verify` for login and guided verification
- Proof receipts at `/proof/[qHash]` for shareable, reusable proof pages
- Agent identity and delegation for scoped permissions and audit trails
- Billing-aware verification with credits, sponsor grants, and x402-ready pay-per-use paths

## Why teams adopt it

- Stop re-verifying. One check produces a receipt your stack can reuse.
- Gate access with proof, not auth spaghetti. Replace one-off verification logic with a standard flow.
- Keep sensitive data private. Share the proof receipt without exposing the underlying payload.
- Ship faster. Start with Hosted Verify, Widgets, SDK, API, or MCP.
- Works for people and agents. The same receipt model supports both.
- Supports payment-aware flows. Credits, sponsor grants, and pay-per-use are part of the system.

## What you can build

| Use case | How | Verifier |
|----------|-----|----------|
| Human-only access | Block bots at signup | `proof-of-human` |
| Token or NFT gated products | Gate by on-chain holdings | `nft-ownership` · `token-holding` |
| Verified creators | Prove authorship and bind it to a wallet | `ownership-basic` |
| Org-verified teams | Prove domain or organization membership | `ownership-dns-txt` · `ownership-org-oauth` |
| Agent identity and delegation | Register agents and scope permissions | `agent-identity` · `agent-delegation` |
| Proof-backed content | Attach a receipt to posts and listings | `ownership-basic` + `proofId` |
| Paid APIs and tools | Combine access checks with billing-aware flows | `billing` + `x402` + receipts |

## Start here

| I want to... | Go to |
|-------------|-------|
| Try it in 5 minutes | [Quickstart](https://docs.neus.network/quickstart) |
| Add verification with no code | [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) |
| Gate content in React | [Widgets](https://docs.neus.network/widgets/overview) |
| Check proofs from my server | [API Reference](https://docs.neus.network/api/overview) |
| Add trust to AI agents | [MCP](https://docs.neus.network/mcp/overview) |
| Set up platform and billing | [Get Started](https://docs.neus.network/get-started) |

## Integration paths

| Path | Best for | Effort |
|------|----------|--------|
| [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) | Login, guided verification | Redirect or popup - no UI to build |
| [Widgets](https://docs.neus.network/widgets/overview) | React gating and badges | `<VerifyGate>` - one component |
| [SDK](https://docs.neus.network/sdks/overview) | Custom flows | Full programmatic control |
| [API](https://docs.neus.network/api/overview) | Server-side checks | HTTP from any language |
| [MCP](https://docs.neus.network/mcp/overview) | AI agents (Cursor, Claude) | One URL - `https://mcp.neus.network/mcp` |
| [Billing](https://docs.neus.network/platform/billing) | Credits, sponsor grants, x402 | Who pays and when |

## Gate content in React

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate requiredVerifiers={['nft-ownership']}
  verifierData={{ 'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 1 } }}>
  <PremiumContent />
</VerifyGate>
```

## AI agents (MCP)

Add NEUS to any MCP-compatible agent with one URL:

```json
{
  "mcpServers": {
    "neus": { "url": "https://mcp.neus.network/mcp" }
  }
}
```

Agents verify users via hosted links that tools return. [Setup guide ->](https://docs.neus.network/mcp/setup)

## Documentation

| Resource | Description |
|----------|-------------|
| [Quickstart](https://docs.neus.network/quickstart) | First proof in 5 minutes |
| [Verifier catalog](https://docs.neus.network/verification/verifiers) | All verification types |
| [API reference](https://docs.neus.network/api/overview) | HTTP endpoints |
| [SDK reference](https://docs.neus.network/sdks/javascript) | JavaScript SDK |
| [Proof receipts](https://docs.neus.network/platform/receipts-and-results) | What to store and reuse |
| [Examples](./examples/) | React, Node.js, curl |

## Community

| Channel | |
|---------|---|
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions and ideas |
| [GitHub Issues](https://github.com/neus/network/issues) | Bug reports |
| [dev@neus.network](mailto:dev@neus.network) | Security disclosures |

## License

- SDK and tools: Apache-2.0
- Smart contracts: BUSL-1.1 -> Apache-2.0 (Aug 2028)
