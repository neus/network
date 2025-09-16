# Social Traits

What it proves
- Links a wallet to a social account (Discord, GitHub, X, Google) and extracts non-PII traits. Designed for trait verification, not real-world identity.

Supported flows
- Internal Social Token Flow: internalSocialToken + walletAddress
- Pre-authorized Token Flow: accessToken + walletAddress
- OAuth Code Flow: oauthCode + redirectUri

Inputs (normalized)
- provider: 'discord' | 'github' | 'x' | 'google'
- One of:
  - internalSocialToken + walletAddress
  - accessToken + walletAddress
  - oauthCode + redirectUri (+ walletAddress)

Outputs
- qHash proof and data: { provider, socialUserId, walletAddress, traits, linkTimestamp }

Privacy
- Traits are provider-derived, intended to avoid PII by default. Do not publish raw provider tokens.

High‑value use cases
- Reputation‑aware access (bot resistance without PII)
- Contributor discovery and role auto‑assignment
- Trait‑based personalization and rate limiting

SDK sketch
```javascript
const result = await client.verify({
  verifier: 'ownership-social',
  data: { provider: 'discord', internalSocialToken, walletAddress }
});
```

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
