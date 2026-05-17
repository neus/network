# wallet-link

Link secondary wallet via signature

- **Access:** `public`
- **Category:** `wallet`
- **Flow:** `instant`
- **Expiry:** `permanent`
- **Schema:** [./schemas/wallet-link.json](./schemas/wallet-link.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `signature` (`string min 1`)
- `signatureMethod` (`string min 1`)
- `signedTimestamp` (`integer`)

### Optional fields

- `primaryAccountId` (`string format caip10-account`)
- `secondaryAccountId` (`string format caip10-account`)
- `primaryChainRef` (`string format caip2-chain`)
- `secondaryChainRef` (`string format caip2-chain`)
- `primaryWalletAddress` (`string format universal-address`)
- `secondaryWalletAddress` (`string format universal-address`)
- `chain` (`string format caip2-chain`)
- `relationshipType` (`string enum: primary, personal, org, affiliate, agent, linked`)
- `label` (`string max 64`)

- **Compatible with:** `contract-ownership`, `ownership-basic`, `wallet-risk`, `agent-identity`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'wallet-link',
  data: {
    "primaryWalletAddress": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "secondaryWalletAddress": "0xcccccccccccccccccccccccccccccccccccccccc",
    "signature": "0xsecondary-signed",
    "chain": "eip155:84532",
    "signatureMethod": "eip191",
    "signedTimestamp": 1700000000000,
    "relationshipType": "linked",
    "label": "alt-wallet"
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "wallet-link"
  ],
  "data": {
    "primaryWalletAddress": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "secondaryWalletAddress": "0xcccccccccccccccccccccccccccccccccccccccc",
    "signature": "0xsecondary-signed",
    "chain": "eip155:84532",
    "signatureMethod": "eip191",
    "signedTimestamp": 1700000000000,
    "relationshipType": "linked",
    "label": "alt-wallet"
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
