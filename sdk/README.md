# @neus/sdk

Create, check, and reuse NEUS trust receipts from apps and backends. Ships the **`neus`** CLI for assistant setup and project mounting.

NEUS makes trust portable across the internet, so people, apps, and AI agents can prove what is real before access, payout, or execution.

## Install (library)

```bash
npm install @neus/sdk
```

## Connect editors and assistants

Install once, then use short commands:

```bash
npm i -g @neus/sdk
neus setup
neus check
neus examples
```

Or run without installing: `npx -y -p @neus/sdk neus setup`

Then ask your assistant: **"Use NEUS Verify before taking sensitive actions."**

## Mount an agent in a project

```bash
neus auth
neus mount <agentId> --apply cursor
neus doctor --live
```

This writes the project mount and editor rules in the current repo. See [Runtime Mount docs](https://docs.neus.network/agents/runtime-mount).

## MCP docs

| Topic | Link |
| ----- | ---- |
| Setup, JSON snippets, and headers | [MCP setup](https://docs.neus.network/mcp/setup) |
| Reuse-first MCP flow | [MCP overview](https://docs.neus.network/mcp/overview) |
| Discovery URLs | [Discovery and endpoints](https://docs.neus.network/mcp/endpoints) |
| Install NEUS | [Install NEUS](https://docs.neus.network/install) |

Prefer `neus setup` over hand-editing config files so every host stays on **`https://mcp.neus.network/mcp`**.

## What you can ship

- Hosted verification flows that return reusable receipts
- Server checks before access, rewards, payments, or actions
- React gates with `VerifyGate`
- Agent identity and scoped delegation
- MCP setup for assistants and agent tools

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

After completion, NEUS redirects back with a `qHash`. Store it with your user or record.

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

## Verified handles

Bind a creator handle to a wallet and show a live badge:

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const proof = await client.verify({
  verifier: 'ownership-pseudonym',
  data: {
    pseudonymId: 'alice123',
    namespace: 'acme',
    displayName: 'Alice'
  },
  wallet: window.ethereum
});

// proof.qHash, proof.proofUrl
```

```jsx
import { ProofBadge } from '@neus/sdk/widgets';

export function CreatorHandle({ handle, qHash }) {
  return (
    <span>
      @{handle} <ProofBadge qHash={qHash} showChains />
    </span>
  );
}
```

Full walkthrough: [docs.neus.network/cookbook/verified-handles](https://docs.neus.network/cookbook/verified-handles).

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

## Check receipts

Use `gateCheck` from trusted server code when you need allow/deny before access:

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const result = await client.gateCheck({
  gateId: 'gate_your-app-name',
  address: '0x...'
});

if (!result.data?.eligible) {
  throw new Error('Access denied');
}
```

Never ship access keys in browser code.

## Core methods

| Method | Use it for |
| ------ | ---------- |
| `getHostedCheckoutUrl()` | Send a user to Hosted Verify |
| `client.verify()` | Create a trust receipt (in-app signing) |
| `client.verifyFromApp()` | Create a receipt when your backend signs |
| `client.getProof()` | Fetch a public receipt by `qHash` |
| `client.getPrivateProof()` | Fetch a private receipt (wallet-bound) |
| `client.pollProofStatus()` | Wait for async verification completion |
| `client.getProofsByWallet()` | List a wallet's public receipts |
| `client.getPrivateProofsByWallet()` | List a wallet's private receipts |
| `client.gateCheck()` | Server-side eligibility check before access |
| `client.checkGate()` | Local preview against already-loaded proofs |
| `client.getGate()` | Read a published gate's requirements and charge |
| `client.fulfillGate()` | Deliver a post-verify reward for hosted checkout |
| `client.createGatePrivateAuth()` | Signed proof for private gate access |
| `client.revokeOwnProof()` | Revoke a receipt you own |
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

```bash
npm i -g @neus/sdk
neus setup
neus check
```

`neus setup` configures MCP and signs you in: it uses `NEUS_ACCESS_KEY` from the environment when set, otherwise the selected host starts OAuth. Cursor, VS Code, and Claude Code use browser sign-in on NEUS. Pass `--access-key <npk_...>` only to override.

Codex owns its local MCP OAuth session. Use `neus setup --client codex`, then `neus auth --client codex`.

No global install? Run `npx -y -p @neus/sdk neus setup` once.

Embed install UX with **`@neus/sdk/mcp-hosts`** (setup commands, deeplinks, host labels).

Claude Code users can install **`neus-trust@neus`** for the bundled session workflow:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-trust@neus
```

Other hosts: [Install NEUS](https://docs.neus.network/install).

## Docs

- Quickstart: https://docs.neus.network/quickstart
- JavaScript SDK: https://docs.neus.network/sdks/javascript
- Ownership Basic: https://docs.neus.network/verification/ownership-basic
- Widgets: https://docs.neus.network/widgets/overview
- MCP: https://docs.neus.network/mcp/overview
- API: https://docs.neus.network/api/overview
