# NEUS SDK security notes

Treat **wallet signatures** and **API keys** as secrets. Do not log them, expose them to clients, or store them in analytics.

## Authentication model

- **Verification submission** (`POST /api/v1/verification`) is authenticated by a signature over the **NEUS Standard Signing String**.
- **Status by proof receipt ID** (`GET /api/v1/verification/status/{qHash}`) is safe to call publicly. `qHash` is the raw HTTP path name for the same receipt.
- **Owner-only reads** of private proof payloads require an additional owner signature. The SDK uses:
  - `x-wallet-address`
  - `x-signature`
  - `x-signed-timestamp`

## Do not

- Do not treat proof signatures as bearer tokens (they are request-bound).
- Do not embed API keys in browser apps. Keep API keys server-side only.
- Do not log or persist:
  - proof signatures
  - API keys
  - third-party auth credentials or provider tokens (if your integration uses them)

## Recommended privacy defaults

- `privacyLevel: 'public'`
- `publicDisplay: false`
- `storeOriginalContent: true`

These are separate controls:

- `privacyLevel` controls access
- `publicDisplay` controls public discovery
- `storeOriginalContent` controls whether original content is stored

Use this as the default for reusable proofs: unlisted, not discoverable. Use `privacyLevel: 'private'` when proof access should stay owner/controller-authorized only.

“Discoverable” proofs are **public** (`privacyLevel='public'`) and explicitly opted into discovery (`publicDisplay=true`).
