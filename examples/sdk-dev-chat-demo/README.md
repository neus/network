# SDK dev chat demo

Small **Vite + React** shell: stub chat UI, **`VerifyGate`** on the composer, **`ProofBadge`** in a side column. Use it to iterate on `@neus/sdk` widgets and dev API behavior **outside** the main NEUS app.

## Why this exists

- **Fast loop:** `package.json` pins `@neus/sdk` to `file:../../sdk` so you can change the SDK, rebuild widgets if needed, and refresh the browser.
- **Two modes:** leave `VITE_NEUS_API_URL` unset for an **in-browser mock** (same route shapes as the platform), or set it to your **dev API** for end-to-end checks.
- **Badge focus:** paste any `qHash` or complete the gate; ProofBadge uses `GET /api/v1/proofs/:qHash` on the same API base.

## Run

```bash
cd examples/sdk-dev-chat-demo
npm install
npm run dev
```

`predev` copies shared design tokens to `public/neus-tokens.css` for `mock-checkout.html`.

The bundled **in-browser mock** returns a minimal **verified** payload for any `GET /api/v1/proofs/0x…` that was not created via `POST /api/v1/verification`, so `ProofBadge` still works after the local `mock-checkout.html` handoff (that flow mints a fresh `qHash` without a prior POST). Do not rely on this behavior against real APIs.

### Live / dev API

Create `.env.local` (see variables below) and set your API origin:

```bash
VITE_NEUS_API_URL=https://your-dev-api.example
VITE_NEUS_APP_ID=your-app-id
# Optional — defaults to production hosted verify if omitted:
# VITE_NEUS_HOSTED_CHECKOUT_URL=https://neus.network/verify
```

When `VITE_NEUS_API_URL` is non-empty, the **browser mock is not installed**; all fetches go to that host (CORS must allow the Vite origin).

### `.env.local` variables

| Variable | Purpose |
| --- | --- |
| `VITE_NEUS_APP_ID` | App id passed to VerifyGate (defaults to `sdk-dev-chat-demo`) |
| `VITE_NEUS_API_URL` | If set, disables mock; SDK and ProofBadge use this API base |
| `VITE_NEUS_HOSTED_CHECKOUT_URL` | Hosted verify URL for VerifyGate (local default is same-origin `mock-checkout.html`) |

### Use published SDK instead of the repo copy

In `package.json`, replace the `@neus/sdk` line with a semver range, for example `"@neus/sdk": "^1.0.12"`, then `npm install`.

## What to edit first

- **`src/App.jsx`** — `requiredVerifiers`, `verifierData`, chat stub, layout.
- **`scripts/neus-mock-core.mjs`** — extend mock responses if you need new routes during UI work.

## Related examples

- [trust-receipts-showcase](../trust-receipts-showcase) — full marketplace demo.
- [react-component](../react-component) — minimal VerifyGate-only page.
