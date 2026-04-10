# ai-content-moderation

Verifies content safety via AI

- **Access:** `public`
- **Category:** `ai`
- **Flow:** `external_lookup`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ai-content-moderation.json](./schemas/ai-content-moderation.json)

## Required fields

- `content` (`string max 13653334`)
- `contentType` (`string enum: image/jpeg, image/png, image/webp, image/gif, text/plain, text/markdown, text/x-markdown, application/json, application/xml`)

## Optional fields

- `provider` (`string enum: google-vision, google-perspective`)

- **Compatible with:** `ownership-basic`, `agent-identity`, `proof-of-human`

## Example (schema-validated)

```javascript
await client.verify({
  verifier: 'ai-content-moderation',
  data: {
    "content": "Hello NEUS",
    "contentType": "text/plain",
    "provider": "google-perspective"
  }
});

// HTTP request envelope
{
  "verifierIds": [
    "ai-content-moderation"
  ],
  "data": {
    "content": "Hello NEUS",
    "contentType": "text/plain",
    "provider": "google-perspective"
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0xsignature",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For verifiers with `supportsDirectApi: false` in the public catalog, use hosted checkout (`hostedCheckoutUrl`) for the linked-check step.
- Return to the [Verifier Catalog](./README.md).
