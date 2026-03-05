# Access Gating

Protect your application's content or features using **VerifyGate**.

## Overview

Access gating ensures that a user meets specific criteria (owning an NFT, having low risk, being a verified agent) before they can view content or perform an action.

## Proof freshness (real-world behavior)

Many verifiers are **point-in-time snapshots** (for example: NFT ownership, token balances, contract ownership, risk checks). A proof means “this was true when verified”, not “this is true forever”.

To enforce **real-time** checks at the moment of access:

- Use `strategy="fresh"` in UI gates (always create a new proof).
- Or require recent proofs by setting a tight freshness window (for example `maxProofAgeMs` in widgets / SDK-local checks, or `sinceDays` / `since` for `gateCheck`).

## Usage (React)

`VerifyGate` can create proofs on demand and unlock content when requirements are satisfied.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  requiredVerifiers={['nft-ownership', 'wallet-risk']}
  verifierData={{
    'nft-ownership': {
      contractAddress: '0x...',
      tokenId: '1',
      chainId: 8453,
    },
    'wallet-risk': {
      walletAddress: userAddress,
    },
  }}
>
  <ProtectedComponent />
</VerifyGate>
```

### Proof visibility (optional)

`VerifyGate` creates private proofs by default. You can override proof options:

```jsx
<VerifyGate
  requiredVerifiers={['nft-ownership']}
  verifierData={{ 'nft-ownership': { contractAddress: '0x...', tokenId: '1', chainId: 8453 } }}
  proofOptions={{ privacyLevel: 'public', publicDisplay: true }}
>
  <ProtectedComponent />
</VerifyGate>
```

### Multiple requirements

If you pass multiple `requiredVerifiers`, the component evaluates each requirement. Depending on the verifier set, users may be prompted for more than one signature.

### Hosted checkout (interactive verifiers)

Interactive verifiers require hosted checkout:

- `ownership-social`
- `ownership-org-oauth`
- `proof-of-human`

These verifiers are completed in the NEUS hosted verification UI. Your app receives a `proofId` when the user finishes.

#### Recommended (React): `VerifyGate` + `onVerified`

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  requiredVerifiers={['ownership-social']}
  onVerified={(result) => {
    console.log('Verified proofId:', result.proofId);
  }}
>
  <ProtectedComponent />
</VerifyGate>
```

Notes:

- If the user blocks popups, they must allow popups for the hosted verification flow.
- `onVerified(...)` receives the `proofId` you can store and use for status checks and gating.
- If you set a custom `apiUrl`, set `hostedCheckoutUrl` explicitly to the hosted verify UI URL.
  Example: `apiUrl="https://api.neus.network"` and `hostedCheckoutUrl="https://neus.network/verify"`.

#### OAuth provider setup (interactive verifiers)

For `ownership-social` and `ownership-org-oauth` to work in production:

- Configure provider console redirect URIs to match your deployed callback route exactly.
  Standard backend callback pattern: `https://api.neus.network/api/v1/auth/oauth/callback/{provider}`.
  **Exception — Telegram:** Telegram does not perform a server redirect. Instead, the widget sends a signed HMAC payload directly to the frontend. No redirect URI is registered in the Telegram Bot console; the bot domain is verified via the server's `TELEGRAM_BOT_TOKEN`.
- **PKCE (X, Google, Microsoft):** PKCE is handled entirely server-side. The `code_verifier` is generated at `/oauth/start` and stored in Redis (10-minute TTL). It is never sent to the browser. If the user waits more than 10 minutes between starting OAuth and completing the exchange, they must restart the flow.
- **OAuth start is POST:** The `/api/v1/auth/oauth/start/{provider}` endpoint is `POST` (not GET). The UI must make a POST request with `{ walletAddress, ... }` body.
- **Callback signal is state-only:** The OAuth callback returns `{ type: 'oauth_success', state }` to the opener via `postMessage` / `BroadcastChannel`. The OAuth code is **never** sent to the browser; the exchange step retrieves it from Redis server-side.
- Ensure your API CORS allowlist includes your app/integrator origins so popup exchange can complete.
- Validate provider credentials and redirect URIs in staging before release (Google, Discord, GitHub, etc.).

## Strategies

You can control how aggressive the gate is about requiring new proofs.

| Strategy | Behavior | Use Case |
| :--- | :--- | :--- |
| `reuse-or-create` (Default) | Uses an existing valid proof if found. If not, prompts to create one. | Most standard gating. |
| `fresh` | Always forces a new verification signature. | High-security actions (e.g., transfers). |
| `reuse` | Only checks for existing proofs. Does not create new proofs. | Read-only / passive checks, or “reuse-only” flows. |

Notes:

- Existing checks without an owner signature can only reuse **public + discoverable** proofs.
- Reusing **private** proofs requires an **owner signature** (the wallet grants read access).
- For **point-in-time** verifiers, prefer `fresh` (or a tight max age) when the action is security-sensitive (claims, transfers, mints).

## Programmatic Gating (Node.js / Backend)

For server-side routes you have two options:

- **`client.gateCheck()` (recommended)**: calls the HTTP API and returns a **minimal** eligibility response (and optional safe fields). This avoids pulling full proof payloads.
- **Policy-based checks**: pass `since` / `sinceDays` when your policy requires recent proof evidence instead of stale snapshots.
- For “must be true right now” decisions, either:
  - create a new proof via `POST /api/v1/verification` (and poll status), or
  - require recent proofs via `sinceDays` / `since`.
- **`client.checkGate()` (SDK-local)**: evaluates a richer requirements object (TTL, optional requirements, match) against proof records.
  - By default it reuses public/discoverable proofs (`getProofsByWallet`).
  - For private proofs, keep integrator responses minimal by using `gateCheck({ includePrivate: true, includeQHashes: true, wallet })` rather than downloading proof payload arrays.

```javascript
const res = await client.gateCheck({
  address: 'YOUR_WALLET_OR_DID',
  verifierIds: ['token-holding'],
  contractAddress: '0x...',
  minBalance: '100',
});

if (!res.data?.eligible) {
  throw new Error('Access denied');
}
```

Reference: **[API Reference](../api/README.md)** and **[Privacy](../PRIVACY.md)**.
