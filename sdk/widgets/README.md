# NEUS Widgets (VerifyGate + ProofBadge)

React components for NEUS verification and access gating.

## Install

```bash
npm install @neus/sdk react react-dom
```

## VerifyGate

Gate UI behind verification requirements.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 1 }
      }}
    >
      <div>Unlocked</div>
    </VerifyGate>
  );
}
```

### Key props

- `requiredVerifiers`: `string[]` (default: `['ownership-basic']`)
- `verifierData`: object keyed by verifier id
- `strategy`: `'reuse-or-create' | 'reuse' | 'fresh'` (default: `'reuse-or-create'`)
- `proofOptions`: `{ privacyLevel, publicDisplay, storeOriginalContent, enableIpfs? }` (defaults: private)
- `mode`: `'create' | 'access'` (default: `'create'`)
- `qHash`: string (required for `mode="access"`)

Notes:
- Reuse without prompting can only see **public + discoverable** proofs.
- Reusing private proofs requires an **owner signature** (wallet grants read access).

## ProofBadge

Display verification status by Proof ID (`qHash`).

```jsx
import { ProofBadge } from '@neus/sdk/widgets';

<ProofBadge qHash="0x..." showChains />
```
