# NEUS Audit Skill

**Invocation:** `/audit`
**Purpose:** Review proof status, agent delegations, and public protocol
alignment.

---

## When to Use

- User asks to audit proofs
- User asks to check agent status
- User asks to verify delegation
- You need a pre-release or integration review

---

## Audit Types

### 1. Proof Audit

Check which public proofs a wallet or DID has:

```text
neus_proofs_get({
  identifier: "0x...",
  limit: 100
})
```

Returns:

- `proofs[]` - Public proof records
- `profileSummary` - Profile summary data
- `agentContext` - Agent identities and delegations when present

### 2. Agent Link Audit

Check agent delegation status:

```text
neus_agent_link({
  agentWallet: "0x...",
  principal: "0x..."
})
```

Returns:

- `status` - `ok` or `link_required`
- `linked` - Whether the agent is fully linked
- `hostedVerifyUrl` and `nextSteps` when setup is incomplete

### 3. Session Audit

Check the current session context:

```text
neus_me()
```

Returns:

- `principal` - Current DID and wallet
- `agents[]` - Linked agents
- `status` - Auth status

---

## Audit Report Format

```text
NEUS AUDIT REPORT
========================================
Wallet: 0x...
DID: did:pkh:eip155:84532:0x...

PROOFS
----------------------------------------
OK   proof-of-human (qHash: 0xabc...)
OK   ownership-basic (qHash: 0xdef...)
MISS wallet-risk

AGENTS
----------------------------------------
OK   neus-design-dev (linked, expires 2027-03-16)

SUMMARY
----------------------------------------
Total Proofs: 2
Linked Agents: 1
========================================
```

---

## Common Checks

| Check | Tool | Criteria |
|-------|------|----------|
| Sybil resistance | `neus_proofs_check` | `proof-of-human` |
| Agent authority | `neus_agent_link` | `linked: true` |
| Delegation expiry | `neus_proofs_get` | `expiresAt > now` |
| Spend limits | `neus_proofs_get` | `maxSpend` |

---

## Protocol Compliance

Audit for these issues:

- Signing context must stay separate from protocol chain context
- qHash handling must follow the active NEUS protocol implementation
- Verifier metadata should come from the API, not hardcoded copies

---

## Example Usage

```text
User: Audit wallet 0xabc...

1. neus_proofs_get({ identifier: "0xabc..." })
2. neus_agent_link({ agentWallet: "0xagent..." })
3. Generate the audit summary
```
