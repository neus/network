# Signing

Proof creation and owner-authorized actions in NEUS are **signature-based**.

NEUS also supports an optional **session** layer (`/api/v1/auth/*`) for first-party browser UX (wallet + passkey). Sessions reduce repeated sign-in prompts, but they do not change the verification signing contract described below.

## Supported Wallets

| Type | Standard | Description |
| :--- | :--- | :--- |
| **EOA** | EIP-191 | Standard `personal_sign` (MetaMask, Coinbase, Rainbow). |
| **Smart Contract** | EIP-1271 | Contract wallets (Safe, Argent, Sequence). |
| **Counterfactual** | EIP-6492 | Pre-deployed smart accounts not yet on-chain. |

## Standardized path

For manual or server-side signing, do not hand-build the message if you can avoid it.

- Call `POST /api/v1/verification/standardize`
- Sign the returned `signerString`
- Submit the same normalized request body to `POST /api/v1/verification`

This is the production-safe path because it avoids drift in chain normalization and deterministic JSON handling.

## Message Format

If you are building a low-level custom client (for example Python or Go without the SDK), the current signing string format is:

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
   - EVM (`eip155` / `0x...`): the server **forces HUB chain context** for verification signing (the `Chain:` line is the hub chainId).
     - Clients should not guess this value; call `POST /api/v1/verification/standardize` and sign the returned `signerString`.
     - When submitting the verification request, include the signature + signedTimestamp; the server will normalize any EVM chain inputs to hub context.
   - Non-EVM: send `chain` as a CAIP-2 string (example: `solana:mainnet`). The signing string’s `Chain:` line must match that `chain`.
3. **Verifiers:** comma-separated, no spaces (example: `ownership-basic,wallet-risk`).
4. **Data:** deterministic JSON (keys sorted) with no extra whitespace.
5. **Timestamp:** unix milliseconds, within the server’s freshness window (default max age: 5 minutes; default max future skew: 1 minute).

## Debugging

Use the API to troubleshoot signature issues or to avoid manual string construction entirely.

- **`POST /api/v1/verification/standardize`**: Returns the exact signing string the server expects.
  - Use this instead of guessing the `Chain:` line or JSON standardization details.

## Embedded Wallet Notes

Embedded and social wallets (AppKit social, Farcaster mini apps, Privy, and similar EIP-1193 providers) can reject plain UTF-8 payloads in `personal_sign` with encoding errors.

- Default path: sign the plain UTF-8 message string first (`personal_sign`).
- Retry path: if provider errors mention byte/encoding/non-hex input, retry `personal_sign` with UTF-8 hex payload (`0x...`).
- NEUS SDK support: use `signMessage(...)` from `@neus/sdk`; it automatically applies this retry strategy.
- Helper export: use `toHexUtf8(...)` when implementing custom signing wrappers.

This behavior aligns with EIP-191 and EIP-1193. Hex-encoding the same UTF-8 bytes preserves the signed payload format expected by backend verification.
