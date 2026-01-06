# Security

## Responsible disclosure

Please **do not** open public issues for security vulnerabilities.

- Email: `dev@neus.network`
- Include: impact, affected component (SDK / widgets / API / contracts), steps to reproduce, suggested mitigation

## Architecture

NEUS uses a trust-minimized architecture anchored on public blockchains.

- **Non-custodial**: NEUS never holds your private keys or assets.
- **Cryptographic proofs**: verifications are cryptographically signed and verifiable.
- **Request-bound identifiers**: Proof IDs (`qHash`) are derived from the signed request payload.

## Authentication

All verification submissions are authenticated via wallet signatures.

- **EVM**: EIP-191 (and smart account standards like EIP-1271 / EIP-6492).
- **Replay protection**: requests include a timestamp within a short freshness window.
- **Request binding**: signatures are bound to the full request payload (verifiers + data + chain context).

### Delegation / sponsorship (deployment-specific)

Some deployments may support sponsorship or delegation for operational needs (e.g., billing, higher limits, or delegated subject checks), but these **do not replace wallet authorization** for user-owned proofs.

For `external_lookup` verifiers, a delegating party may run checks against a subject wallet address. In that case the proof owner remains the signer and the subject wallet is verifier input data.

## Rate limiting

Public endpoints are rate-limited to ensure reliability and fair use.

- **Status Polling**: 100 requests per minute. Successful polls are exempted from limits.
- **Proof Creation**: 50 requests per 15 minutes.
- **General API**: 2,000 requests per hour.

The `@neus/sdk` handles these limits automatically with jittered backoff. For higher limits, contact `dev@neus.network`.
