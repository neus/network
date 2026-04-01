# NEUS Network

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=@neus/sdk)](https://www.npmjs.com/package/@neus/sdk)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

**Verify once. Prove everywhere.**

NEUS replaces fragmented verification with one reusable proof receipt.

## Quick Start

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

// Save this ID — reuse it everywhere
const proofId = proof.proofId;
```

## What NEUS Does

| Problem | Solution |
|---------|----------|
| Verification built per feature | One proof, many uses |
| No reusable identity | Portable proof receipts |
| Custom verification infrastructure | Hosted UI + API |

## Integration paths

**Builders:** [Get started](https://docs.neus.network/get-started) (platform, app link, credits), then [choose an integration path](https://docs.neus.network/choose-an-integration-path).

| Path | Best For |
|------|----------|
| [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) | Login, social linking |
| [Widgets](https://docs.neus.network/widgets/overview) | React gating |
| [SDK](https://docs.neus.network/sdks/overview) | Custom flows |
| [API](https://docs.neus.network/api/overview) | Server checks |
| [MCP](https://docs.neus.network/mcp/overview) | AI agents |

## AI assistants (MCP)

**`https://mcp.neus.network/mcp`** — [setup](https://docs.neus.network/mcp/setup) is one JSON block; users verify via **hosted links** tools return.

## Documentation

| Resource | Description |
|----------|-------------|
| [Quickstart](https://docs.neus.network/quickstart) | First proof in 5 minutes |
| [Verifier Catalog](https://docs.neus.network/verification/verifiers) | All capabilities |
| [API Reference](https://docs.neus.network/api/overview) | HTTP endpoints |
| [Examples](./examples/) | React, Node.js, curl |

## Support

| Channel | Use For |
|---------|---------|
| [GitHub Discussions](https://github.com/neus/network/discussions) | Questions |
| [GitHub Issues](https://github.com/neus/network/issues) | Bug reports |
| [dev@neus.network](mailto:dev@neus.network) | Security |

## License

- **Smart Contracts:** BUSL-1.1 → Apache-2.0 (Aug 2028)
- **SDK & Tools:** Apache-2.0