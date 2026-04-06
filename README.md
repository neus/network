<p align="center">
  <a href="https://neus.network">
    <img src="sdk/neus-logo.svg" width="80" alt="NEUS" />
  </a>
</p>

<h1 align="center">NEUS</h1>

<p align="center">
  <strong>Verify once. Prove everywhere.</strong><br/>
  Portable proof receipts for apps, APIs, and agents.
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

Every app makes you re-verify. That's why bots win and users lose.

NEUS fixes it: **verify once, get a portable proof receipt, reuse it everywhere.** Gate access, attach proof to content, register agents with scoped permissions — private by default, public when you choose.

> Auth got standardized (OAuth). Payments got standardized (Stripe). **Verification is still bespoke.** NEUS standardizes it into one receipt.

## Why NEUS

- **Stop re-verifying.** One check produces a receipt your whole stack can trust
- **Gate access with proof, not auth spaghetti.** One line of code replaces custom verification logic
- **Proof travels, data stays private.** Share the result without exposing underlying data
- **Ship trust in minutes.** Drop-in SDK, widgets, and API — not months of infra
- **Works for people and agents.** Same receipt format for human users and AI agents

## How it works

```
 ┌──────────┐     ┌──────────────┐     ┌──────────────────┐
 │  Verify  │ ──▶ │ Get receipt  │ ──▶ │  Reuse anywhere  │
 │          │     │   (proofId)  │     │                  │
 │ wallet,  │     │  portable,   │     │ gate, share,     │
 │ social,  │     │  private by  │     │ post, automate,  │
 │ identity │     │  default     │     │ delegate         │
 └──────────┘     └──────────────┘     └──────────────────┘
```

## Quick start

```bash
npm install @neus/sdk
```

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// 1. Verify
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My content',
  wallet: window.ethereum,
});

// 2. Save the receipt
const proofId = proof.proofId;

// 3. Reuse — check eligibility from anywhere
const check = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});
// check.data.eligible → true/false
```

> **No wallet in your app?** Use [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) — redirect or popup, zero wallet code.

## What you can build

| Use case | How | Verifier |
|----------|-----|----------|
| 🛡️ Human-only access | Block bots at signup | `proof-of-human` |
| 🎨 NFT / token gated products | Gate by on-chain holdings | `nft-ownership` · `token-holding` |
| ✅ Verified creator badges | Prove authorship, bind to wallet | `ownership-basic` |
| 🏢 Org-verified teams | Prove domain or org membership | `ownership-dns-txt` · `ownership-org-oauth` |
| 🤖 Agent identity + delegation | Register agents, scope permissions | `agent-identity` · `agent-delegation` |
| 📝 Proof-backed content | Attach proof to posts and listings | `ownership-basic` + `proofId` |

## Start here

| I want to… | Go to |
|-------------|-------|
| **Try it in 5 minutes** | [Quickstart](https://docs.neus.network/quickstart) |
| **Add verification with no code** | [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) |
| **Gate content in React** | [Widgets](https://docs.neus.network/widgets/overview) |
| **Check proofs from my server** | [API Reference](https://docs.neus.network/api/overview) |
| **Add trust to AI agents** | [MCP](https://docs.neus.network/mcp/overview) |
| **Set up platform + billing** | [Get Started](https://docs.neus.network/get-started) |

## Integration paths

| Path | Best for | Effort |
|------|----------|--------|
| [**Hosted Verify**](https://docs.neus.network/cookbook/auth-hosted-verify) | Login, guided verification | Redirect / popup — no UI to build |
| [**Widgets**](https://docs.neus.network/widgets/overview) | React gating + badges | `<VerifyGate>` — one component |
| [**SDK**](https://docs.neus.network/sdks/overview) | Custom flows | Full programmatic control |
| [**API**](https://docs.neus.network/api/overview) | Server-side checks | HTTP from any language |
| [**MCP**](https://docs.neus.network/mcp/overview) | AI agents (Cursor, Claude) | One URL — `https://mcp.neus.network/mcp` |

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

Agents verify users via hosted links that tools return. [Setup guide →](https://docs.neus.network/mcp/setup)

## Documentation

| Resource | Description |
|----------|-------------|
| [**Quickstart**](https://docs.neus.network/quickstart) | First proof in 5 minutes |
| [**Verifier catalog**](https://docs.neus.network/verification/verifiers) | All verification types |
| [**API reference**](https://docs.neus.network/api/overview) | HTTP endpoints |
| [**SDK reference**](https://docs.neus.network/sdks/javascript) | JavaScript SDK |
| [**Examples**](./examples/) | React, Node.js, curl |

## Community

| Channel | |
|---------|---|
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions and ideas |
| [GitHub Issues](https://github.com/neus/network/issues) | Bug reports |
| [dev@neus.network](mailto:dev@neus.network) | Security disclosures |

## License

- **SDK & tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 → Apache-2.0 (Aug 2028)
