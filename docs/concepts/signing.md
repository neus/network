# Signing

Authentication in NEUS is **signature-based**.

## Supported Wallets

| Type | Standard | Description |
| :--- | :--- | :--- |
| **EOA** | EIP-191 | Standard `personal_sign` (MetaMask, Coinbase, Rainbow). |
| **Smart Contract** | EIP-1271 | Contract wallets (Safe, Argent, Sequence). |
| **Counterfactual** | EIP-6492 | Pre-deployed smart accounts not yet on-chain. |

## Message Format

If building a custom client (e.g., Python, Go), you must replicate the standard signing message exactly.

**Template:**

```text
NEUS Verification Request
Wallet: {normalized_wallet}
Chain: {chain_context}
Verifiers: {verifier_ids}
Data: {deterministic_json}
Timestamp: {unix_ms}
```

**Rules:**

1. **Wallet normalization:** format depends on chain type.
   - EVM (`eip155`): lowercase `0x...`
   - Solana: preserve base58 address as-is (do not lowercase)
   - NEAR: account IDs are treated as lowercase
2. **Chain:** the `Chain:` line is bound into the signature.
   - EVM (`0x...`): most clients should **omit** `chain` / `chainId` and let the server standardize it.
   - Non-EVM: send `chain` as a CAIP-2 string (example: `solana:mainnet`). The signing string’s `Chain:` line must match that `chain`.
3. **Verifiers:** comma-separated, no spaces (example: `ownership-basic,wallet-risk`).
4. **Data:** deterministic JSON (keys sorted) with no extra whitespace.
5. **Timestamp:** unix milliseconds, within the server’s freshness window (default max age: 5 minutes; default max future skew: 1 minute).

## Debugging

Use the API to troubleshoot signature issues.

- **`POST /api/v1/verification/standardize`**: Returns the exact signing string the server expects.
  - Use this instead of guessing the `Chain:` line or JSON standardization details.

## Embedded Wallet Notes

Embedded and social wallets (AppKit social, Farcaster mini apps, Privy, and similar EIP-1193 providers) can reject plain UTF-8 payloads in `personal_sign` with encoding errors.

- Default path: sign the plain UTF-8 message string first (`personal_sign`).
- Retry path: if provider errors mention byte/encoding/non-hex input, retry `personal_sign` with UTF-8 hex payload (`0x...`).
- NEUS SDK support: use `signMessage(...)` from `@neus/sdk`; it automatically applies this retry strategy.
- Helper export: use `toHexUtf8(...)` when implementing custom signing wrappers.

This behavior aligns with EIP-191 and EIP-1193. Hex-encoding the same UTF-8 bytes preserves the signed payload format expected by backend verification.
