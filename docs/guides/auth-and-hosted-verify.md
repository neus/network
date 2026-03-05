# Auth + Hosted Verify (Integrator Guide)

NEUS supports a signature-based protocol for proofs, and an optional session layer for first-party browser UX.

This guide explains the **hosted verify** and **session SSOT** behavior that integrators rely on.

---

## 1) Two layers: Protocol signing vs Session (optional)

- **Protocol signing (proofs):** what verifiers require; described in [Signing](../concepts/signing.md).
- **Session (`/api/v1/auth/*`):** optional convenience layer to reduce repeated prompts and provide a “who am I” endpoint for apps.

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

---

## 3) Session SSOT: `GET /api/v1/auth/me`

If you use the session layer, treat `GET /api/v1/auth/me` as the **single source of truth** for:

- whether the user is authenticated
- the user’s identity pack (subjectId/did/address)
- onboarding readiness (if provided by the deployment)
- linked accounts / factor summary (if enabled by the deployment)

Integrators can either:
- rely purely on proof verification (no session required), or
- use the session SSOT to drive a first-party product UX.

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

