# NEUS SDK security notes

Treat **wallet signatures** and **API keys** as secrets. Do not log them, expose them to clients, or store them in analytics.

## Authentication model (public surface)

- **Verification submission** (`POST /api/v1/verification`) is authenticated by a signature over the **NEUS Standard Signing String**.
- **Status by Proof ID (qHash)** (`GET /api/v1/verification/status/{qHash}`) is safe to call publicly.
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

- `privacyLevel: 'private'`
- `publicDisplay: false`
- `storeOriginalContent: false`

“Discoverable” proofs are **public** (`privacyLevel='public'`) and explicitly opted into discovery (`publicDisplay=true`).