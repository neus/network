# Auth + Hosted Verify (Integrator Guide)

NEUS supports a signature-based protocol for proofs, and an optional session layer for first-party browser UX.

This guide explains the **hosted verify** and **session SSOT** behavior that integrators rely on.

---

## 1) Two layers: Protocol signing vs Session (optional)

- **Protocol signing (proofs):** what verifiers require; described in [Signing](../concepts/signing.md).
- **Session (`/api/v1/auth/*`):** optional convenience layer to reduce repeated prompts and provide a "who am I" endpoint for apps.

**Important:** Using a session does not change the signing contract.

---

## 2) Hosted Verify UX (Passkey or Wallet)

When a flow requires human interaction (signature, OAuth linking, proof creation), NEUS provides a hosted UI.

- Users can **sign in with a passkey** (no wallet extension required) **or connect a wallet**.
- After completion, the hosted UI returns the user to your app (by redirect or popup completion signaling depending on integration).

This is used by:

- the SDK widgets (VerifyGate / hosted checkout)
- the MCP server (`hostedVerifyUrl` during elicitation)

See also:

- [MCP guide](./mcp.md)
- [Access gating](../concepts/gating.md)

### Standardized hosted login URL

```text
/verify?intent=login
```

Use these query params:

- `returnTo=/profile` for first-party NEUS app routing only. This must stay same-origin and relative.
- `returnUrl=https://partner.example/callback` for integrator completion. This is the partner-controlled redirect target.
- `mode=popup&origin=https://partner.example` when using a popup flow that should `postMessage` back to the opener.

Do not invent a second hosted login route. `intent=login` on `/verify` is the canonical surface.

---

## 3) Session SSOT: `GET /api/v1/auth/me`

If you use the session layer, treat `GET /api/v1/auth/me` as the **single source of truth** for:

- whether the user is authenticated
- the user's identity pack (subjectId/did/address)
- onboarding readiness (if provided by the deployment)
- linked accounts / factor summary (if enabled by the deployment)

Integrators can either:

- rely purely on proof verification (no session required), or
- use the session SSOT to drive a first-party product UX.

Current hosted login routing contract:

- `authenticated: false` means keep the hosted login choices visible.
- `authenticated: true` with `needsOnboarding: true` means route the user into `/genesis/profile`.
- `authenticated: true` with `needsOnboarding: false` means route the user into `returnTo` when valid, otherwise the owner fallback.
- Integrator `returnUrl` or popup completion only happens after `/auth/me` confirms an active session and NEUS issues a one-time auth code.

### Outage contract for interactive auth BFF routes

The browser-facing NEUS BFF routes normalize upstream outages so integrators do not need route-specific recovery logic.

- Interactive auth routes return `503` for upstream `5xx` or transport timeouts.
- They include `Retry-After: 10`.
- They include `X-Neus-Upstream-Status` for diagnostics.
- They set `Cache-Control: no-store`.
- Session cookies are only set when the attestation response succeeds.

This applies to:

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/passkey/*`
- `POST /api/v1/auth/oauth/start/:provider`

---

## 4) Hosted checkout URL configuration

If you run the NEUS API at a custom `apiUrl`, also set the hosted verify URL explicitly.

Example (React):

```jsx
<VerifyGate
  apiUrl="https://api.neus.network"
  hostedCheckoutUrl="https://neus.network/verify"
  requiredVerifiers={["ownership-basic"]}
>
  <Protected />
</VerifyGate>
```

Notes:

- Hosted verify must be same-origin with its own passkey RP ID/origin configuration.
- If your integration uses popups, your app must allow popups for the hosted domain.

## 5) Popup completion signaling

For popup login flows, the hosted window posts a completion message back to the opener after the session is confirmed.

- Message type: `neus_login_complete`
- Delivery: `window.opener.postMessage(...)`
- Origin: restricted to the supplied `origin` when it is an absolute HTTP(S) origin, otherwise the hosted page origin

Integrators should treat popup completion as a signal to refresh their local auth state, then redeem the one-time code if their flow uses a code exchange.
