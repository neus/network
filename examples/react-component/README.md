# React + VerifyGate (Vite)

**Drop a gate around any React surface** - claims, premium content, admin tools - without hand-rolling wallet modals and verifier-specific forms. Users who pass get a **`proofId`**: **store it**, then **`gateCheck`** or **`VerifyGate`** for that policy - a proof id is **not** a session token or bearer credential.

Visibility defaults: [Security and trust](https://docs.neus.network/platform/security-and-trust).

```bash
cd examples/react-component
npm install
cp .env.example .env.local   # optional VITE_NEUS_APP_ID
npm run dev
```

In this examples repo the SDK is linked locally; in your own app run `npm install @neus/sdk react react-dom`.

`src/index.css` imports tokens from [`examples/shared/css/neus-tokens.css`](../../shared/css/neus-tokens.css).

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

[Get started](https://docs.neus.network/get-started) | [Integration](https://docs.neus.network/integration) | [Quickstart](https://docs.neus.network/quickstart)
