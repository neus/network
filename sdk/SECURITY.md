# NEUS SDK security notes

Treat **wallet signatures** and **API keys** as secrets. Do not log them, expose them to clients, or store them in analytics.

## Authentication model

- **Verification submission** (`POST /api/v1/verification`) is authenticated by a signature over the **NEUS Standard Signing String**.
- **Proof record by receipt ID** is safe to call publicly for public proofs; private proofs return a minimal payload unless the caller is the owner (session or signed headers).
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

## Privacy defaults

Defaults are **private** receipts with **original content stored** (owner-authenticated reads). Integrators see only that content is private and tied to the wallet unless they opt into other modes.

For **reusable gates** and **`gateCheck`** without an owner session, set **unlisted public** explicitly (`privacyLevel: 'public'`, `publicDisplay: false`). Original content still defaults to stored; anyone with the proof id can resolve public proofs—do not treat unlisted as secret.

**Hide original content** (metadata/hash only): set `storeOriginalContent: false` when your product must not persist original bytes.

Controls:

- `privacyLevel` — private (vaulted to the wallet) vs public (eligible for policy checks without owner session)
- `publicDisplay` — discovery vs unlisted
- `storeOriginalContent` — retain original content vs hash/metadata only

Discoverable listings require **`privacyLevel: 'public'`** and **`publicDisplay: true`**.
