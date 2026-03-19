# NEUS Create Agent Skill

**Invocation:** `/create-agent`
**Purpose:** Create a new AI or automation agent with identity and delegation
proofs.

---

## When to Use

- User asks to create an agent
- User asks to set up an agent wallet
- User asks to make an AI assistant
- User wants delegated authority for automation

---

## Presets

| Preset | Capabilities | Use Case |
|--------|-------------|----------|
| `full-access` | All capabilities | General AI assistant |
| `payments` | `wallet`, `signing`, `spending` | Payment automation |
| `readonly` | `proofs`, `search` | Analysis and read-only workflows |
| `automation` | `browser`, `mcp`, `webhooks` | Task automation |

---

## Flow

### 1. Collect Parameters

Required:

- `agentId` - Unique identifier (`1-128` characters)

Optional:

- `preset` - Quick configuration
- `agentWallet` - Existing wallet or `"generate"`
- `controllerWallet` - Delegator; defaults to the active session wallet when
  supported

### 2. Create the Agent Request

```text
neus_agent_create({
  agentId: "my-assistant",
  preset: "full-access"
})
```

### 3. Handle Signing

The tool returns two signing requests:

1. `agent-identity` - The agent wallet signs its own identity proof
2. `agent-delegation` - The controller wallet signs the delegation proof

### 4. Submit the Signatures

```text
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

### 5. Confirm the Result

```text
neus_agent_link({
  agentWallet: "0x...",
  principal: "0x..."
})
```

---

## Example Usage

```text
User: Create a payment agent called "treasury-bot"

1. neus_agent_create({
     agentId: "treasury-bot",
     preset: "payments"
   })
2. Present the signing instructions
3. After signatures: "Agent created"
4. neus_agent_link() to verify the result
```

---

## Constraints

| Field | Limit |
|-------|-------|
| `agentId` | `1-128` chars |
| `agentLabel` | `<=128` chars |
| `description` | `<=500` chars |
| `capabilities` | Max `32` items |
| `skills` | Max `48` items |
| `permissions` | Max `32` items |

---

## Security Notes

- If an agent wallet is generated, its private key is shown once
- The controller must sign the delegation
- Delegations can include expiry dates and spend limits
