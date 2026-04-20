# NEUS SDK security notes

Treat **wallet signatures** and **API keys** as secrets. Do not log them, expose them to clients, or store them in analytics.

## Authentication model

- **Verification requests** are authenticated with a wallet signature over the **CAIP-380 Portable Proof** six-line signing string. Never roll your own message format in production—use the SDK or the hosted preparation step documented for HTTP integrations.
- **Proof lookups by `proofId`** are safe for public proofs. Private proofs return a minimal payload unless the caller proves ownership (authenticated owner or signed request).
- **Owner-only reads** of private proof payloads require an extra owner-signed request. The SDK attaches the required signed headers for you.

## Do not

- Do not treat proof signatures as bearer tokens (they are request-bound).
- Do not embed API keys in browser apps. Keep API keys server-side only.
- Do not log or persist proof signatures, API keys, or third-party auth credentials (if your integration uses them).

## Privacy defaults

**`client.verify()`** defaults to **private** stored results with **original content stored** (owner-authenticated reads).

**`VerifyGate`** create mode defaults to **unlisted public** (`privacyLevel: 'public'`, `publicDisplay: false`, `storeOriginalContent: true`) so gates and `gateCheck` work without extra options.

For raw SDK flows that must power **`gateCheck`** without owner-authenticated access, set **unlisted public** explicitly (`privacyLevel: 'public'`, `publicDisplay: false`). Anyone with the proof id can resolve public proofs. Do not treat unlisted as secret.

**Hide original content** (metadata/hash only): set `storeOriginalContent: false` when your product must not persist original bytes.

Controls:

- `privacyLevel` - private (vaulted to the wallet) vs public (eligible for policy checks without proving owner identity)
- `publicDisplay` - discovery vs unlisted
- `storeOriginalContent` - retain original content vs hash/metadata only

Discoverable listings require **`privacyLevel: 'public'`** and **`publicDisplay: true`**.
