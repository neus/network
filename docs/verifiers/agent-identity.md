# agent-identity

Portable agent identity, ERC-8004 compatible

- **Access:** `public`
- **Category:** `agent`
- **Flow:** `instant`
- **Expiry:** `permanent`
- **Schema:** [./schemas/agent-identity.json](./schemas/agent-identity.json)

## Required fields

- `agentId` (`string max 128 min 1`)

## Optional fields

- `agentAccountId` (`string format caip10-account`): Preferred canonical subject identity (CAIP-10).
- `agentChainRef` (`string format caip2-chain`): Required when using `agentWallet` without `agentAccountId`.
- `agentWallet` (`string format universal-address`)
- `agentLabel` (`string max 128`)
- `agentType` (`string enum: ai, bot, service, automation, agent`)
- `description` (`string max 500`)
- `capabilities` (`object`): Agent capabilities as boolean flags
- `instructions` (`string max 4000`)
- `skills` (`array`): Agent skills as structured objects
- `services` (`array`)

- **Compatible with:** `agent-delegation`, `ai-content-moderation`, `ownership-dns-txt`, `contract-ownership`, `wallet-link`

## Example

```javascript
await client.verify({
  verifier: 'agent-identity',
  data: {
    "agentId": "agent-bot-1",
    "agentWallet": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentAccountId": "eip155:84532:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentLabel": "Automation Bot",
    "agentType": "agent",
    "description": "Runs automations",
    "capabilities": {
      "browser": true,
      "proofs": true,
      "delegation": true
    }
  }
});

// HTTP request envelope
{
  "verifierIds": [
    "agent-identity"
  ],
  "data": {
    "agentId": "agent-bot-1",
    "agentWallet": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentAccountId": "eip155:84532:0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentLabel": "Automation Bot",
    "agentType": "agent",
    "description": "Runs automations",
    "capabilities": {
      "browser": true,
      "proofs": true,
      "delegation": true
    }
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
