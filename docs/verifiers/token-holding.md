# token-holding

Token holding verification (EVM or Solana)

- **Access:** `public`
- **Category:** `asset`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/token-holding.json](./schemas/token-holding.json)

## Required fields

- `contractAddress` (`string format universal-address`)
- `minBalance` (`string min 1`)

## Optional fields

- `ownerAddress` (`string format universal-address`)
- `chainId` (`integer`)
- `chain` (`string`): CAIP-2 for Solana (e.g. solana:mainnet)
- `blockNumber` (`integer`)

- **Compatible with:** `nft-ownership`, `ownership-basic`

## Example (schema-validated)

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

// HTTP request envelope
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
  "signature": "0xsignature",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For interactive verifiers, use hosted checkout (`hostedCheckoutUrl`).
- Return to the [Verifier Catalog](./README.md).
