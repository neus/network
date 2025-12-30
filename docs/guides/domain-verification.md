---
description: Bind a domain (DNS TXT) to a wallet and gate access on domain control.
icon: 🌐
---

# Domain verification (DNS TXT)

Bind a domain (e.g. `example.com`) to a wallet by proving control of a DNS TXT record.

## 1) Add the DNS record

Create a TXT record:

- **Host**: `_neus` (or `_neus.<subdomain>`)
- **Value**: your wallet address (`0x...`)

Example for `example.com`: create `_neus.example.com`.

## 2) Create the proof (SDK)

Domain proofs are **point-in-time**: DNS can change. For security-sensitive actions, create a fresh proof (or require recency).

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const proof = await client.verify({
  verifier: 'ownership-dns-txt',
  data: { domain: 'example.com' },
  wallet: window.ethereum
});
```

## 3) Gate or check eligibility

Server-side gate checks (minimal eligibility):

```javascript
const res = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-dns-txt'],
  domain: 'example.com',
  // Recency requirement (example: last hour)
  since: Date.now() - 60 * 60 * 1000,
});
```

## Reference

- Verifier schema: `docs/verifiers/schemas/ownership-dns-txt.json`
