# @neus/sdk

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF)](https://www.npmjs.com/package/@neus/sdk)

**Ship proof checks in production without hosting your own verification service.** The JavaScript SDK wraps NEUS proof creation, polling, and **server-side eligibility** (`gateCheck`) so your app stores a **`proofId`** once and reuses it across flows.

**Why this matters:** NEUS runs the verifier checks. You integrate once; when verifier rules or partners change, you are not forking a second copy into your codebase.

## Install

```bash
npm install @neus/sdk
```

## One-command onboarding

```bash
npx -y -p @neus/sdk neus init
```

Prints the hosted MCP URL and documentation links in your terminal—fast setup in IDEs and agent clients.

## Minimal working example

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
| `client.gateCheck()` | **Server eligibility** (use for real gates) |
| `client.checkGate()` | Local preview only |
| `getHostedCheckoutUrl()` | Hosted verify URL |

## VerifyGate (React)

Defaults: unlisted public create (`privacyLevel: 'public'`, `publicDisplay: false`). Set `proofOptions` for other visibility.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate appId="your-app-id" requiredVerifiers={['ownership-basic']}>
  <ProtectedContent />
</VerifyGate>
```

[Widgets README](./widgets/README.md)

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
