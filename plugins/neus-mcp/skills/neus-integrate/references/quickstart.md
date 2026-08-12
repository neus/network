# Quickstart reference

Load this file when the developer needs the full placement matrix or framework-specific wiring details.

## Placement matrix

| Path | Where | What you write |
|------|-------|----------------|
| Browser (React) | Frontend component | `<VerifyGate gateId="...">` around protected content |
| Browser (non-React) | Frontend redirect | `getHostedCheckoutUrl({ gateId, returnUrl })` |
| Server | Backend route | `client.gateCheck({ gateId, address })` before granting access |
| Both (full stack) | Frontend + server | VerifyGate on the page + gateCheck on the server |

## Framework wiring

### Next.js App Router

Place `VerifyGate` in a client component:

```tsx
'use client';
import { VerifyGate } from '@neus/sdk/widgets';

export default function ProtectedPage() {
  return (
    <VerifyGate gateId="gate_your-app-name">
      <ProtectedContent />
    </VerifyGate>
  );
}
```

Server check in a route handler or server action:

```ts
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
const result = await client.gateCheck({
  gateId: 'gate_your-app-name',
  address: user.accountAddress,
});
```

### Vite / Create React App

Same component imports. `VerifyGate` works in any React 17+ app.

### Express / Fastify / other server-only

No React needed. Use the redirect flow on the frontend and `gateCheck` on the server:

```js
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();
const result = await client.gateCheck({
  gateId: 'gate_your-app-name',
  address: req.body.address,
});
```

## Gate setup on neus.network

1. Sign in at neus.network.
2. Open profile → Listings.
3. Choose the checks visitors must pass (identity, ownership, human, etc.).
4. Set pricing: you pay by default, or charge visitors.
5. Publish and copy the `gateId`.

The `gateId` is the only thing the app needs. The gate owns the checks, pricing, and sign-in flow.

## VerifyGate props

| Prop | Type | Purpose |
|------|------|---------|
| `gateId` | string | Required. The gate to check against. |
| `children` | ReactNode | Content to render when access is granted. |
| `onVerified` | function | Called with the proof result when access is granted. |
| `onError` | function | Called if the check fails. |
| `strategy` | string | `reuse-or-create` (default), `fresh`, or `reuse`. |
| `mode` | string | `create` (default) or `access`. |

Full reference: [docs.neus.network/widgets/verifygate](https://docs.neus.network/widgets/verifygate)

## NeusClient methods

| Method | Purpose |
|--------|---------|
| `gateCheck({ gateId, address })` | Server-side allow/deny check. The primary enforcement call. |
| `getProof(qHash)` | Fetch a proof by ID. |
| `getProofsByWallet(address)` | List proofs for an address. |
| `getGate(gateId)` | Fetch gate configuration. |
| `getVerifiers()` | List available checks. |

Full reference: [docs.neus.network/sdks/javascript](https://docs.neus.network/sdks/javascript)