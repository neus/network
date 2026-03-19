# NEUS Verify Skill

**Invocation:** `/verify`
**Purpose:** Check eligibility and guide users through verification when
additional proof is required.

---

## When to Use

- User asks to verify a wallet or DID
- User asks to check eligibility
- User asks to gate access
- You need to confirm proof-of-human or another verification requirement

---

## Flow

### 1. Get Context

```text
neus_context()
```

Returns the live verifier catalog, billing model, and integration constraints.

### 2. Check Eligibility

```text
neus_proofs_check({
  wallet: "0x...",
  verifiers: ["proof-of-human", "wallet-risk"]
})
```

### 3. Handle the Result

If eligible:

```text
Eligible
Wallet has the required proofs. Proceeding.
```

If not eligible:

```text
neus_verify_or_guide({
  walletAddress: "0x...",
  verifierIds: ["proof-of-human"]
})
```

Returns `hostedVerifyUrl` for browser completion when verification is missing.

---

## Common Verifiers

| Verifier | Purpose |
|----------|---------|
| `proof-of-human` | Sybil resistance |
| `wallet-risk` | Wallet risk scoring |
| `ownership-basic` | Basic ownership proof |
| `agent-identity` | Agent registration |
| `agent-delegation` | Agent authority |

---

## Example Usage

```text
User: Check if 0xabc... is eligible for an airdrop

1. neus_proofs_check({ wallet: "0xabc...", verifiers: ["proof-of-human"] })
2. If eligible: "Eligible for airdrop"
3. If not: Provide hostedVerifyUrl for verification
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `payment_required` | Credits or payment needed | Guide to the next payment or verification step |
| `verification_required` | Required proof is missing | Provide hosted verification guidance |
| `invalid_wallet` | Wallet format is invalid | Ask for a corrected wallet or DID |
