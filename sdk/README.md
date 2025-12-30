# NEUS SDK

JavaScript client (and optional widgets) for the NEUS Network verification API.

## Install

```bash
npm install @neus/sdk
```

## Create a proof (browser wallet flow)

This path requests a wallet signature in the browser and submits the verification request:

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient({ apiUrl: 'https://api.neus.network' });

const res = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum
});

// Proof ID (qHash): stable identifier you can store and use for status polling
const proofId = res.qHash;
const status = await client.getStatus(proofId);
```

## Client configuration

```javascript
const client = new NeusClient({
  // Optional: point at a self-hosted deployment
  apiUrl: 'https://api.neus.network',
  // Optional: request timeout (ms)
  timeout: 30000,
  // Optional: server-side enterprise API key for higher limits on eligible endpoints
  // (Do not embed API keys in browser apps.)
  apiKey: process.env.NEUS_API_KEY
});
```

## Create a proof (server / manual signing)

If you already have a signature over the NEUS Standard Signing String, submit it directly:

```javascript
const res = await client.verify({
  verifierIds: ['ownership-basic'],
  data: {
    owner: '0x1111111111111111111111111111111111111111',
    content: 'Hello NEUS',
    reference: { type: 'url', id: 'https://example.com' }
  },
  walletAddress: '0x1111111111111111111111111111111111111111',
  signature: '0x...',
  signedTimestamp: Date.now(),
  chainId: 84532,
  options: { privacyLevel: 'private' }
});
```

## What verifiers are available?

Use the API directly (avoids drift):

- `GET /api/v1/verification/verifiers`

## Gate checks (recommended for server-side gating)

For production server-side gating, prefer the minimal public endpoint:

```javascript
const res = await client.gateCheck({
  address: '0x...',
  verifierIds: ['token-holding'],
  contractAddress: '0x...',
  minBalance: '100',
  chainId: 1,
  // Optional: require a recent proof for point-in-time verifiers (example: last hour)
  since: Date.now() - 60 * 60 * 1000
});

if (!res.data?.eligible) {
  throw new Error('Access denied');
}
```

Note: `gateCheck` evaluates **existing public/discoverable proofs**. For strict real-time decisions, create a new proof via `client.verify(...)` (or `POST /api/v1/verification`) and use the final status.

## Lookup mode (Premium, server-side only; non-persistent)

If you need a **real-time assessment** without minting/storing proofs (no `qHash`), use lookup mode:

- **Endpoint:** `POST /api/v1/verification/lookup`
- **Auth:** `Authorization: Bearer sk_live_...` (or `sk_test_...`)
- **Semantics:** runs `external_lookup` verifiers only; **does not** create a proof record

Note: lookup mode is deployment-dependent and is not part of the stable public integrator OpenAPI (`docs/api/public-api.json`).

```javascript
const res = await client.lookup({
  // Premium API key (keep server-side only)
  apiKey: process.env.NEUS_API_KEY,
  verifierIds: ['wallet-risk'],
  targetWalletAddress: '0x...',
  data: { chainId: 1 }
});

if (!res.data?.verified) {
  throw new Error('Rejected');
}
```

Note: `gateCheck()` and `lookup()` are different tools.
- Use **`gateCheck()`** when you want to gate based on **existing public/discoverable proofs** (fast, minimal response).
- Use **`lookup()`** when you want a **fresh, non-persistent** decision (typically billable in hosted deployments).
- Only combine them if you are intentionally doing a cache-first strategy (gate-check first to avoid unnecessary lookups).

## Private proof reads (owner)

- Private proof by Proof ID (qHash): `client.getPrivateStatus(qHash, wallet)`
- Private proofs by wallet/DID: `client.getPrivateProofsByWallet(walletOrDid, { limit, offset }, wallet)`

## React widgets

For UI gating, see `./widgets/README.md`.

Widget imports:

```javascript
import { VerifyGate, ProofBadge } from '@neus/sdk/widgets';
```

## Reference docs

- API Reference: `../docs/api/README.md`
- OpenAPI (JSON): `../docs/api/public-api.json`
