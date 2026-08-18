# History

Standards and protocol chronology for NEUS portable trust infrastructure.

## CAIP-380 Portable Proof

| Date | Milestone |
| --- | --- |
| 2025-10-01 | CAIP-380 draft submitted to ChainAgnostic/CAIPs by Chris Leal (NEUS). |
| 2025-11-07 | CAIP-380 merged into ChainAgnostic/CAIPs as Draft status. Reviewers approved as draft with a request for a second VM signing profile before advancing to Review. |
| 2026-Q1 | NEUS ships CAIP-380 envelope implementation in production. EVM profile active with EIP-191, EIP-1271, and EIP-6492 support. |
| 2026-Q2 | NEUS publishes offline EVM fixture and `verifyPortableProofEnvelope` helper in `@neus/sdk`. |
| 2026-08 | NEUS Technical Whitepaper v1.0 published. CAIP-380 remains at Draft status in the official CASA registry. NEUS is the driving reference implementation with EVM and Solana (Ed25519) signing profiles shipped, offline fixtures, and an SDK verification helper. The envelope accepts any CAIP-2 namespace. |

### Lifecycle advancement path

CAIP-380 is currently at **Draft** status. The path to **Review** and **Accepted** status requires:

1. A second VM signing profile beyond EVM. Solana Ed25519 is the first non-EVM profile, published in the CAIP-380 spec with an offline NEUS fixture.
2. At least two independent implementations interoperating on the same `qHash` and signature verification.
3. Editors move the CAIP from Draft to Review, then to Accepted after the minimum review window.

NEUS is the reference implementation with EVM and Solana profiles shipped today. The envelope is chain-agnostic and accepts any CAIP-2 namespace, so NEAR and other ecosystems can add profiles as they publish signing specs. Advancing the CAIP depends on a second independent implementation and editor advancement.

## Audits

| Date | Auditor | Scope | Result |
| --- | --- | --- | --- |
| 2026-03-31 | SafeStack AI | `NEUSVerifierRegistry.sol`, `NEUSVoucherHub.sol`, `NEUSVoucherSpoke.sol`, `NEUSToken.sol` | No critical, high, medium, or low severity findings. |

## NEUS protocol releases

| Version | Date | Highlights |
| --- | --- | --- |
| 1.0 | 2026-08 | Public trust model whitepaper, 14 public verifiers, hosted MCP, `@neus/sdk` and `@neus/mcp-server` on npm, CAIP-380 EVM profile live. SafeStack AI contract audit completed (March 2026). |

## Standards NEUS implements

| Standard | Role | Status |
| --- | --- | --- |
| CAIP-2 | Blockchain identifiers | Active |
| CAIP-10 | Account identifiers | Active |
| CAIP-380 | Portable Proof envelope | Draft, merged. NEUS is reference implementation. EVM and Solana profiles shipped. Envelope accepts any CAIP-2 namespace. |
| EIP-191 | Signed data | Active |
| EIP-1271 | Contract wallet signatures | Active |
| EIP-6492 | Predeploy contract signatures | Active |
| MCP | Model Context Protocol | Active, hosted server |
| x402 | HTTP payment challenge | Active, optional |
| A2A | Agent-to-agent discovery | Compatible exposure |
| ERC-8004 | Agent identity registry | Draft. Compatible discovery exposure only. |