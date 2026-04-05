# NEUS

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=@neus/sdk)](https://www.npmjs.com/package/@neus/sdk)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

**Verify once. Reuse everywhere.**

NEUS gives apps, APIs, and agents a reusable proof receipt for identity, ownership, risk, and access. Run a check once, get a portable receipt, and use it to gate, share, or automate anywhere.

## Use NEUS to

- **Verify users once** and reuse the result across your product
- **Gate access** by proof instead of custom auth logic
- **Attach proof to content**, listings, and agent actions
- **Register agents** and give them scoped permissions
- **Share verification results** without exposing raw private data

## How it works

1. **Verify** — User completes a check (wallet, social, identity, or risk).
2. **Get a receipt** — You receive a portable proof ID.
3. **Reuse it** — Gate content, check eligibility, share badges, or automate with it.

## Quick start

```bash
npm install @neus/sdk
```

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'My content',
  wallet: window.ethereum,
});

const proofId = proof.proofId; // save this — reuse it everywhere
```

## What you can build

| Use case | How |
|----------|-----|
| Human-only signup or access | `proof-of-human` verifier |
| Token / NFT gated products | `nft-ownership`, `token-holding` |
| Verified creator or org badges | `ownership-basic`, `ownership-org-oauth` |
| Proof-backed content and posts | Attach `proofId` to any content |
| Agent identity and delegation | `agent-identity`, `agent-delegation` |
| Domain-verified organizations | `ownership-dns-txt` |

## Start here

| I want to… | Go to |
|-------------|-------|
| Try it in 5 minutes | [Quickstart](https://docs.neus.network/quickstart) |
| Use hosted UI (no wallet code) | [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) |
| Gate content in React | [Widgets](https://docs.neus.network/widgets/overview) |
| Check proofs from my server | [API](https://docs.neus.network/api/overview) |
| Add verification to AI agents | [MCP](https://docs.neus.network/mcp/overview) |
| Set up billing and apps | [Get started](https://docs.neus.network/get-started) |

## Integration paths

| Path | Best for |
|------|----------|
| [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) | Login, social linking — no custom UI needed |
| [Widgets](https://docs.neus.network/widgets/overview) | React gating and badges |
| [SDK](https://docs.neus.network/sdks/overview) | Custom browser or server flows |
| [API](https://docs.neus.network/api/overview) | Server-side checks |
| [MCP](https://docs.neus.network/mcp/overview) | AI agents (Cursor, Claude, etc.) |

## AI agents (MCP)

Add NEUS to any MCP-compatible agent with one URL:

```
https://mcp.neus.network/mcp
```

[Setup guide](https://docs.neus.network/mcp/setup) — one JSON block, then agents verify users via hosted links.

## Documentation

| Resource | Description |
|----------|-------------|
| [Quickstart](https://docs.neus.network/quickstart) | First proof in 5 minutes |
| [Verifier catalog](https://docs.neus.network/verification/verifiers) | All verification types |
| [API reference](https://docs.neus.network/api/overview) | HTTP endpoints |
| [Examples](./examples/) | React, Node.js, curl |

## Support

| Channel | Use for |
|---------|---------|
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions |
| [GitHub Issues](https://github.com/neus/network/issues) | Bug reports |
| [dev@neus.network](mailto:dev@neus.network) | Security |

## License

- **SDK & tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 → Apache-2.0 (Aug 2028)
