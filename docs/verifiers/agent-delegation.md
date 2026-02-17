# agent-delegation

Delegates authority to an agent, ERC-8004 compatible

- **Access:** `public`
- **Category:** `agent`
- **Flow:** `instant`
- **Expiry:** `expiring`
- **Schema:** [./schemas/agent-delegation.json](./schemas/agent-delegation.json)

## Required fields

- `controllerWallet` (`string format evm-address`)
- `agentWallet` (`string format evm-address`)

## Optional fields

- `agentId` (`string max 128`)
- `scope` (`string max 128`)
- `permissions` (`array`)
- `maxSpend` (`string`)
- `allowedPaymentTypes` (`array`)
- `receiptDisclosure` (`string enum: none, summary, full`)
- `expiresAt` (`integer`)

- **Compatible with:** `agent-identity`, `ownership-org-oauth`, `wallet-risk`, `wallet-link`

## Example (schema-validated)

```javascript
await client.verify({
  verifier: 'agent-delegation',
  data: {
    "controllerWallet": "0xffffffffffffffffffffffffffffffffffffffff",
    "agentWallet": "0x1111222233334444555566667777888899990000",
    "agentId": "agent-bot-1",
    "scope": "trading",
    "permissions": [
      "execute",
      "read"
    ],
    "maxSpend": "1000000000000000000",
    "expiresAt": 1700000000000
  }
});

// HTTP request envelope
{
  "verifierIds": [
    "agent-delegation"
  ],
  "data": {
    "controllerWallet": "0xffffffffffffffffffffffffffffffffffffffff",
    "agentWallet": "0x1111222233334444555566667777888899990000",
    "agentId": "agent-bot-1",
    "scope": "trading",
    "permissions": [
      "execute",
      "read"
    ],
    "maxSpend": "1000000000000000000",
    "expiresAt": 1700000000000
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
