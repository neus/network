<p align="center">
  <a href="https://neus.network">
    <img src="sdk/neus-logo.svg" width="84" alt="NEUS" />
  </a>
</p>

<h1 align="center">NEUS</h1>

<p align="center">
  <strong>Stop re-running the same checks.</strong> Users verify once; you get a stored <code>proofId</code> you can reuse in product UI, APIs, billing gates, and agent tools.
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

## Why teams pick NEUS

| You want… | NEUS gives you… |
| --- | --- |
| Fewer support loops on “prove it again” | One verification flow, a stored receipt, **`gateCheck`** on demand |
| Trust signals users can share | Resolvable proof URLs and handles—not a one-off screenshot |
| Agents that act with limits | **`agent-identity`** + **`agent-delegation`** with scoped permissions |
| Chat/IDE tools that need live proof state | Hosted **MCP** so clients read current proofs instead of static copy |

**In practice:** NEUS runs the verifier checks. Your app calls **`verify`**, stores **`proofId`**, and calls **`gateCheck`** when you need allow/deny.

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

Next: [SDK README](./sdk/README.md) · [docs.neus.network](https://docs.neus.network)

## Universal identity (agents & automation)

| Layer | What |
| --- | --- |
| Core proofs | `agent-identity` · optional `agent-delegation` |
| Resolvable handles | `https://neus.network/agent/<agentId>` · proof URLs · wallet · DID |
| Tooling manifest | Optional JSON from the agent profile for clients that load skills or tool lists—see [Agents](https://docs.neus.network/agents/overview) |
| Live checks | NEUS MCP — `neus_context` · `neus_proofs_get` ([MCP docs](https://docs.neus.network/mcp/overview)) |
| Linked accounts | Ownership proofs + `wallet-link` with the same receipt model ([live list](#verifiers-live-list)) |

**Fast path:** [Hosted Verify](https://neus.network/verify) · agent preset `?preset=agent-pack`. Scoped spend and paywalls: [x402](https://docs.neus.network/platform/x402) · [Get started](https://docs.neus.network/get-started) (credits, sponsors).

### Setup (any chat or IDE)

1. [Get started](https://docs.neus.network/get-started) — profile, `appId`, credits; personal access key from Hub only if a tool asks for account-scoped access.
2. Register + delegate — SDK (**Agents** below), [Hosted Verify agent preset](https://neus.network/verify?preset=agent-pack), or MCP [`neus_agent_create`](https://docs.neus.network/mcp/agent-create) → `hostedVerifyUrl` → [`neus_agent_link`](https://docs.neus.network/mcp/agent-link). Sequence: [Agents](https://docs.neus.network/agents/overview) · [Cookbook](https://docs.neus.network/cookbook/verifiable-agents).
3. Paste a **resolvable handle** (agent card URL, proof URL, wallet, or DID) and wire **NEUS MCP** so the client pulls state instead of static copy.
4. Optional: download config JSON for tools and hosts that load skills or tool lists from a manifest — NEUS binds **proof-linked identity**; prompts live in your repo.

**Ship an agent:** this section plus [Agents](https://docs.neus.network/agents/overview) in the documentation.

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

[docs.neus.network/mcp](https://docs.neus.network/mcp/overview) · [MCP package](./mcp/README.md)

## Hosted Verify

`https://neus.network/verify?preset=agent-pack`  
`https://neus.network/verify?verifiers=proof-of-human&returnUrl=https://myapp.com/callback`

## Verifiers (overview)

**Live catalog:** [Verifier catalog](https://docs.neus.network/verification/verifiers). Machine-readable verifier lists and schemas ship in [`spec/`](./spec/VERIFIERS.json) with this project for reference and validation tooling.

### Verifiers live list

| Verifier | Partner |
| --- | --- |
| `wallet-risk` | [Webacy / DD.xyz](https://webacy.com) |
| `proof-of-human` | [ZKPassport](https://zkpassport.id) |

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
