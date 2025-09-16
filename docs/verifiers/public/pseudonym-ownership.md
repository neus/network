# Pseudonym

What it proves
- A registered pseudonym (linked privately to a wallet/DID) has attested to the provided content by signing its qHash.

Registration (separate API/flow)
- Pseudonym is registered with identity data (wallet or DID) and a registration signature. Stored with identityQHash (no raw PII exposed).

Inputs (verification)
- content: string (or provide main qHash upstream)
- pseudonymId: string
- signature: string — signature over the content qHash by the linked wallet

Outputs
- qHash proof and data: { pseudonymId, linkedWallet, identityQHash, registrationTimestamp, verificationTimestamp }.

Privacy
- Preserves anonymity while enabling cryptographic accountability. Use private proofs by default.

High‑value use cases
- Pseudonymous publishing with verifiable accountability
- Privacy‑preserving endorsements and approvals
- Anon leadership credentials for DAOs

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
