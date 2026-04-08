# agent-delegation

Delegates scoped authority from a delegating account to an agent, ERC-8004 compatible

- **Access:** `public`
- **Category:** `agent`
- **Flow:** `instant`
- **Expiry:** `expiring`
- **Schema:** [./schemas/agent-delegation.json](./schemas/agent-delegation.json)

## Required fields

- None

## Optional fields

- `controllerAccountId` (`string format caip10-account`): Preferred CAIP-10 account ID for the controller.
- `controllerChainRef` (`string format caip2-chain`): Required when using `controllerWallet` (instead of `controllerAccountId`).
- `controllerWallet` (`string format universal-address`)
- `agentAccountId` (`string format caip10-account`): Preferred CAIP-10 account ID for the agent.
- `agentChainRef` (`string format caip2-chain`): Required when using `agentWallet` (instead of `agentAccountId`).
- `agentWallet` (`string format universal-address`)
- `agentId` (`string max 128 min 1`)
- `scope` (`string max 128`)
- `permissions` (`array`)
- `maxSpend` (`string pattern ^[0-9]{1,78}$`): Spend cap as a whole-number string in token base units (no decimal point). USDC (common x402): six decimal places; native ETH-style assets: eighteen.
- `allowedPaymentTypes` (`array`)
- `receiptDisclosure` (`string enum: none, summary, full`)
- `expiresAt` (`integer`)
- `instructions` (`string max 4000`)
- `skills` (`array`): Agent skills as structured objects

- **Compatible with:** `agent-identity`, `ownership-org-oauth`, `wallet-risk`, `wallet-link`

## Example (schema-validated)

```javascript
await client.verify({
  verifier: 'agent-delegation',
  data: {
    "controllerWallet": "0xffffffffffffffffffffffffffffffffffffffff",
    "controllerAccountId": "eip155:84532:0xffffffffffffffffffffffffffffffffffffffff",
    "agentWallet": "0x1111222233334444555566667777888899990000",
    "agentAccountId": "eip155:84532:0x1111222233334444555566667777888899990000",
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
    "controllerAccountId": "eip155:84532:0xffffffffffffffffffffffffffffffffffffffff",
    "agentWallet": "0x1111222233334444555566667777888899990000",
    "agentAccountId": "eip155:84532:0x1111222233334444555566667777888899990000",
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
