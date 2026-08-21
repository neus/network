# @neus/sdk

Add hosted verification, Portable Proofs, product gates, paid access, and agent permissions without replacing your authentication, payment, or agent stack.

NEUS turns a supported identity, ownership, risk, or permission check into a Portable Proof. Connected products can evaluate its current status before access, payment, or execution.

## Install (library)

```bash
npm install @neus/sdk
```

## Connect a supported MCP client

Register the hosted remote, then click **Connect**:

`https://mcp.neus.network/mcp`

Ask: **"Reuse what I already have. Before a sensitive action, check my current proofs."**

Optional terminal installer (writes that URL and the public workflow skill):

```bash
npx -y -p @neus/sdk neus setup
```

Full steps: [MCP setup](https://docs.neus.network/mcp/setup).

## Connect an agent to a project

```bash
neus setup
neus mount <agentId> --apply <host>
```

Loads the agent's verified identity, scoped authority, and host rules into the project. See [Connect Agent Context](https://docs.neus.network/agents/runtime-mount).

## MCP docs

| Topic | Link |
| ----- | ---- |
| Setup, JSON snippets, and the connect prompt | [MCP setup](https://docs.neus.network/mcp/setup) |
| Profile, proofs, permissions, and private context | [MCP overview](https://docs.neus.network/mcp/overview) |
| Host action decision | [First guarded action](https://docs.neus.network/mcp/guarded-action) |
| Discovery URLs | [Discovery and endpoints](https://docs.neus.network/mcp/endpoints) |

The hosted endpoint is always **`https://mcp.neus.network/mcp`**. Marketplace, registry, URL-only config, or the terminal installer all register that same remote.

## What you can ship

- Hosted verification flows that return reusable portable proofs
- Server checks before access, rewards, payments, or actions
- React gates with `VerifyGate`
- Agent identity, controller-approved authority, and per-payment limits
- MCP setup so supported clients can access the same profile, proofs, and permissions

## Hosted Verify

Use Hosted Verify when NEUS should handle the signing step outside your app UI. Prefer a **published gate**:

```js
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  gateId: 'gate_your-app-name',
  returnUrl: 'https://yourapp.com/auth/callback'
});

window.location.assign(url);
```

After completion, NEUS redirects back with a proof ID in the `qHash` field. Store the proof ID with your user or record.

Dedicated agent setup keeps the agent-signed identity step separate from the approving account:

```js
import { getHostedAgentCreateUrl } from '@neus/sdk';

const url = getHostedAgentCreateUrl({
  agentId: 'data-analyst',
  agentWallet,
  controllerWallet,
  identityQHash,
  returnUrl: 'https://yourapp.com/agents/callback'
});
```

When `identityQHash` is present, Hosted Verify requests only `agent-delegation`.

## In-app signing

Use this only when your app intentionally handles signing. This example is EVM. For non-EVM accounts, pass the provider explicitly and include `chain` as a CAIP-2 value.

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({
  apiUrl: 'https://api.neus.network'
});

const proof = await client.verify({
  verifier: 'ownership-basic',
  data: {
    owner: '0x...',
    contentType: 'application/json',
    content: JSON.stringify({
      title: 'Verified claim',
      type: 'project-update',
      summary: 'Public summary of what is being proven.'
    }),
    reference: {
      type: 'url',
      id: 'https://example.com/source',
      title: 'Source record'
    }
  },
  wallet: window.ethereum // EVM provider
});

console.log(proof.qHash);
console.log(proof.proofUrl);
```

## React widget

Use `VerifyGate` with your published `gateId`:

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate
      gateId="gate_your-app-name"
      onVerified={result => {
        console.log(result.qHash || result.qHashes);
      }}
    >
      <section>Unlocked content</section>
    </VerifyGate>
  );
}
```

## Check proofs

Use `gateCheck` from trusted server code when you need allow/deny before access:

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const result = await client.gateCheck({
  gateId: 'gate_your-app-name',
  address: '0x...'
});

if (result.data?.gate?.allRequiredSatisfied !== true) {
  throw new Error('Access denied');
}
```

Never ship access keys in browser code.

## Core methods

| Method | Use it for |
| ------ | ---------- |
| `getHostedCheckoutUrl()` | Send a user to Hosted Verify |
| `client.verify()` | Create a proof (in-app signing) |
| `client.verifyFromApp()` | Create a proof for an approved user (server; needs appId + origin) |
| `client.getProof()` | Fetch a public proof by its proof ID (`qHash`) |
| `client.getPrivateProof()` | Fetch a private proof (wallet-bound) |
| `client.pollProofStatus()` | Wait for async verification completion |
| `client.getProofsByWallet()` | List a wallet's public proofs |
| `client.getPrivateProofsByWallet()` | List a wallet's private proofs |
| `client.gateCheck()` | Server-side eligibility check before access |
| `client.checkGate()` | Local preview against already-loaded proofs |
| `client.getGate()` | Read a published gate's requirements and charge |
| `client.fulfillGate()` | Deliver a post-verify reward for hosted checkout |
| `client.createGatePrivateAuth()` | Signed proof for private gate access |
| `client.revokeOwnProof()` | Revoke a proof you own |
| `client.createWalletLinkData()` | Wallet-link payloads |
| `client.getVerifiers()` | List live verifier ids |
| `client.getVerifierCatalog()` | Full verifier catalog with access levels |
| `client.isHealthy()` | Ping the API health endpoint |

## Configuration

```js
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  timeout: 30000
});
```

`appId` is optional public attribution for advanced server/app flows. Published gate checkout and `gateCheck({ gateId })` do not require it.

`apiKey` / `npk_*` is optional and server-side only.

## MCP step-by-step

Register `https://mcp.neus.network/mcp`, then click **Connect** in the host MCP panel. Marketplace or registry install is enough. The terminal installer (`npx -y -p @neus/sdk neus setup`) writes that same URL and the public workflow skill when a plugin is not already present. When `NEUS_ACCESS_KEY` is set, setup writes that server credential instead.

Marketplace install and host adapters: [MCP setup](https://docs.neus.network/mcp/setup).

## Docs

- Start: https://docs.neus.network
- Sell access: https://docs.neus.network/quickstart
- JavaScript SDK: https://docs.neus.network/sdks/javascript
- Ownership Basic: https://docs.neus.network/verification/ownership-basic
- Widgets: https://docs.neus.network/widgets/overview
- MCP: https://docs.neus.network/mcp/overview
- API: https://docs.neus.network/api/overview
