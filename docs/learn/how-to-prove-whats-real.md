# How To Prove What's Real

Use this model to move from trust-by-assertion to trust-by-proof.

## 1) Define the claim

State exactly what you need to verify:

- "This wallet owns this NFT now"
- "This user completed unique-human verification"
- "This agent is authorized by this controller"

## 2) Pick verifier(s)

Choose verifiers that map directly to the claim. Start with one verifier, then compose additional signals only when policy requires them.

## 3) Set freshness policy

For point-in-time claims (balances, token/NFT ownership, risk), enforce freshness windows using `since`, `sinceDays`, or fresh verification.

## 4) Enforce access

Use gate checks for server decisions and `VerifyGate` for user-facing unlock flow.

## 5) Keep privacy strict

Keep proofs private by default. Make proofs public/discoverable only when user value clearly requires it.

## 6) Reuse outcomes

Persist and reference `proofId` (standard). Avoid re-verifying unless freshness or policy needs demand it.
