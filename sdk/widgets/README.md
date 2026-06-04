# NEUS Widgets

**Proof-aware React components** (VerifyGate, ProofBadge) so your UI can show verified state and gate content **using the same checks your server already trusts** - avoid re-implementing verifier rules only in the browser.

## Install

```bash
npm install @neus/sdk react react-dom
```

## VerifyGate

Create mode opens Hosted Verify. The published gate owns verifier inputs, pricing, and checkout policy.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

export function Page() {
  return (
    <VerifyGate
      gateId="gate_abc123"
    >
      <div>Unlocked</div>
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

- [Widgets Overview](https://docs.neus.network/widgets/overview)
- [Verify Component](https://docs.neus.network/widgets/verifygate)
- [Quickstart](https://docs.neus.network/quickstart)
