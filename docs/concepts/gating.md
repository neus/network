# Access Gating

Protect your application's content or features using **VerifyGate**.

## Overview

Access gating ensures that a user meets specific criteria (owning an NFT, having low risk, being a verified agent) before they can view content or perform an action.

## Proof freshness (real-world behavior)

Many verifiers are **point-in-time snapshots** (for example: NFT ownership, token balances, contract ownership, risk checks). A proof means “this was true when verified”, not “this is true forever”.

To enforce **real-time** checks at the moment of access:

- Use `strategy="fresh"` in UI gates (always create a new proof).
- Or require recent proofs by setting a tight freshness window (for example `maxProofAgeMs` in widgets / SDK-local checks, or `sinceDays` / `since` for `gateCheck`).

## Usage (React)

The `VerifyGate` component handles the entire flow:
1.  Checking if the user already has a valid proof.
2.  Prompting for a signature if they don't.
3.  Verifying the data.
4.  Unlocking the children components.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  // 1. Which verifiers are required?
  requiredVerifiers={['nft-ownership', 'wallet-risk']}
  
  // 2. Data for each verifier
  verifierData={{
    'nft-ownership': {
      contractAddress: '0x...',
      tokenId: '1',
      chainId: 1
    },
    'wallet-risk': {
      walletAddress: userAddress // Pass current user address
    }
  }}
>
  <ProtectedComponent />
</VerifyGate>
```

### Proof visibility (optional)

`VerifyGate` creates private proofs by default. You can override proof options:

```jsx
<VerifyGate
  requiredVerifiers={['nft-ownership']}
  verifierData={{ 'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 1 } }}
  proofOptions={{ privacyLevel: 'public', publicDisplay: true }}
>
  <ProtectedComponent />
</VerifyGate>
```

### Multiple requirements

If you pass multiple `requiredVerifiers`, the component evaluates each requirement. Depending on the verifier set, users may be prompted for more than one signature.

## Strategies

You can control how aggressive the gate is about requiring new proofs.

| Strategy | Behavior | Use Case |
| :--- | :--- | :--- |
| `reuse-or-create` (Default) | Uses an existing valid proof if found. If not, prompts to create one. | Most standard gating. |
| `fresh` | Always forces a new verification signature. | High-security actions (e.g., transfers). |
| `reuse` | Only checks for existing proofs. Does not create new proofs. | Read-only / passive checks, or “reuse-only” flows. |

Notes:

- Existing checks without an owner signature can only reuse **public + discoverable** proofs.
- Reusing **private** proofs requires an **owner signature** (the wallet grants read access).
- For **point-in-time** verifiers, prefer `fresh` (or a tight max age) when the action is security-sensitive (claims, transfers, mints).

## Programmatic Gating (Node.js / Backend)

For server-side routes you have two options:

- **`client.gateCheck()` (recommended)**: calls the HTTP API and returns a **minimal** eligibility response (and optional safe fields). This avoids pulling full proof payloads.
- For “must be true right now” decisions, either:
  - create a new proof via `POST /api/v1/verification` (and poll status), or
  - require recent proofs via `sinceDays` / `since`.
- **`client.checkGate()` (SDK-local)**: evaluates a richer requirements object (TTL, optional requirements, match) against proof records.
  - By default it reuses public/discoverable proofs (`getProofsByWallet`).
  - For private proofs, fetch owner-access proofs via `getPrivateProofsByWallet(...)` and pass them in as `proofs`.

If you need a **non-persistent, server-to-server** decision (no proof minted), use `POST /api/v1/verification/lookup` (Premium API key required). Don’t use lookup mode for “existing proof gating” — that’s what `gateCheck()` is for.

```javascript
const res = await client.gateCheck({
  address: '0x...',
  verifierIds: ['token-holding'],
  contractAddress: '0x...',
  minBalance: '100'
});

if (!res.data?.eligible) {
  throw new Error('Access Denied');
}
```
