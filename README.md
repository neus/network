<p align="center">
 <a href="https://neus.network">
 <img src="sdk/neus-logo.svg" width="84" alt="NEUS" />
 </a>
</p>

<h1 align="center">NEUS</h1>

<p align="center">
 <strong>Verification checkout for access and claims.</strong> Run Hosted Verify or the SDK, store a verification ID, and check eligibility later instead of re-running the same flow.
</p>

<p align="center">
 <a href="https://www.npmjs.com/package/@neus/sdk"><img src="https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF" alt="npm" /></a>
 <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License" /></a>
 <a href="https://github.com/neus/network/discussions"><img src="https://img.shields.io/badge/community-discussions-98C0EF?logo=github" alt="Discussions" /></a>
</p>

<p align="center">
 <a href="https://docs.neus.network/get-started"><strong>Get started</strong></a>
 | <a href="https://neus.network/verify"><strong>Hosted Verify</strong></a>
 | <a href="https://docs.neus.network/quickstart"><strong>Quickstart</strong></a>
 | <a href="https://docs.neus.network"><strong>Docs</strong></a>
 | <a href="./examples"><strong>Examples</strong></a>
</p>

---

## Why teams pick NEUS

| You want… | NEUS gives you… |
| --- | --- |
| Less “prove it again” friction | One verification flow, a stored **verification ID**, **check** before re-verifying |
| Trust users can carry across surfaces | Resolvable URLs and handles - not one-off screenshots |
| Agents with clear limits | **`agent-identity`** + **`agent-delegation`** with scoped permissions |
| Live state in chat and IDE tools | Hosted **MCP** so clients read current results instead of static copy |

## Who this is for

- **Product teams** gating drops, bounties, or premium surfaces behind wallet, token, NFT, or human checks 
- **Platforms** that want one verification model across web, API, and automation 
- **Agent builders** wiring identity, delegation, and optional x402-style spend boundaries 

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

Next: [SDK README](./sdk/README.md) | [docs.neus.network](https://docs.neus.network)

## Linked profiles, agents, and automation

| Layer | What |
| --- | --- |
| Core flows | `agent-identity`, optional `agent-delegation` |
| Resolvable handles | `https://neus.network/agent/<agentId>`, result URLs, wallet, DID |
| Tooling manifest | Optional JSON from the agent profile. See [Agents](https://docs.neus.network/agents/overview). |
| Live checks | NEUS MCP: `neus_context`, `neus_proofs_get` ([MCP docs](https://docs.neus.network/mcp/overview)) |
| Linked accounts | Ownership verifiers + `wallet-link` with the same result model ([verifier table](#verifiers-overview)) |

**Fast path:** [Hosted Verify](https://neus.network/verify) | billing and caps in [app setup](https://docs.neus.network/get-started) | paid flows: [x402](https://docs.neus.network/platform/x402)

### Setup (any chat or IDE)

1. [Get started](https://docs.neus.network/get-started) - `appId`, org billing in **Apps**; access keys only when a tool needs account scope.
2. Register agents via SDK, [Hosted Verify](https://neus.network/verify), or MCP [`neus_agent_create`](https://docs.neus.network/mcp/agent-create) (open `hostedVerifyUrl` when returned), then [`neus_agent_link`](https://docs.neus.network/mcp/agent-link). [Agents](https://docs.neus.network/agents/overview) | [Cookbook](https://docs.neus.network/cookbook/verifiable-agents).
3. Share a **resolvable handle** (agent URL, result URL, wallet, DID) and use **NEUS MCP** for live state.
4. Optional: export config JSON for hosts that load tool manifests from a URL.

More: [Agents](https://docs.neus.network/agents/overview).

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

[Widgets](./sdk/widgets/README.md)

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

[docs.neus.network/mcp](https://docs.neus.network/mcp/overview) | [MCP package](./mcp/README.md)

## Hosted Verify

Examples:

`https://neus.network/verify?verifiers=proof-of-human&returnUrl=https://myapp.com/callback`

Agent onboarding (when you need the bundled agent verifiers): `https://neus.network/verify?preset=agent-pack`

## Verifiers (overview)

**Live catalog:** [Verifier catalog](https://docs.neus.network/verification/verifiers). Machine-readable lists and schemas ship in [`spec/`](./spec/VERIFIERS.json) for reference and validation tooling.

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

[Agent identity](https://docs.neus.network/agents/agent-identity) | [Delegation](https://docs.neus.network/agents/agent-delegation)

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
- **Smart contracts:** BUSL-1.1 to Apache-2.0 (Aug 2028)
