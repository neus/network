# Trust receipts showcase (default open-source demo)

A small **trust marketplace** where every card is a real-world outcome, each backed by a NEUS verifier. This is the **default** runnable app in the [neus/network](https://github.com/neus/network) `examples` folder. The **live** product walkthrough is at [neus.network/demo](https://neus.network/demo).

Copy is **outcome-first** (access, roles, rewards, agents). Verifier details stay in the drawer. One receipt model in the browser, on the server, and through **hosted verify** when you have no in-page signer.

## Why this example exists

Most verification products stop at a check.

NEUS turns that check into a reusable **trust receipt** you can hold, look up, and attach to a claim. A marketplace makes the pattern obvious because you already think in “claims”:

- access, rewards, roles, payouts, listings, delegated action

Each card maps one story to one verifier. The UI wires **VerifyGate**; this demo keeps `proofId` in memory only. Persist `onVerified` in a real app.

## Run it

### Local (default: in-browser mock, no second process)

`npm run dev` runs **Vite** only. Before any `VerifyGate` call, `src/neusApiBrowserMock.js` patches `fetch` so `GET/POST` to same-origin `/api/v1/...` is served from an in-memory mock (shared logic with `scripts/neus-mock-core.mjs`).

```bash
cd examples/trust-receipts-showcase
npm install
npm run dev
```

- **Optional — Node mock over HTTP:** `npm run dev:with-mock-server` starts the Node server on `8787` and sets `VITE_NEUS_API_URL=http://127.0.0.1:8787`.
- **Live API:** set `VITE_NEUS_API_URL` (and optionally `VITE_NEUS_HOSTED_CHECKOUT_URL`) in `.env.local`. The in-browser mock is not installed when `VITE_NEUS_API_URL` is set.

Styling uses [`examples/shared/css/neus-tokens.css`](../shared/css/neus-tokens.css) (copied to `public/neus-tokens.css` on prebuild for static `mock-checkout.html`).

## Example

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  appId={import.meta.env.VITE_NEUS_APP_ID || 'local-demo'}
  apiUrl={import.meta.env.VITE_NEUS_API_URL}
  hostedCheckoutUrl={import.meta.env.VITE_NEUS_HOSTED_CHECKOUT_URL}
  requiredVerifiers={['proof-of-human']}
  buttonText="Issue receipt"
>
  <button type="button">Get fair airdrop access</button>
</VerifyGate>
```

## Claim table (verifier IDs in code)

| Outcome (card) | Verifier ID |
| --- | --- |
| Fair airdrop, insider path | `proof-of-human` |
| Creator, domain listing | `ownership-social`, `ownership-dns-txt` |
| Team resource | `ownership-org-oauth` |
| Member / collector / admin | `token-holding`, `nft-ownership`, `contract-ownership` |
| Safe payout (risk) | `wallet-risk` |
| Agents | `agent-identity`, `agent-delegation` |

## `verifierData` and live checks

- Replace **placeholder** contract addresses, amounts, and domains in `src/claims.js` with values your test **signer**, DNS, or org can satisfy, or the issue step will not succeed.
- Shapes for each verifier are the JSON Schemas under `spec/verifiers/schemas/`.

## What to store

Store the returned `proofId` with your claim record. Before prompting again, check whether a valid proof already exists.

A proof ID is a reusable **receipt handle**, not a session token. In production, validate server-side (for example with `gateCheck`).
