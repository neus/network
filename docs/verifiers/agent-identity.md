# agent-identity

Portable agent identity, ERC-8004 compatible

- **Access:** `public`
- **Category:** `agent`
- **Flow:** `instant`
- **Expiry:** `permanent`
- **Schema:** [./schemas/agent-identity.json](./schemas/agent-identity.json)

## Required fields

- `agentId` (`string max 128`)
- `agentWallet` (`string format universal-address` — EVM `0x...` or Solana Base58)

## Optional fields

- `agentLabel` (`string max 128`)
- `agentType` (`string enum: ai, bot, service, automation, agent`)
- `description` (`string max 500`)
- `capabilities` (`array of strings, each max 128 chars, max 32 entries`)
- `instructions` (`string max 4000` — system prompt or behavioral instructions for the agent)
- `skills` (`array of strings, each max 64 chars, max 48 entries` — declared skill identifiers)
- `services` (`array of objects, max 16 entries` — each object: `{ name: string max 64, endpoint: string valid URL max 256, version?: string max 32 }`)

- **Compatible with:** `agent-delegation`, `ai-content-moderation`, `ownership-dns-txt`, `contract-ownership`, `wallet-link`

## Notes

- **Self-attestation required:** `agentWallet` must match the request signer (`walletAddress`). The agent signs its own identity claim.
- **Universal address:** `agentWallet` accepts EVM (`0x` + 40 hex chars) or Solana (Base58, 32–44 chars) addresses.

## Example (schema-validated)

```javascript
await client.verify({
  verifier: 'agent-identity',
  data: {
    "agentId": "agent-bot-1",
    "agentWallet": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "agentLabel": "Automation Bot",
    "agentType": "agent",
    "description": "Runs automations",
    "capabilities": [
      "monitoring",
      "actions"
    ],
    "instructions": "You are a monitoring agent. Only execute actions approved by the controller.",
    "skills": ["web-search", "code-execution"],
    "services": [
      { "name": "metrics-api", "endpoint": "https://metrics.example.com/v1", "version": "1.0" }
    ]
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
    "agentLabel": "Automation Bot",
    "agentType": "agent",
    "description": "Runs automations",
    "capabilities": [
      "monitoring",
      "actions"
    ],
    "instructions": "You are a monitoring agent. Only execute actions approved by the controller.",
    "skills": ["web-search", "code-execution"],
    "services": [
      { "name": "metrics-api", "endpoint": "https://metrics.example.com/v1", "version": "1.0" }
    ]
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
