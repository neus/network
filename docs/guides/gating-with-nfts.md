# Gate Content with NFTs

Gate a UI route or API route so only wallets that can prove ownership of a specific NFT token can access it.

## What you’ll use

- **Verifier**: `nft-ownership`
- **Frontend**: `<VerifyGate />`
- **Server-side**: `NeusClient.gateCheck(...)` (minimal eligibility)

## Frontend (React)

`VerifyGate` runs the wallet signature flow and creates the proof when needed.

### Choose freshness (recommended)

NFT ownership is a **point-in-time** verifier: ownership can change at any time. Pick the strategy based on the action:

- **Real-time gating (recommended for claims/mints/transfers):** `strategy="fresh"` so the gate always creates a new proof.
- **Reuse gating (OK for low-risk UI):** keep the default and set a max age (`maxProofAgeMs`) so old proofs don’t grant access indefinitely.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function ExclusiveDrop() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      strategy="fresh"
      verifierData={{
        'nft-ownership': {
          contractAddress: '0x...',
          tokenId: '1',
          chainId: 1,
        },
      }}
    >
      <ClaimButton />
    </VerifyGate>
  );
}
```

## Server-side (Node.js)

Use the gate check endpoint to evaluate eligibility without fetching full proof payloads.

For point-in-time verifiers (NFT/token/contract), **require recency** via `sinceDays`/`since` if you want “must be true now” semantics without creating a new proof.

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

export async function checkAccess(address) {
  const res = await client.gateCheck({
    address,
    verifierIds: ['nft-ownership'],
    contractAddress: '0x...',
    tokenId: '1',
    chainId: 1,
    // Recency requirement (example: last hour)
    since: Date.now() - 60 * 60 * 1000,
  });

  return { access: Boolean(res.data?.eligible) };
}
```

If you need a **hard real-time on-chain check**, create a new proof (`POST /api/v1/verification`) and use the final status for your decision.

## Reference

- Verifier schema: `docs/verifiers/schemas/nft-ownership.json`
- API: `GET /api/v1/proofs/gate/check` and `POST /api/v1/verification`
