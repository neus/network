# @neus/sdk

Create, check, and reuse NEUS trust receipts from apps.

NEUS makes trust portable across the internet — so people, apps, and AI agents can prove what is real before access, payout, or execution.

## Install

```bash
npm install @neus/sdk
```

## What you can build

- Issue a proof that a user, wallet, org, app, file, release, profile, or result belongs to someone
- Store the returned `qHash` as a durable trust receipt ID
- Check receipts later for access, eligibility, provenance, or display
- Add proof-gated UX with React widgets
- Connect IDEs and agents through optional MCP

## Fastest path: Hosted Verify

Use Hosted Verify when you want NEUS to handle the signing/verification flow outside your app UI.

```js
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  verifiers: ['ownership-basic'],
  returnUrl: 'https://yourapp.com/neus/callback'
});

window.location.assign(url);
```

After completion, NEUS redirects back with a `qHash`.

Store that `qHash` with your user record.

## Create a signed receipt directly

When your app handles signing.

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
  wallet: window.ethereum
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
      onVerified={(result) => {
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
| `client.getProof()`             | Fetch a proof by `qHash`                    |
| `client.pollProofStatus()`      | Wait for async completion                   |
| `client.gateCheck()`            | Server-side eligibility checks              |
| `client.checkGate()`            | Local preview against already-loaded proofs |
| `client.createWalletLinkData()` | Advanced wallet-link payloads               |

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

## Optional MCP setup

Connect NEUS MCP to IDEs and agents.

```bash
npx -y -p @neus/sdk neus init
```

Add account-aware/private access only when needed:

```bash
npx -y -p @neus/sdk neus auth --access-key <npk_...>
```

Claude Code: add marketplace `https://github.com/neus/network`, install **`neus-mcp@neus`**, then use the same `neus setup` line above for your key — https://docs.neus.network/mcp/claude-code-marketplace

## Docs

- Quickstart: https://docs.neus.network/quickstart
- JavaScript SDK: https://docs.neus.network/sdks/javascript
- Ownership Basic: https://docs.neus.network/verification/ownership-basic
- Widgets: https://docs.neus.network/widgets/overview
- MCP: https://docs.neus.network/mcp/overview
- API: https://docs.neus.network/api/overview
