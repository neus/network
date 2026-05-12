# ai-content-moderation

Verifies content safety via AI

- **Access:** `public`
- **Category:** `ai`
- **Flow:** `external_lookup`
- **Expiry:** `permanent`
- **Schema:** [./schemas/ai-content-moderation.json](./schemas/ai-content-moderation.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `content` (`string max 13653334`)
- `contentType` (`string enum: image/jpeg, image/png, image/webp, image/gif, text/plain, text/markdown, text/x-markdown, application/json, application/xml`)

### Optional fields

- `provider` (`string enum: google-vision, google-perspective`)

- **Compatible with:** `ownership-basic`, `agent-identity`, `proof-of-human`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'ai-content-moderation',
  data: {
    "content": "Example text for moderation.",
    "contentType": "text/plain",
    "provider": "google-perspective"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "ai-content-moderation"
  ],
  "data": {
    "content": "Example text for moderation.",
    "contentType": "text/plain",
    "provider": "google-perspective"
  },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For hosted-only verifiers, use hosted checkout (`hostedCheckoutUrl`) where applicable.
- Return to the [Verifier Catalog](./README.md).
