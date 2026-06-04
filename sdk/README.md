# @neus/sdk

Create, check, and reuse NEUS trust receipts from apps and backends. The same package ships the **`neus`** CLI for hosted MCP setup.

NEUS makes trust portable across apps, agents, and ecosystems before access, payment, or action.

Roadmap: [docs.neus.network/platform/status](https://docs.neus.network/platform/status)

## Install (library)

```bash
npm install @neus/sdk
```

## Connect editors and assistants

One command detects your environment and configures hosted MCP for Claude Code, Codex, Cursor, or VS Code.

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Call `neus_context` in your MCP client. For agent workflows, call `neus_agent_link` before assuming identity or delegation is ready.

## MCP docs

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

## Hosted Verify

Use Hosted Verify when you want NEUS to handle the signing/verification flow outside your app UI. Prefer a **published gate**:

```js
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  gateId: 'gate_abc123',
  returnUrl: 'https://yourapp.com/auth/callback'
});

window.location.assign(url);
```

After completion, NEUS redirects back with a `qHash`. Store it with your user or record.

## Advanced: in-app signing

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
      gateId="gate_abc123"
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
  gateId: 'gate_abc123',
  address: '0x...'
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

`neus setup` configures MCP and signs you in: `NEUS_ACCESS_KEY` from the environment when set, otherwise the selected host starts OAuth. Cursor, VS Code, and Claude Code use browser sign-in on NEUS. Pass `--access-key <npk_...>` only to override.

Codex owns its local MCP OAuth session. Use `npx -y -p @neus/sdk neus setup --client codex`, then `npx -y -p @neus/sdk neus auth --client codex`.

Integrators embedding install UX in apps should import **`@neus/sdk/mcp-hosts`** (setup commands, deeplinks, host labels) instead of duplicating strings.

Editors with plugin marketplaces can install **`neus-trust@neus`** for the bundled session workflow. In Claude Code, run `/plugin marketplace add https://github.com/neus/network` and `/plugin install neus-trust@neus` inside chat. Other hosts: [NEUS for AI assistants](https://docs.neus.network/mcp/ide-plugin).

## Docs

- Quickstart: https://docs.neus.network/quickstart
- JavaScript SDK: https://docs.neus.network/sdks/javascript
- Ownership Basic: https://docs.neus.network/verification/ownership-basic
- Widgets: https://docs.neus.network/widgets/overview
- MCP: https://docs.neus.network/mcp/overview
- API: https://docs.neus.network/api/overview
