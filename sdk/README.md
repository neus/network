# @neus/sdk

Create, check, and reuse NEUS trust receipts from apps and backends. The same package ships the **`neus`** CLI for hosted MCP setup and portable agent import.

NEUS makes trust portable across apps, agents, and ecosystems before access, payment, or action.

Roadmap: [docs.neus.network/platform/status](https://docs.neus.network/platform/status)

## Install (library)

```bash
npm install @neus/sdk
```

## Bring Your Own Agent (BYOA)

Already have an agent setup? Use the CLI to package supported local agent context, including instructions, rules, skills, and MCP server references from **OpenClaw, Cursor, Claude Code, and Claude Desktop**:

```bash
npx -y -p @neus/sdk neus import
```

This prepares a local portable-agent manifest. Finish identity and delegation through NEUS MCP with `neus_agent_create` and `neus_agent_link`.

*To check what will be imported without writing changes:*
```bash
npx -y -p @neus/sdk neus import --dry-run
```

## Connect editors and assistants

| Topic                             | Link                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------- |
| Setup, JSON snippets, and headers | [MCP setup](https://docs.neus.network/mcp/setup)                              |
| Tools and session order           | [MCP overview](https://docs.neus.network/mcp/overview)                        |
| Discovery URLs                    | [Discovery and endpoints](https://docs.neus.network/mcp/endpoints)            |
| NEUS for AI assistants          | [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin)          |

Prefer `neus setup` over hand-editing config files so every host stays on **`https://mcp.neus.network/mcp`**.

## What you can ship

- Hosted verification flows that return a reusable receipt
- Server checks before access, rewards, payments, or actions
- React gates with `VerifyGate`
- Agent identity and scoped delegation
- MCP setup for assistants and agent tools

## Fastest path: Hosted Verify

Use Hosted Verify when you want NEUS to handle the signing/verification flow outside your app UI.

```js
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  verifiers: ['ownership-basic'],
  returnUrl: 'https://yourapp.com/auth/callback'
});

window.location.assign(url);
```

After completion, NEUS redirects back with a `qHash`. Store it with your user or record.

## Create a receipt directly

Use this when your app handles signing. This example is EVM. For non-EVM wallets, pass the provider explicitly and include `chain` as a CAIP-2 value.

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({
  appId: 'your-app-id'
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

Use `VerifyGate` when you want a drop-in verification flow in React.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate
      appId="your-app-id"
      requiredVerifiers={['ownership-basic']}
      verifierData={{
        'ownership-basic': {
          owner: '0x...',
          contentType: 'application/json',
          content: JSON.stringify({
            title: 'Verified claim',
            summary: 'Public summary of what is being proven.'
          }),
          reference: {
            type: 'url',
            id: 'https://example.com/source'
          }
        }
      }}
      onVerified={result => {
        console.log(result.qHash || result.qHashes);
      }}
    />
  );
}
```

## Check receipts

Use `gateCheck` from trusted server code when you need allow/deny or eligibility checks.

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({
  appId: 'your-app-id'
});

const result = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic']
});

if (!result.data?.eligible) {
  throw new Error('Access denied');
}
```

Never ship access keys in browser code.

## Core methods

| Method                          | Use it for                                  |
| ------------------------------- | ------------------------------------------- |
| `getHostedCheckoutUrl()`        | Send a user to Hosted Verify                |
| `client.verify()`               | Create a proof                              |
| `client.getProof()`             | Fetch a receipt by `qHash`                  |
| `client.pollProofStatus()`      | Wait for async completion                   |
| `client.gateCheck()`            | Server-side eligibility checks              |
| `client.checkGate()`            | Local preview against already-loaded proofs |
| `client.createWalletLinkData()` | Wallet-link payloads                        |

## Configuration

```js
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  appId: 'your-app-id',
  timeout: 30000
});
```

`appId` is public attribution for your app.
`apiKey` / `npk_*` is optional and server-side only.

## MCP step-by-step

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

Re-sign in or rotate credentials:

```bash
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus auth --access-key <npk_...>   # servers and CI only
```

Editors with plugin marketplaces can install **`neus-trust@neus`** for the bundled session workflow. OpenClaw, Hermes, and other runtimes: see [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin) for exact paths.

## Docs

- Quickstart: https://docs.neus.network/quickstart
- JavaScript SDK: https://docs.neus.network/sdks/javascript
- Ownership Basic: https://docs.neus.network/verification/ownership-basic
- Widgets: https://docs.neus.network/widgets/overview
- MCP: https://docs.neus.network/mcp/overview
- API: https://docs.neus.network/api/overview
