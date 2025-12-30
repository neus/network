# Quickstart

Create a proof, check status, and gate access using the public SDK and API surfaces.

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

Initialize the client in your app. No API keys needed for public verifiers.

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
```

## 3. Verify Something

Let's prove ownership of a piece of content using `ownership-basic`. This will prompt the user's wallet to sign a message.

```javascript
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum
});

// Proof ID (qHash): portable reference you can store and reuse for status checks and gating.
const proofId = proof.qHash;
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
          chainId: 1
        }
      }}
    >
      <div className="exclusive-content">
        Welcome, NFT holder.
      </div>
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
  // Optional: require a recent proof for point-in-time verifiers (example: last hour)
  since: Date.now() - 60 * 60 * 1000
});
```

## What's Next?

- **[Guides](./guides/README.md)** — Use-case walkthroughs.
- **[View Verifier Catalog](./verifiers/README.md)** — Verifier IDs, tiers, and input schemas.
- **[Read API Docs](./api/README.md)** — Deep dive into the HTTP endpoints.
- **[SDK](../sdk/README.md)** — Client usage, configuration, and widgets.
- **[Examples](../examples/README.md)** — Minimal working examples.
