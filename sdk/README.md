# @neus/sdk

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF)](https://www.npmjs.com/package/@neus/sdk)

JavaScript SDK for NEUS proof receipts. **Catalog and enforcement** come from the API (`GET /api/v1/verification/verifiers`, `GET /api/v1/proofs/check`, verification writes). Prefer **`gateCheck()`** for allow/deny; **`checkGate()`** is local preview only.

## Install

```bash
npm install @neus/sdk
```

## CLI

```bash
npx -y -p @neus/sdk neus init
```

Prints hosted MCP JSON and doc URLs (stdout only).

## Example

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

const proofId = proof.proofId;

const check = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});
```

> [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) · [Get started](https://docs.neus.network/get-started)

## Core methods

| Method | Purpose |
| --- | --- |
| `client.verify()` | Create proof |
| `client.getProof()` | Fetch by `proofId` |
| `client.pollProofStatus()` | Wait for async completion |
| `client.gateCheck()` | Server eligibility |
| `client.checkGate()` | Local preview |
| `getHostedCheckoutUrl()` | Hosted verify URL |

## VerifyGate

Defaults: unlisted public create (`privacyLevel: 'public'`, `publicDisplay: false`). Set `proofOptions` for other visibility.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate requiredVerifiers={['ownership-basic']}>
  <ProtectedContent />
</VerifyGate>
```

## Config

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  appId: 'my-app',
  timeout: 30000,
});
```

## Docs

- [Quickstart](https://docs.neus.network/quickstart)
- [SDK](https://docs.neus.network/sdks/javascript)
- [Widgets](https://docs.neus.network/widgets/overview)
- [API](https://docs.neus.network/api/overview)
- [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify)
