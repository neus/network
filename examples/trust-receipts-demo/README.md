# Trust receipts demo

NEUS turns trust decisions into reusable **trust receipts** you can hold, look up, and attach to a claim. This demo uses `VerifyGate` to issue receipts in the browser. In a real app, persist the returned **receipt ID** (`qHash`) in your own record and validate it server-side.

## Run it locally

```bash
cd examples/trust-receipts-demo
npm install
npm run dev
```

By default this runs Vite with an in-browser mock of the NEUS API, so you can explore the flow without a backend.

- **Mock over HTTP:** `npm run dev:with-mock-server` starts a Node mock server on `8787`.
- **Live API:** set `VITE_NEUS_API_URL` (and optionally `VITE_NEUS_HOSTED_CHECKOUT_URL`) in `.env.local`. The mock is disabled when `VITE_NEUS_API_URL` is set.

Styling uses [`docs/neus-tokens.css`](../../docs/neus-tokens.css).

## Example

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  apiUrl={import.meta.env.VITE_NEUS_API_URL}
  hostedCheckoutUrl={import.meta.env.VITE_NEUS_HOSTED_CHECKOUT_URL}
  gateId="gate_fair-airdrop"
  buttonText="Issue receipt"
>
  <button type="button">Get fair airdrop access</button>
</VerifyGate>
```

## Verifiers used in the demo

| Card | Verifier |
| ---- | --------- |
| Fair airdrop, insider path | `proof-of-human` |
| Creator, domain listing | `ownership-social`, `ownership-dns-txt` |
| Team resource | `ownership-org-oauth` |
| Member / collector / admin | `token-holding`, `nft-ownership`, `contract-ownership` |
| Safe payout (risk) | `wallet-risk` |
| Agents | `agent-identity`, `agent-delegation` |

## Use real gates

Publish gates in [Hub](https://neus.network/hub) and pass their real `gateId` into `VerifyGate` and `gateCheck`. The demo uses sample gate ids derived from each claim; replace them before connecting to the live API.

## Store the receipt

Store the returned **receipt ID** (`qHash`) with your claim record. Before prompting the user again, check whether a valid proof already exists.

A receipt ID is a reusable receipt handle, not a session token. In production, validate it server-side, for example with `gateCheck`.
