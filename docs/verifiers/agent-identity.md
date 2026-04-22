# agent-identity

Portable agent identity, signed by the agent wallet itself. Use agent-delegation to grant authority from a delegating account.

- **Access:** `public`
- **Category:** `agent`
- **Flow:** `instant`
- **Expiry:** `permanent`
- **Schema:** [./schemas/agent-identity.json](./schemas/agent-identity.json) — JSON Schema for the `data` field

## Full payload (required and optional)

_Fields in the `data` object for the completed verification request (after signatures or hosted steps as required)._

### Required fields

- `agentId` (`string max 128 min 1`)
- `agentWallet` (`string format universal-address`)
- `agentChainRef` (`string format caip2-chain`): CAIP-2 network reference for agentWallet (for example eip155:8453). Supply in data or on the verification request as chain (CAIP-2) or chainId (EVM).

### Optional fields

- `agentAccountId` (`string format caip10-account`): Optional CAIP-10 account identifier for agentWallet. May be injected when inputs are normalized from wallet + chain context.
- `agentLabel` (`string max 128`)
- `agentType` (`string enum: ai, bot, service, automation, agent`)
- `description` (`string max 500`)
- `capabilities` (`object`): Agent capabilities as boolean flags
- `instructions` (`string max 16000`)
- `skills` (`array`): Agent skills as structured objects
- `services` (`array`)

- **Compatible with:** `agent-delegation`, `ai-content-moderation`, `ownership-dns-txt`, `contract-ownership`, `wallet-link`

## Example

_Illustrative values only. Use real addresses and tokens from your integration._

```javascript
await client.verify({
  verifier: 'agent-identity',
  data: {
    "agentId": "agent-bot-1",
    "agentWallet": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentChainRef": "eip155:84532",
    "agentLabel": "Example agent",
    "agentType": "agent",
    "description": "Example description",
    "capabilities": {
      "browser": true,
      "proofs": true,
      "delegation": true
    }
  }
});

// Request shape (illustrative)
{
  "verifierIds": [
    "agent-identity"
  ],
  "data": {
    "agentId": "agent-bot-1",
    "agentWallet": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentChainRef": "eip155:84532",
    "agentLabel": "Example agent",
    "agentType": "agent",
    "description": "Example description",
    "capabilities": {
      "browser": true,
      "proofs": true,
      "delegation": true
    }
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
