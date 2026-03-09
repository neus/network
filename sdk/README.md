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
  content: 'Hello NEUS'
});

// Proof ID (standard). qHash is a deprecated alias.
const proofId = res.proofId;
const status = await client.getStatus(proofId);
```

## Client configuration

```javascript
const client = new NeusClient({
  // Optional: API base URL (default: https://api.neus.network)
  apiUrl: 'https://api.neus.network',
  // Optional: public app attribution ID (non-secret)
  appId: 'neus-network',
  // Optional: request timeout (ms)
  timeout: 30000,
});
```

## Create a proof (server / manual signing)

If you need manual or server-side signing, ask the API for the exact string first and sign that:

```javascript
import { standardizeVerificationRequest, signMessage } from '@neus/sdk';

const provider = window.ethereum; // or any signer/provider supported by signMessage(...)
const walletAddress = '0x1111111111111111111111111111111111111111';
const signedTimestamp = Date.now();
const body = {
  verifierIds: ['ownership-basic'],
  data: {
    owner: walletAddress,
    content: 'Hello NEUS',
    reference: { type: 'url', id: 'https://example.com' }
  },
  walletAddress,
  signedTimestamp,
  chainId: 84532,
};

const standardized = await standardizeVerificationRequest(body, {
  apiUrl: 'https://api.neus.network',
});

const signature = await signMessage({
  provider,
  walletAddress,
  message: standardized.signerString
});

const res = await client.verify({
  ...body,
  signature,
  options: { privacyLevel: 'private' }
});
```

Note: In the NEUS Hub (first-party UI), matching authenticated sessions may allow session-first proof creation without a repeat proof-envelope signature. The SDK examples here document the generic integrator path, which should assume signature-based submissions unless you are explicitly integrating through the hosted session-first flow.

## What verifiers are available?

Use the API directly (avoids drift):

- `GET /api/v1/verification/verifiers`

## App attribution (`appId`)

Set `appId` on the client (or send `X-Neus-App` manually) to attribute usage and analytics to your app. `appId` is a public identifier, not a secret.

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  appId: 'acme-web',
});
```

## Agent verifiers

`agent-identity` and `agent-delegation` support additional optional fields beyond what other verifiers expose:

```javascript
// agent-identity: optional metadata fields
await client.verify({
  verifier: 'agent-identity',
  data: {
    agentId: 'my-agent',
    agentWallet: '0x...',           // universal-address: EVM or Solana
    agentType: 'ai',
    description: 'My AI assistant',
    capabilities: ['web-search'],
    instructions: 'System prompt (max 4000 chars)',
    skills: ['web-search', 'code-execution'],   // max 48, each max 64 chars
    services: [                                  // max 16
      { name: 'metrics', endpoint: 'https://metrics.example.com/v1', version: '1.0' }
    ]
  }
});

// agent-delegation: optional x402 and policy fields
await client.verify({
  verifier: 'agent-delegation',
  data: {
    controllerWallet: '0x...',  // must match signer
    agentWallet: '0x...',
    scope: 'payments:x402',
    permissions: ['execute', 'read'],
    maxSpend: '1000000000000000000',   // decimal wei string
    allowedPaymentTypes: ['x402'],     // auto-set if scope=payments:x402
    receiptDisclosure: 'summary',      // auto-set if scope=payments:x402
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    instructions: 'Policy instructions for the delegated agent (max 4000 chars)',
    skills: ['market-data']
  }
});
```

## Hosted checkout URL builder

Use `getHostedCheckoutUrl` for a single typed entry point:

```javascript
import { getHostedCheckoutUrl } from '@neus/sdk';

const url = getHostedCheckoutUrl({
  gateId: 'my-gate',
  returnUrl: 'https://myapp.com/callback',
  verifiers: ['ownership-social'],
  intent: 'login',  // for auth-code flow
});
// => https://neus.network/verify?gateId=my-gate&returnUrl=...&verifiers=...
```

## Hosted interactive verifiers

For interactive verifiers (`ownership-social`, `ownership-org-oauth`, `proof-of-human`), use `VerifyGate` hosted checkout mode.
These flows require NEUS-hosted popup/redirect UX (OAuth/ZK), not direct wallet-only creation via `client.verify(...)`.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export default function HostedGateExample() {
  return (
    <VerifyGate
      requiredVerifiers={['ownership-social']}
      onVerified={(result) => {
        console.log('Hosted verification complete:', result.proofId);
      }}
    >
      <button>Unlock with Social</button>
    </VerifyGate>
  );
}
```

## Gate checks (recommended for server-side gating)

For production server-side gating, prefer the minimal public endpoint:

```javascript
const res = await client.gateCheck({
  address: 'YOUR_WALLET_OR_DID',
  verifierIds: ['token-holding'],
  contractAddress: '0x...',
  minBalance: '100',
  chainId: 8453,
  // Optional: require a recent proof for point-in-time verifiers (example: last hour)
  since: Date.now() - 60 * 60 * 1000
});

if (!res.data?.eligible) {
  throw new Error('Access denied');
}
```

Note: `gateCheck` evaluates **existing public/discoverable proofs**. For strict real-time decisions, create a new proof via `client.verify(...)` (or `POST /api/v1/verification`) and use the final status.

## Resilience & Polling

The SDK is designed for production stability:

- **Automatic Backoff**: `pollProofStatus()` automatically detects rate limiting (`429`) and applies jittered exponential backoff.
- **Wallet Identification**: Automatically attaches headers to preferred wallet-based limiting for higher reliability behind shared IPs (NATs).

- Private proof by Proof ID: `client.getPrivateStatus(proofId, wallet)`
- Private proofs by wallet/DID: `client.getPrivateProofsByWallet(walletOrDid, { limit, offset }, wallet)` (owner dashboard / first-party UX only; not recommended for integrator gating)
- Revoke your proof: `client.revokeOwnProof(proofId, wallet)`

Example:

```javascript
const privateData = await client.getPrivateStatus(proofId, window.ethereum);

const privateProofs = await client.getPrivateProofsByWallet(
  'YOUR_WALLET_OR_DID',
  { limit: 50, offset: 0 },
  window.ethereum
);

await client.revokeOwnProof(proofId, window.ethereum);
```

Compatibility note: `qHash` remains supported as a deprecated alias (`proofId === qHash`).

## React widgets

For UI gating, see `./widgets/README.md`.

Widget imports:

```javascript
import { VerifyGate, ProofBadge } from '@neus/sdk/widgets';
```

## Reference docs

- API Reference: `../docs/api/README.md`
- OpenAPI (JSON): `../docs/api/public-api.json`
- Auth + Hosted Verify: `../docs/guides/auth-and-hosted-verify.md`
