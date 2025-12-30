# Quickstart

## Pick your path

<table data-view="cards">
  <thead>
    <tr>
      <th></th>
      <th></th>
      <th data-hidden data-card-target data-type="content-ref"></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SDK proof (this page)</strong></td>
      <td>Create a proof via wallet signature and poll status.</td>
      <td><a href="./QUICKSTART.md">./QUICKSTART.md</a></td>
    </tr>
    <tr>
      <td><strong>VerifyGate widget</strong></td>
      <td>Drop-in React gating with freshness controls.</td>
      <td><a href="../sdk/widgets/README.md">../sdk/widgets/README.md</a></td>
    </tr>
    <tr>
      <td><strong>HTTP examples</strong></td>
      <td>Minimal curl / Node.js examples for server integrations.</td>
      <td><a href="../examples/README.md">../examples/README.md</a></td>
    </tr>
  </tbody>
</table>

## 1. Install SDK

```bash
npm install @neus/sdk
```

## 2. Create a Client

Initialize the client in your app. Public verifiers do not require API keys.

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
```

## 3. Verify Something

Create a content authorship proof using `ownership-basic`. This prompts the user’s wallet to sign a request-bound message.

```javascript
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

const qHash = proof.qHash; // Proof ID (qHash)
```

## 3b. Poll status (when verifiers run async)

Some verifiers complete instantly; others return `202` and finish asynchronously. Poll until terminal status:

```javascript
const final = await client.pollProofStatus(qHash, { interval: 3000, timeout: 60000 });
console.log(final.status);
```

## 4. Gate Your UI

Use the React component to show content only to verified users.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export default function ProtectedPage() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': {
          contractAddress: '0x...',
          tokenId: '1',
          chainId: 1,
        },
      }}
    >
      <div>Access granted.</div>
    </VerifyGate>
  );
}
```

## 5. Server-side gating (minimal eligibility)

For backend/server checks, prefer a gate check (minimal yes/no, no full proof payloads):

```javascript
const result = await client.gateCheck({
  address: '0x...',
  verifierIds: ['token-holding'],
  contractAddress: '0x...',
  minBalance: '100',
  chainId: 1,
  // Optional: recency requirement for point-in-time verifiers (example: last hour)
  since: Date.now() - 60 * 60 * 1000,
});
```

## What's Next?

- **[Guides](./guides/README.md)** — Use-case walkthroughs.
- **[View Verifier Catalog](./verifiers/README.md)** — Verifier IDs, tiers, and input schemas.
- **[Read API Docs](./api/README.md)** — Deep dive into the HTTP endpoints.
- **[SDK](../sdk/README.md)** — Client usage, configuration, and widgets.
- **[Examples](../examples/README.md)** — Minimal working examples.
