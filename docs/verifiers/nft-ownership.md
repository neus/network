# nft-ownership

NFT ownership verification (EVM or Solana)

- **Access:** `public`
- **Category:** `asset`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/nft-ownership.json](./schemas/nft-ownership.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `contractAddress` (`string format universal-address`)
- `tokenId` (`string min 1`)

### Optional fields

- `ownerAddress` (`string format universal-address`)
- `tokenType` (`string enum: erc721, erc1155`)
- `chainId` (`integer`)
- `chain` (`string`): CAIP-2 for Solana (e.g. solana:mainnet)
- `blockNumber` (`integer`)

- **Compatible with:** `token-holding`, `ownership-basic`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'nft-ownership',
  data: {
    "ownerAddress": "0x7777777777777777777777777777777777777777",
    "contractAddress": "0x8888888888888888888888888888888888888888",
    "tokenId": "1234",
    "chainId": 1,
    "blockNumber": 12345678
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "nft-ownership"
  ],
  "data": {
    "ownerAddress": "0x7777777777777777777777777777777777777777",
    "contractAddress": "0x8888888888888888888888888888888888888888",
    "tokenId": "1234",
    "chainId": 1,
    "blockNumber": 12345678
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
