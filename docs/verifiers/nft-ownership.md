# nft-ownership

NFT ownership verification (EVM-only)

- **Access:** `public`
- **Category:** `asset`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/nft-ownership.json](./schemas/nft-ownership.json)

## Required fields

- `contractAddress` (`string format evm-address`)
- `tokenId` (`string min 1`)
- `chainId` (`integer`)

## Optional fields

- `ownerAddress` (`string format evm-address`)
- `tokenType` (`string enum: erc721, erc1155`)
- `blockNumber` (`integer`)

- **Compatible with:** `token-holding`, `ownership-basic`

## Example (schema-validated)

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

// HTTP request envelope
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
  "signature": "0xsignature",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For interactive verifiers, use hosted checkout (`hostedCheckoutUrl`).
- Return to the [Verifier Catalog](./README.md).
