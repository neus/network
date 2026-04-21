# contract-ownership

Verifies smart contract ownership (EVM chains)

- **Access:** `public`
- **Category:** `ownership`
- **Flow:** `external_lookup`
- **Expiry:** `point_in_time`
- **Schema:** [./schemas/contract-ownership.json](./schemas/contract-ownership.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `contractAddress` (`string format evm-address`)
- `chainId` (`integer`)

### Optional fields

- `walletAddress` (`string format evm-address`)
- `method` (`string enum: owner, admin, accessControl`)

- **Compatible with:** `wallet-link`, `wallet-risk`, `agent-identity`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'contract-ownership',
  data: {
    "contractAddress": "0x5555555555555555555555555555555555555555",
    "chainId": 1,
    "walletAddress": "0x6666666666666666666666666666666666666666",
    "method": "owner"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "contract-ownership"
  ],
  "data": {
    "contractAddress": "0x5555555555555555555555555555555555555555",
    "chainId": 1,
    "walletAddress": "0x6666666666666666666666666666666666666666",
    "method": "owner"
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
