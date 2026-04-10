# NEUS Widgets

React components for proof-aware UI.

## React Install

```bash
npm install @neus/sdk react react-dom
```

## VerifyGate

Create mode defaults to **unlisted public** for gate-friendly reuse. Override `proofOptions` when you need listed public or private.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 8453 }
      }}
    >
      <div>Unlocked</div>
    </VerifyGate>
  );
}
```

## ProofBadge

```jsx
import { ProofBadge } from '@neus/sdk/widgets';

<ProofBadge proofId="0x..." showChains />
```

## Docs

- [Widgets Overview](https://docs.neus.network/widgets/overview)
- [Verify Component](https://docs.neus.network/widgets/verifygate)
- [Quickstart](https://docs.neus.network/quickstart)
