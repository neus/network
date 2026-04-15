# React + VerifyGate (Vite)

Save **`proofId`** (receipt id), not raw signatures. Visibility defaults: [Security and trust](https://docs.neus.network/platform/security-and-trust).

```bash
cd examples/react-component
npm install
cp .env.example .env.local   # optional VITE_NEUS_APP_ID
npm run dev
```

This repo uses `file:../../sdk`; in your app: `npm install @neus/sdk react react-dom`.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export default function Page() {
  return (
    <VerifyGate
      appId={import.meta.env.VITE_NEUS_APP_ID}
      requiredVerifiers={['nft-ownership']}
      verifierData={{
        'nft-ownership': {
          contractAddress: '0x...',
          tokenId: '1',
          chainId: 1,
        },
      }}
    >
      <div>…</div>
    </VerifyGate>
  );
}
```

[Get started](https://docs.neus.network/get-started) · [Integration](https://docs.neus.network/integration) · [Quickstart](https://docs.neus.network/quickstart)
