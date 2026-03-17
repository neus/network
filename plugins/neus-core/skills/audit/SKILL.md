# NEUS Audit Skill

**Invocation:** `/audit`
**Purpose:** Audit proof status, agent delegations, and protocol compliance

---

## When to Use

- User asks to "audit proofs"
- User asks to "check agent status"
- User asks to "verify delegation"
- Pre-release checks

---

## Audit Types

### 1. Proof Audit

Check what proofs a wallet has:

```
neus_proofs_get({
  identifier: "0x...",
  limit: 100
})
```

Returns:
- `proofs[]` - List of proof records
- `profileSummary` - Profile data
- `agentContext` - Agent identities and delegations

### 2. Agent Link Audit

Verify agent delegation status:

```
neus_agent_link({
  agentWallet: "0x...",
  principal: "0x..."
})
```

Returns:
- `linked: true/false`
- `identityProofId` - qHash of agent-identity
- `delegationProofId` - qHash of agent-delegation

### 3. Session Audit

Check current session context:

```
neus_me()
```

Returns:
- `principal` - Current DID and wallet
- `agents[]` - Linked agents
- `status` - Auth status

---

## Audit Report Format

```
═══════════════════════════════════════
NEUS AUDIT REPORT
═══════════════════════════════════════
Wallet: 0x...
DID: did:pkh:eip155:84532:0x...

PROOFS
───────────────────────────────────────
✓ proof-of-human (qHash: 0xabc...)
✓ ownership-basic (qHash: 0xdef...)
✗ wallet-risk - NOT FOUND

AGENTS
───────────────────────────────────────
✓ neus-design-dev (linked, expires 2027-03-16)

SUMMARY
───────────────────────────────────────
Total Proofs: 2
Linked Agents: 1
═══════════════════════════════════════
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

Audit for Rule 0 violations:
- Signing context ≠ Protocol chain context
- qHash must be SHAKE256
- Verifier metadata from API (not hardcoded)

---

## Example Usage

```
User: Audit wallet 0xabc...

1. neus_proofs_get({ identifier: "0xabc..." })
2. neus_agent_link({ agentWallet: "0xagent..." })
3. Generate report
```