# ZK KYC

What it proves
- That a wallet has passed Coinbase KYC, without revealing PII, using a RISC Zero circuit. The verifier validates an internal short-lived JWT from the KYC proxy and then requires ZK proof generation.

Inputs
- internalKycJwt: string — issued by NEUS KYC proxy after Coinbase OAuth
- kycSubjectWallet: string (address)

Flow
1) Validate internalKycJwt and wallet match.  
2) Generate verifier qHash.  
3) HVS orchestrates ZK proof with Bonsai (RISC Zero) using the configured circuit image ID.  
4) Proof finalization updates status; cross-chain vouchers optional.

Outputs
- qHash proof; zkInfo indicates zk_required_by_verifier. Data includes jwtTimestamp; no PII exposed.

Privacy
- Designed for privacy-preserving KYC signaling. JWT is handled server-side; ZK output contains no PII.

High‑value use cases
- Age/region gates without PII retention
- Exchange‑grade compliance signals for finance apps
- High‑trust onboarding with one‑time KYC → portable proof

API reference
- Endpoints and response shapes: [../../api/index.md](../../api/index.md)
