# NEUS SDK

JavaScript client for NEUS verification, proof reuse, and hosted verify handoff.

## Install

```bash
npm install @neus/sdk
```

## Quick Start

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({ apiUrl: 'https://api.neus.network' });

const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS'
});

const proofId = proof.proofId;
const status = await client.getStatus(proofId);
```

## What the SDK Covers

- proof creation
- hosted verify URL generation
- status polling
- gate checks
- optional widget integrations

## Common Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  appId: 'acme-web',
  timeout: 30000,
});
```

## Hosted Verify URL Builder

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  gateId: 'my-gate',
  returnUrl: 'https://myapp.com/callback',
  verifiers: ['ownership-social'],
  intent: 'login',
});
```

## Server-Side Gate Check

```javascript
const res = await client.gateCheck({
  address: 'YOUR_WALLET_OR_DID',
  verifierIds: ['token-holding'],
  contractAddress: '0x...',
  minBalance: '100',
  chainId: 8453,
  since: Date.now() - 60 * 60 * 1000
});
```

## Docs

- [SDK Overview](https://docs.neus.network/sdks/overview)
- [JavaScript SDK](https://docs.neus.network/sdks/javascript)
- [Verification Patterns](https://docs.neus.network/sdks/verifications)
- [Widgets Overview](https://docs.neus.network/widgets/overview)
- [API Overview](https://docs.neus.network/api/overview)
