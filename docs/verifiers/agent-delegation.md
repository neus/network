# agent-delegation

Delegates authority to an agent, ERC-8004 compatible

- **Access:** `public`
- **Category:** `agent`
- **Flow:** `instant`
- **Expiry:** `expiring`
- **Schema:** [./schemas/agent-delegation.json](./schemas/agent-delegation.json)

## Required fields

- `controllerWallet` (`string format universal-address` — EVM `0x...` or Solana Base58)
- `agentWallet` (`string format universal-address` — EVM `0x...` or Solana Base58)

## Optional fields

- `agentId` (`string max 128`)
- `scope` (`string max 128` — e.g. `"payments:x402"`, `"posting"`, `"global"`)
- `permissions` (`array of strings, each max 64 chars, max 32 entries`)
- `maxSpend` (`string` — decimal wei amount, e.g. `"1000000000000000000"` for 1 ETH)
- `allowedPaymentTypes` (`array of strings, each max 32 chars, max 8 entries` — e.g. `["x402"]`)
- `receiptDisclosure` (`string enum: none, summary, full`)
- `expiresAt` (`integer` — Unix timestamp in milliseconds; treat expired as invalid)
- `instructions` (`string max 4000` — instructions for the delegated agent)
- `skills` (`array of strings, each max 64 chars, max 48 entries` — declared skill identifiers)

- **Compatible with:** `agent-identity`, `ownership-org-oauth`, `wallet-risk`, `wallet-link`

## Notes

- **Controller must sign:** `controllerWallet` must match the request signer (`walletAddress`). The controller signs the delegation grant.
- **Universal address:** Both `controllerWallet` and `agentWallet` accept EVM or Solana addresses.
- **x402 golden path:** If `scope` is `"payments:x402"`, `allowedPaymentTypes` defaults to `["x402"]` and `receiptDisclosure` defaults to `"summary"` when not explicitly set.
- **Expiry enforcement:** The server rejects delegations with `expiresAt` more than 30 seconds in the past. Gate checks should treat expired proofs as invalid using `since` or `expiresAt` field checks.

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
    "expiresAt": 1700000000000,
    "instructions": "Only execute trades approved by the portfolio risk policy.",
    "skills": ["market-data", "order-execution"]
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
    "expiresAt": 1700000000000,
    "instructions": "Only execute trades approved by the portfolio risk policy.",
    "skills": ["market-data", "order-execution"]
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
