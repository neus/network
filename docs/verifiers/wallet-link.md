# wallet-link

Link secondary wallet via signature

- **Access:** `public`
- **Category:** `wallet`
- **Flow:** `instant`
- **Expiry:** `permanent`
- **Schema:** [./schemas/wallet-link.json](./schemas/wallet-link.json)

## Required fields

- `primaryWalletAddress` (`string format universal-address`)
- `secondaryWalletAddress` (`string format universal-address`)
- `signature` (`string min 1`)
- `chain` (`string format caip2-chain`)
- `signatureMethod` (`string min 1`)
- `signedTimestamp` (`integer`)

## Optional fields

- `relationshipType` (`string enum: primary, personal, org, affiliate, agent, linked`)
- `label` (`string max 64`)

- **Compatible with:** `contract-ownership`, `ownership-basic`, `wallet-risk`, `agent-identity`

## Example (schema-validated)

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

// HTTP request envelope
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
  "signature": "0xsignature",
  "signedTimestamp": 1700000000000,
  "chainId": 84532
}
```

## Next steps

- Use this verifier in `requiredVerifiers` for `VerifyGate` or in `verifierIds` for API gate checks.
- For interactive verifiers, use hosted checkout (`hostedCheckoutUrl`).
- Return to the [Verifier Catalog](./README.md).
