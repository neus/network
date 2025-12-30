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
1. **Wallet normalization:** lowercase the `0x...` address for EVM (`eip155`) signing. For non-EVM `chain` namespaces, preserve the original wallet string.
2. **Chain context:** EVM uses numeric `chainId` (example: `1`). Universal mode uses CAIP-2 `chain` (example: `solana:mainnet`). The signing string’s `Chain:` line must match what you submit in the request.
3. **Verifiers:** comma-separated, no spaces (example: `ownership-basic,wallet-risk`).
4. **Data:** deterministic JSON (keys sorted) with no extra whitespace.
5. **Timestamp:** unix milliseconds, within the server’s freshness window (commonly 5 minutes).

## Debugging

Use the API to troubleshoot signature issues.

- **`POST /api/v1/verification/standardize`**: Returns the exact signing string the server expects.
  - Send `chainId` (number) and an EVM `walletAddress` (`0x...`).
