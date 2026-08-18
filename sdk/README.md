# @neus/sdk

Don't restart from zero. One private profile for identity, context, permissions, and proof that works across apps, agents, services, and transactions. Built for people and AI.

Prove identity, ownership, and authority once. Connected gates check current state before access, payment, or execution instead of re-proving the same facts every time. Same proof, every surface.

## Install (library)

```bash
npm install @neus/sdk
```

## Connect editors and assistants

No install needed:

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
npx -y -p @neus/sdk neus examples
```

Then ask your assistant: **"Use NEUS before sensitive actions. Reuse my saved proofs, check authority, and keep an audit trail."**

### Or paste this into your agent

Copy the block below into Claude Code, Cursor, Codex, or any coding agent with NEUS MCP. The agent reads it, runs setup, signs you in, and starts carrying your authority.

```text
# NEUS connect in one prompt

You are connecting this editor to NEUS so my identity, provenance, and
authority travel with me. Follow these steps exactly.

## 1. Register NEUS
Run: npx -y -p @neus/sdk neus setup
This installs the public workflow skill and writes MCP config for every
supported host in this project. It does not open a browser.

## 2. Sign in
Run: npx -y -p @neus/sdk neus auth
Or click Connect in the MCP client. Default sign-in is browser OAuth.
No wallet required.

## 3. Confirm the connection
Run: npx -y -p @neus/sdk neus doctor --live
A healthy result confirms the endpoint, auth, and public tools.

## 4. What to do next
After setup, reuse my existing proofs before asking me to verify again.
Before any sensitive action (spend, publish, secrets, agent tool call),
call neus_context once, then neus_proofs_check. Summarize as
NEUS Verify: Passed, Action needed, or Blocked.

Canonical endpoint: https://mcp.neus.network/mcp
Docs: https://docs.neus.network/mcp/setup
```

## Connect an agent to a project

```bash
neus setup
neus mount <agentId> --apply cursor
neus doctor --live
```

Loads the agent's verified identity, scoped authority, and host rules into the project. See [Connect Agent Context](https://docs.neus.network/agents/runtime-mount).

## MCP docs

| Topic | Link |
| ----- | ---- |
| Setup, JSON snippets, and headers | [MCP setup](https://docs.neus.network/mcp/setup) |
| Reuse-first MCP flow | [MCP overview](https://docs.neus.network/mcp/overview) |
| Host action decision | [First guarded action](https://docs.neus.network/mcp/guarded-action) |
| Discovery URLs | [Discovery and endpoints](https://docs.neus.network/mcp/endpoints) |
| Install NEUS | [MCP setup](https://docs.neus.network/mcp/setup) |

Prefer `neus setup` over hand-editing config files so every host stays on **`https://mcp.neus.network/mcp`**.

## What you can ship

- Hosted verification flows that return reusable portable proofs
- Server checks before access, rewards, payments, or actions
- React gates with `VerifyGate`
- Agent identity, controller-approved authority, and per-payment limits
- MCP setup so assistants carry identity, provenance, and authority across editors

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
| `client.getProof()` | Fetch a public proof by `qHash` |
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

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

`neus setup` registers MCP and installs the public workflow skill. It does not open a browser. Click **Connect** in your host or run `neus auth` to sign in. When `NEUS_ACCESS_KEY` is set, setup writes that server credential instead.

For Codex, run `neus setup --client codex`, then `neus auth --client codex`.

No global install? Run `npx -y -p @neus/sdk neus setup` once.

Embed install UX with **`@neus/sdk/mcp-hosts`** (setup commands, deeplinks, host labels).

Claude Code users can install **`neus-mcp@neus`** for a setup shortcut:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-mcp@neus
```

Other hosts: [MCP setup](https://docs.neus.network/mcp/setup).

## Docs

- Quickstart: https://docs.neus.network/quickstart
- JavaScript SDK: https://docs.neus.network/sdks/javascript
- Ownership Basic: https://docs.neus.network/verification/ownership-basic
- Widgets: https://docs.neus.network/widgets/overview
- MCP: https://docs.neus.network/mcp/overview
- API: https://docs.neus.network/api/overview
