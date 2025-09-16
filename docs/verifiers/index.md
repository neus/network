# Verifiers Overview

**Core verifier primitives for building proof-based experiences.** Each page covers what it proves, inputs, outputs, privacy, and high‑value use cases. Combine verifiers to compose richer, multi‑dimensional proofs.

For API shapes, see the OpenAPI reference at [docs/api](../api/index.md). For validation schemas, see [verifier JSON schemas](./schemas/).

## Public

- [Ownership — Basic](./ownership-basic.md) — Content ownership attestation  
- [NFT Ownership](./nft-ownership.md) — NFT ownership proof  
- [Token Holding](./token-holding.md) — ERC‑20 minimum balance check  
- [Licensed Ownership](./ownership-licensed.md) — Licensed content via on‑chain ownership  

## Partner Preview

- [Social Trait Ownership](./ownership-social.md) — Link wallet to social account and extract non‑PII traits  
- [Domain (DNS TXT)](./ownership-dns-txt.md) — Domain ownership via DNS TXT binding  
- [API Origin](./ownership-api-origin.md) — API origin ownership (platform URL + wallet)  
- [Org Email (OAuth)](./ownership-org-oauth.md) — Organization email domain via OAuth (Google/Microsoft)  
- [Pseudonym Ownership](./ownership-pseudonym.md) — Pseudonymous content attestation linked to a wallet/DID  
- [ZK KYC (Coinbase)](./zkkyc-coinbase.md) — Coinbase KYC proof using RISC Zero  

Notes:
- SDK and examples cover Public verifiers. Partner Preview items require early access and may change.
- ZK is required for `zkkyc-coinbase`.
- Wallet addresses are used as provided (EIP‑55). NEUS does not manipulate addresses. DIDs can be derived by integrators if desired.

---

## Extend and compose

- Compose multiple verifiers in a single proof to increase trust without leaking data.
- Build custom verifiers that follow the same interface and lifecycle.

See: **[Custom Verifiers](./custom-verifiers.md)** and **[Verifier Specifications](./spec.md)**.

## Developer Resources

- **[Custom Verifiers](./custom-verifiers.md)** — Implementation guide for new verifiers
- **[Contributing Process](./contributing.md)** — How to contribute new verifiers
- **[Verifier Specifications](./spec.md)** — Technical specifications
- **[JSON Schemas](./schemas/)** — Validation schemas

## Questions?

- **General**: See [VERIFIERS.md](../VERIFIERS.md) for the older consolidated guide
- **Technical**: Review the implementation guides in this directory
- **Contributing**: Follow the [contribution process](./contributing.md)