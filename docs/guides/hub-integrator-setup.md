# Hub Integrator Setup

This guide covers the steps for integrators who want to connect their domain or organization to NEUS, issue sponsored verifications, and configure hosted checkout for their users.

## Prerequisites

- A NEUS account with a verified wallet.
- Your integration domain or organization OAuth credentials.
- If you are using hosted auth code exchange, a NEUS-issued partner credential for the server-side `POST /api/v1/auth/code/exchange` route.

---

## 1. Domain Verification

Link your domain to your wallet by setting a DNS TXT record. This establishes a public, on-chain binding between your organization and your domain.

**Step 1:** Add a DNS TXT record at `_neus.<yourdomain.com>` with the value:

```text
neus=<your-wallet-address>
```

**Step 2:** Create a domain proof:

```javascript
const proof = await client.verify({
  verifier: 'ownership-dns-txt',
  data: {
    domain: 'yourdomain.com',
    walletAddress: '0x...',
  },
  walletAddress: '0x...',
  signature: '0x...',
  signedTimestamp: Date.now(),
});
```

**Step 3:** Propagation typically takes minutes. Use `GET /api/v1/proofs/check?verifierIds=ownership-dns-txt&address=0x...` to confirm the proof is active.

---

## 2. Organization OAuth Setup

For organization-level verifications (`ownership-org-oauth`), configure your OAuth provider (Google Workspace, Microsoft 365) in the NEUS environment attached to your deployment.

1. Register the provider credentials for your NEUS deployment or partner workspace.
2. Add `https://api.neus.network/api/v1/auth/oauth/callback/<provider>` to the provider's allowed redirect URIs.
3. Validate provider credentials and redirect URIs in the provider console before going live.

Users complete the OAuth flow via NEUS hosted checkout (see Section 4).

---

## 3. App Linking and Attribution

To track usage per integration and unlock analytics, register your app:

1. Create or obtain an `appId` for your integration.
2. Treat `appId` as a public attribution identifier, not a secret.
3. Include `X-Neus-App: <appId>` on all API requests to attribute verification activity to your app.

```javascript
const client = new NeusClient({ appId: 'your-app-id' });
```

---

## 4. Hosted Checkout for Interactive Verifiers

Interactive verifiers (`ownership-social`, `ownership-org-oauth`, `proof-of-human`) require users to complete a NEUS-hosted flow (popup or redirect). This handles OAuth, ZK passport, and wallet signing without requiring you to integrate provider SDKs directly.

### React (VerifyGate)

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate
  apiUrl="https://api.neus.network"
  hostedCheckoutUrl="https://neus.network/verify"
  requiredVerifiers={['ownership-social']}
  onVerified={(result) => console.log('Verified:', result.proofId)}
>
  <ProtectedContent />
</VerifyGate>
```

### Session-first (lowest friction)

Redirect users to `https://neus.network/verify?intent=login&returnUrl=<your-url>`. After completion, the page returns an auth `code`. Your server exchanges it:

```bash
curl -X POST https://api.neus.network/api/v1/auth/code/exchange \
  -H "Authorization: Bearer <partner-credential>" \
  -H "Content-Type: application/json" \
  -d '{ "code": "<auth-code>" }'
```

Response: session token usable for subsequent API calls without per-request signing.

Operational rule: treat this as a constrained partner flow. It is the intended path for hosted session-first integrations when NEUS has enabled partner credentials for your deployment, but it is not part of the public OpenAPI contract for generic third-party callers.

---

## 5. Sponsor Grants (Covering Verification Costs)

If your integration sponsors verification costs for your users, issue a `X-Sponsor-Grant` capability token from your backend and include it in client-side API calls.

```javascript
// Server-side: issue a sponsor grant via your backend using your NEUS-issued partner credentials
// Client-side: use the issued token
const client = new NeusClient({
  appId: 'your-app-id',
  sponsorGrant: '<sponsor-grant-token>',
});
```

Sponsor grant tokens are short-lived. Re-issue them per session or per verification flow from your backend. Do not embed long-lived API keys in client-side code.

---

## 6. Usage and Analytics

Track usage with your `appId` and NEUS partner reporting. High-signal metrics include:

- Proof creation volume per verifier.
- Gate check counts by app.
- Sponsor grant consumption.

For server-side programmatic usage, the `/api/v1/proofs/check` response includes `matchCount` which you can log and aggregate in your own telemetry.

---

## Related

- [Gating](../concepts/gating.md)
- [Auth and Hosted Verify](./auth-and-hosted-verify.md)
- [API Reference](../api/README.md)
- [Verifier Catalog](../verifiers/README.md)
