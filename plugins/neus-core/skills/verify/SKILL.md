# NEUS Verify Skill

**Invocation:** `/verify`
**Purpose:** Verify wallet eligibility and guide users through proof creation

---

## When to Use

- User asks to "verify wallet"
- User asks to "check eligibility"
- User asks to "gate access"
- Before requiring proof-of-human or other verifications

---

## Flow

### 1. Get Context

```
neus_context()
```

Returns available verifiers and their requirements.

### 2. Check Eligibility

```
neus_proofs_check({
  wallet: "0x...",
  verifiers: ["proof-of-human", "wallet-risk"]
})
```

### 3. Handle Result

**If eligible:**
```
✅ Eligible
Wallet has required proofs. Proceeding.
```

**If not eligible:**
```
neus_verify_or_guide({
  walletAddress: "0x...",
  verifierIds: ["proof-of-human"]
})
```

Returns `hostedVerifyUrl` for browser completion.

---

## Common Verifiers

| Verifier | Purpose |
|----------|---------|
| `proof-of-human` | Sybil resistance |
| `wallet-risk` | Risk scoring |
| `ownership-basic` | Content ownership |
| `agent-identity` | AI agent registration |
| `agent-delegation` | Agent authority |

---

## Example Usage

```
User: Check if 0xabc... is eligible for airdrop

1. neus_proofs_check({ wallet: "0xabc...", verifiers: ["proof-of-human"] })
2. If eligible: "✅ Eligible for airdrop"
3. If not: Provide hostedVerifyUrl for verification
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `payment_required` | Credits needed | Guide to hosted verify |
| `verification_required` | Proof missing | Provide signing request |
| `invalid_wallet` | Bad address | Ask for correct format |