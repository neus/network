# NEUS Widgets

React components for proof-aware UI and a standalone script-tag badge for simple pages.

## React Install

```bash
npm install @neus/sdk react react-dom
```

## VerifyGate

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

## Script Tag Badge

```html
<script src="https://verify.neus.network/widget.js"></script>
<div data-neus-proof="0xYOUR_PROOF_ID"></div>
```

## Docs

- [Widgets Overview](https://docs.neus.network/widgets/overview)
- [VerifyGate Component](https://docs.neus.network/widgets/verifygate)
- [Quickstart](https://docs.neus.network/quickstart)
