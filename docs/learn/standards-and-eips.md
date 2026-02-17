# Standards & EIPs

NEUS uses off-chain signatures for authorization.

## Active standards in production

- **EIP-191**: EOA signatures (`personal_sign`) for request-bound messages.
- **EIP-1271**: smart contract wallet signature validation.
- **EIP-6492**: counterfactual smart account signatures.

## Signing contract (authoritative)

The standard message includes wallet, chain, verifier IDs, deterministic data, and timestamp. Server verification enforces freshness windows and uses a single standardized message format.

See [Signing](../concepts/signing.md) for exact payload structure and validation rules.

## Chain handling

- **EVM (0x addresses)**: most integrators should omit `chain` / `chainId` and let the server standardize signing context.
- **Non-EVM**: requests must provide an explicit CAIP-2 `chain` (for example `solana:mainnet`). If `chain` is missing, the request is rejected.

## Identity model

- DID format: `did:pkh`
- Proof identifiers: use `proofId` as the standard identifier.

## Scope and non-goals

- EIP-712 is not the default signing path today.
- Chain context may be represented as numeric `chainId` (legacy) or CAIP-2 `chain` depending on surface; the standard signing rules are defined in [Signing](../concepts/signing.md).
