# @neus/sdk

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF)](https://www.npmjs.com/package/@neus/sdk)

**Verify once. Prove everywhere.** JavaScript SDK for portable proof receipts.

## Install

```bash
npm install @neus/sdk
```

## 30-second example

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create a proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

// Save this — reuse it everywhere
const proofId = proof.proofId;

// Check eligibility from anywhere
const check = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});
// check.data.eligible → true/false
```

> **No wallet?** Use [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) — redirect or popup, zero wallet code.

## Core methods

| Method | What it does |
|--------|-------------|
| `client.verify()` | Create a proof |
| `client.getStatus()` | Check proof status |
| `client.pollProofStatus()` | Wait for async completion |
| `client.gateCheck()` | Server-side eligibility check |
| `client.checkGate()` | Evaluate requirements against proofs |
| `getHostedCheckoutUrl()` | Generate a hosted verify URL |

## Gate content in React

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate requiredVerifiers={['ownership-basic']}>
  <ProtectedContent />
</VerifyGate>
```

## Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network', // default
  appId: 'my-app',                    // links to your platform app
  timeout: 30000,
});
```

## Docs

- [**Quickstart**](https://docs.neus.network/quickstart) — first proof in 5 minutes
- [**SDK guide**](https://docs.neus.network/sdks/javascript) — full reference
- [**Widgets**](https://docs.neus.network/widgets/overview) — React components
- [**API reference**](https://docs.neus.network/api/overview) — HTTP endpoints
- [**Hosted Verify**](https://docs.neus.network/cookbook/auth-hosted-verify) — no-code verification UI
