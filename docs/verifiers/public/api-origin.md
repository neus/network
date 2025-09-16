# API Origin

What it proves
- Ownership of an API/platform origin by binding a wallet to a platform URL and verification context.

Inputs
- platformUrl: string (uri)
- walletAddress: address
- context: string — free-form verification context

Outputs
- qHash proof binding platformUrl ↔ walletAddress with context.

Privacy
- No PII. Use private proofs if the context is sensitive.

High‑value use cases
- Multi‑tenant platform mapping (tenant → wallet)
- Service ownership proofs for partner marketplaces
- Secure callback origins for automation and relayers

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
