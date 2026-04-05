# @neus/sdk

JavaScript SDK for NEUS — verify once, reuse everywhere.

## Install

```bash
npm install @neus/sdk
```

## Quick start

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create a proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

// Save this ID — reuse it anywhere
const proofId = proof.proofId;
```

**No in-app wallet?** Use [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) instead — redirect or popup, no wallet code needed.

## Core methods

| Method | What it does |
|--------|-------------|
| `client.verify()` | Create a proof |
| `client.getStatus()` | Check proof status |
| `client.pollProofStatus()` | Wait for async completion |
| `client.gateCheck()` | Server-side eligibility check |
| `client.checkGate()` | Evaluate requirements against proofs |
| `getHostedCheckoutUrl()` | Generate a hosted verify URL |

## Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network', // default
  appId: 'my-app',                    // links to your platform app
  timeout: 30000,
});
```

## Gate content in React

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate requiredVerifiers={['ownership-basic']}>
  <ProtectedContent />
</VerifyGate>
```

## Check eligibility from your server

```javascript
const result = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});

if (result.data?.eligible) {
  // allow access
}
```

## Documentation

- [Quickstart](https://docs.neus.network/quickstart) — first proof in 5 minutes
- [SDK overview](https://docs.neus.network/sdks/overview) — full SDK guide
- [JavaScript SDK](https://docs.neus.network/sdks/javascript) — detailed reference
- [Widgets](https://docs.neus.network/widgets/overview) — React components
- [API reference](https://docs.neus.network/api/overview) — HTTP endpoints
- [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) — no-code verification UI
