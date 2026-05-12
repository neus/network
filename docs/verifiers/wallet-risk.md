# wallet-risk

Wallet risk assessment

- **Access:** `public`
- **Category:** `wallet`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/wallet-risk.json](./schemas/wallet-risk.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `walletAddress` (`any`)

### Optional fields

- `provider` (`string enum: webacy`)
- `chain` (`string enum: eth, base, bsc, pol, opt, arb, sol, ton, sei, sui, btc, stellar`)
- `chainId` (`integer`)

- **Compatible with:** `ownership-basic`, `proof-of-human`, `agent-identity`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'wallet-risk',
  data: {
    "walletAddress": "0xdddddddddddddddddddddddddddddddddddddddd",
    "provider": "webacy",
    "chainId": 8453,
    "includeDetails": true
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "wallet-risk"
  ],
  "data": {
    "walletAddress": "0xdddddddddddddddddddddddddddddddddddddddd",
    "provider": "webacy",
    "chainId": 8453,
    "includeDetails": true
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
