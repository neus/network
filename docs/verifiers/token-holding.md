# token-holding

Token holding verification (EVM or Solana)

- **Access:** `public`
- **Category:** `asset`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/token-holding.json](./schemas/token-holding.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `contractAddress` (`string format universal-address`)
- `minBalance` (`string min 1`)

### Optional fields

- `ownerAddress` (`string format universal-address`)
- `chainId` (`integer`)
- `chain` (`string`): CAIP-2 for Solana (e.g. solana:mainnet)
- `blockNumber` (`integer`)

- **Compatible with:** `nft-ownership`, `ownership-basic`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'token-holding',
  data: {
    "ownerAddress": "0x9999999999999999999999999999999999999999",
    "contractAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "minBalance": "100.0",
    "chainId": 84532,
    "blockNumber": 123456
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "token-holding"
  ],
  "data": {
    "ownerAddress": "0x9999999999999999999999999999999999999999",
    "contractAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "minBalance": "100.0",
    "chainId": 84532,
    "blockNumber": 123456
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
