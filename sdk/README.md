# NEUS SDK

JavaScript client for NEUS verification.

## Install

```bash
npm install @neus/sdk
```

## Quick Start

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create a proof
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

const proofId = proof.proofId;
```

## Key Methods

| Method | Purpose |
|--------|---------|
| `client.verify()` | Create a proof |
| `client.pollProofStatus()` | Check async status |
| `client.gateCheck()` | Server-side eligibility |
| `getHostedCheckoutUrl()` | Generate hosted URL |

## Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  appId: 'my-app',
  timeout: 30000,
});
```

## Hosted Verify

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  verifiers: ['ownership-basic'],
  mode: 'popup',
  origin: window.location.origin,
  returnUrl: 'https://myapp.com/callback',
  intent: 'login',
});
```

- [Get started](https://docs.neus.network/get-started) (platform, app, credits)
- [Choose your path](https://docs.neus.network/choose-an-integration-path)
- [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify)

## Gate Check

```javascript
const result = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});
```

## Documentation

- [Get started](https://docs.neus.network/get-started)
- [SDK Overview](https://docs.neus.network/sdks/overview)
- [JavaScript SDK](https://docs.neus.network/sdks/javascript)
- [Widgets](https://docs.neus.network/widgets/overview)
- [API Reference](https://docs.neus.network/api/overview)