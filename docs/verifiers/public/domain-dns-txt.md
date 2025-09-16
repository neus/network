# DNS TXT

What it proves
- Control of a domain by binding a wallet address in a DNS TXT record.

Inputs
- domain: hostname (e.g., example.com)
- walletAddress: address to bind
- txtRecord?: optional explicit TXT content to match

Verification
- Looks for a TXT record (e.g., _neus.example.com or documented binding) that includes the wallet binding. Normalizes and validates domain.

Outputs
- qHash proof with domain, walletAddress, timestamp.

Privacy
- No PII. Domain is public by nature; consider using private proofs for non-public bindings.

High‑value use cases
- Publisher/site ownership for distribution networks
- Developer platform tenant verification
- Domain‑bound webhooks and allowlists

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
