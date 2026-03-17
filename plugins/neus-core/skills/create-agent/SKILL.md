# NEUS Create Agent Skill

**Invocation:** `/create-agent`
**Purpose:** Create a new AI/automation agent with identity and delegation proofs

---

## When to Use

- User asks to "create an agent"
- User asks to "set up an agent wallet"
- User asks to "make an AI assistant"
- User wants delegated authority for automation

---

## Presets

| Preset | Capabilities | Use Case |
|--------|-------------|----------|
| `full-access` | All capabilities | General AI assistant |
| `payments` | wallet, signing, spending | Payment automation |
| `readonly` | proofs, search | Data analysis |
| `automation` | browser, mcp, webhooks | Task automation |

---

## Flow

### 1. Collect Parameters

Required:
- `agentId` - Unique identifier (1-128 chars)

Optional:
- `preset` - Quick configuration
- `agentWallet` - Existing wallet or "generate"
- `controllerWallet` - Delegator (defaults to session wallet)

### 2. Create Agent

```
neus_agent_create({
  agentId: "my-assistant",
  preset: "full-access"
})
```

### 3. Handle Signing

Returns two signing requests:
1. **agent-identity** - Agent wallet signs (self-attestation)
2. **agent-delegation** - Controller wallet signs (delegation)

### 4. Submit Signatures

```
// Step 1: Agent identity
neus_verify({
  walletAddress: "<agentWallet>",
  verifierIds: ["agent-identity"],
  data: { agentId: "my-assistant", ... },
  signature: "<agentSignature>"
})

// Step 2: Delegation
neus_verify({
  walletAddress: "<controllerWallet>",
  verifierIds: ["agent-delegation"],
  data: { agentWallet: "...", controllerWallet: "...", ... },
  signature: "<controllerSignature>"
})
```

### 5. Verify Creation

```
neus_agent_link({
  agentWallet: "0x...",
  principal: "0x..."
})
```

---

## Example Usage

```
User: Create a payment agent called "treasury-bot"

1. neus_agent_create({
     agentId: "treasury-bot",
     preset: "payments"
   })
2. Present signing instructions
3. After signatures: "✅ Agent created"
4. neus_agent_link() to verify
```

---

## Constraints

| Field | Limit |
|-------|-------|
| `agentId` | 1-128 chars |
| `agentLabel` | ≤128 chars |
| `description` | ≤500 chars |
| `capabilities` | max 32 items |
| `skills` | max 48 items |
| `permissions` | max 32 items |

---

## Security Notes

- Agent wallet private key shown ONCE if generated
- Controller must sign delegation (not agent)
- Delegation can have expiry and spend limits