<p align="center">
  <a href="https://neus.network">
    <img src="sdk/neus-logo.svg" width="84" alt="NEUS" />
  </a>
</p>

<h1 align="center">NEUS</h1>

<p align="center">
  <strong>Portable proof receipts.</strong> Verify once, save <code>proofId</code>, reuse in UI, APIs, and agents.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
  <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
</p>

<p align="center">
  <a href="https://docs.neus.network/get-started"><strong>Get started</strong></a> ·
  <a href="https://neus.network/verify"><strong>Hosted Verify</strong></a> ·
  <a href="https://docs.neus.network/quickstart"><strong>Quickstart</strong></a> ·
  <a href="https://docs.neus.network"><strong>Docs</strong></a> ·
  <a href="./examples"><strong>Examples</strong></a>
</p>

---

## Quickstart

```bash
npm install @neus/sdk
```

```ts
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({ appId: 'your-app-id' });

const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Verified bounty submission',
  wallet: window.ethereum,
});

const { proofId } = proof;
const signerAddress = '0x...';

const check = await client.gateCheck({
  address: signerAddress,
  verifierIds: ['ownership-basic'],
});

console.log(check.data?.eligible);
```

Details: [SDK README](./sdk/README.md), [docs.neus.network](https://docs.neus.network).

## React gate

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  appId="your-app-id"
  requiredVerifiers={['token-holding']}
  verifierData={{
    'token-holding': {
      contractAddress: '0x...',
      minBalance: '100.0',
      chainId: 1,
    },
  }}
>
  <RewardClaimForm />
</VerifyGate>
```

## MCP (agents / tools)

```json
{
  "mcpServers": {
    "neus": {
      "type": "streamableHttp",
      "url": "https://mcp.neus.network/mcp"
    }
  }
}
```

[docs.neus.network/mcp](https://docs.neus.network/mcp/overview)

## Hosted Verify

`https://neus.network/verify?preset=agent-pack`  
`https://neus.network/verify?verifiers=proof-of-human&returnUrl=https://myapp.com/callback`

## Verifiers (live list)

**`GET /api/v1/verification/verifiers`** — same family as [`spec/VERIFIERS.json`](./spec/VERIFIERS.json).

| Verifier | Partner |
| --- | --- |
| `wallet-risk` | [Webacy / DD.xyz](https://webacy.com) |
| `proof-of-human` | [ZKPassport](https://zkpassport.id) |
| `proof-of-audit` | [SafeStack AI](https://safestackai.com) *(not in live catalog yet)* |

| Use case | ID |
| --- | --- |
| Social ownership | `ownership-social` |
| Domain | `ownership-dns-txt` |
| Org OAuth | `ownership-org-oauth` |
| Pseudonym | `ownership-pseudonym` |
| Content / provenance | `ownership-basic` |
| Human verification | `proof-of-human` |
| Token balance | `token-holding` |
| NFT | `nft-ownership` |
| Contract | `contract-ownership` |
| Wallet risk | `wallet-risk` |
| Linked wallets | `wallet-link` |
| Content moderation | `ai-content-moderation` |
| Agent identity | `agent-identity` |
| Agent delegation | `agent-delegation` |

## Agents (SDK)

```ts
await client.verify({
  verifier: 'agent-identity',
  data: {
    agentId: 'my-bot',
    agentWallet: '0x...',
    agentChainRef: 'eip155:8453',
    agentType: 'ai',
  },
  walletAddress: agentWallet,
});

await client.verify({
  verifier: 'agent-delegation',
  data: {
    controllerWallet: '0x...',
    controllerChainRef: 'eip155:8453',
    agentWallet: '0x...',
    agentChainRef: 'eip155:8453',
    scope: 'payments:x402',
    permissions: ['execute', 'read'],
    maxSpend: '25000000',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
  walletAddress: controllerWallet,
});
```

[Agent identity](https://docs.neus.network/agents/agent-identity) · [Delegation](https://docs.neus.network/agents/agent-delegation)

## Visibility

| Mode | Role |
| --- | --- |
| Vaulted | Owner-only reads |
| Unlisted | Reuse links, not discoverable |
| Public | Discoverable |

[Security and trust](https://docs.neus.network/platform/security-and-trust)

## Support

| | |
| --- | --- |
| [Docs](https://docs.neus.network) | Reference |
| [Discussions](https://github.com/neus/network/discussions) | Q&A |
| [Issues](https://github.com/neus/network/issues) | Bugs |
| [dev@neus.network](mailto:dev@neus.network) | Security |

[CONTRIBUTING.md](./CONTRIBUTING.md)

## License

- **SDK & tools:** Apache-2.0
- **Smart contracts:** BUSL-1.1 → Apache-2.0 (Aug 2028)
