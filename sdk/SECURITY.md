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

**`client.verify()`** defaults to **private**.

**`VerifyGate`** create mode also defaults to **private**.

Use public visibility only when you intentionally need proof reuse without owner-authenticated access:

- unlisted public: `privacyLevel: 'public'`, `publicDisplay: false`
- listed public: `privacyLevel: 'public'`, `publicDisplay: true`

Do not treat unlisted public proofs as secret.

`storeOriginalContent` is an advanced storage control. Most integrations should leave the default as-is.

Controls:

- `privacyLevel` - private by default; switch to public only for intentional public reuse
- `publicDisplay` - discovery vs unlisted
- `storeOriginalContent` - advanced content-storage control

Discoverable listings require **`privacyLevel: 'public'`** and **`publicDisplay: true`**.
