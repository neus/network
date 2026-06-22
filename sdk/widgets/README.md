# NEUS Widgets

React components that show verified state and gate content with the same trust receipts your server checks.

## Install

```bash
npm install @neus/sdk react react-dom
```

## VerifyGate

`VerifyGate` opens Hosted Verify when a user needs a receipt. The published gate owns verifier inputs, pricing, and checkout policy.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate gateId="gate_your-app-name">
      <div>Unlocked content</div>
    </VerifyGate>
  );
}
```

## ProofBadge

```jsx
import { ProofBadge } from '@neus/sdk/widgets';

<ProofBadge qHash={proof.qHash} showChains />
```

## Docs

- [Widgets overview](https://docs.neus.network/widgets/overview)
- [VerifyGate](https://docs.neus.network/widgets/verifygate)
- [Quickstart](https://docs.neus.network/quickstart)
