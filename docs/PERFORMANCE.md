# Performance Characteristics

NEUS provides cross‑chain verification with low cost, scalability, and strong privacy. Typical flows consolidate multiple steps into a single hub transaction while minimizing trust assumptions.

**Real-world performance data and cost analysis for NEUS Network verification.**

## Verification Flow

1. User signs verification request
2. Hub processes and creates proof (qHash)  
3. Vouchers emitted for target chains
4. Relayers fulfill vouchers in parallel

### Live results — public references

| Area | Observed range | Reference |
| --- | --- | --- |
| Hub confirmation | Seconds‑level (often 2–4s) | Multiple live runs across Base Sepolia |
| All spokes finalized | Tens of seconds (often 20–40s); first confirmations ~7–25s | Parallel relays; per‑chain queues |
| Per‑spoke gas used | ~149,343–149,359 gas | Consistent across Sepolia, Polygon Amoy, Arbitrum Sepolia, OP Sepolia |
| Batching effect | Per‑proof cost falls linearly: total/(batch size) | See cost snapshots below |

> Exact timings vary with network conditions; results are stable under normal L2/L1 testnet load.

### Cost snapshots (illustrative; varies hourly)

Assumptions for examples: ETH ~$4,300, POL ~$0.2872. These are references only; use live prices for forecasting.

| Scope | Example native fees | Example USD |
| --- | --- | ---: |
| OP Sepolia (spoke) | ~149k gas | ~$0.0006 |
| Polygon Amoy (spoke) | ~149k gas | ~$0.0031 |
| Ethereum Sepolia (spoke) | ~149k gas | ~$0.0035 |
| Arbitrum Sepolia (spoke) | ~149k gas | ~$0.064 |
| Base Sepolia (hub) | <1M gas (per verification window) | ~$0.004 |
| Hub + 4 spokes (example) | Sum of above | ~$0.03–$0.15 total |

Batching drives marginal cost toward sub‑cent per proof (e.g., 10‑proof batch → ~0.1–0.8¢/proof in the examples above).

### Why it’s different from traditional cross‑chain flows

- **No bridges, fewer assumptions**: Eliminates custodial bridging and complex trust surfaces.
- **One action vs. many**: A single proof replaces multiple signatures, approvals, and bridge transfers.
- **No asset movement**: Idempotent, per‑chain retries; failures are isolated and recoverable.
- **Operational predictability**: Consistent gas footprint and tight variance across spokes enable clear planning.
- **Universal verification**: Proofs are portable across apps and chains; no silos.

### Representative runs

| qHash (masked) | Hub chain | Hub tx (masked) | All spokes finalized | Per‑spoke gas (range) |
| --- | --- | --- | --- | --- |
| 0xfbb3…8d62 | Base Sepolia (84532) | 0x754d…1c7f | ~25s window | ~149,343–149,359 |
| 0x1bee…adad0 | Base Sepolia (84532) | 0x2c3b…e556 | ~7s–27s per chain; total under a minute | ~149,343–149,359 |

These examples are drawn from live storage records and on‑chain transactions. Values are representative, not guarantees.

### Cost and scale profile

- **Cost**: Simple, additive model—per‑chain fees plus a small hub fee; batching lowers marginal cost.
- **Controls**: Per‑chain budgets and pause toggles mitigate outlier fee spikes.
- **Throughput**: Parallelization and back‑pressure keep the system responsive during demand surges.

> Quick estimator: total_cost ≈ hub_fee + Σ(spoke_fee_i). Per‑proof cost ≈ total_cost / batch_size.

### What this enables

- **Cross‑platform memberships and drops**: Verify the proof, not the platform login.
- **Portable entitlements**: Season passes and allowlists that work across launchers and chains.
- **Proof‑based access (no accounts)**: Wallet‑centric access that preserves privacy.
- **Enterprise attestations**: Origin/timestamp/provenance you can show to partners and regulators—without moving assets.

### Go‑live expectations

- **Latency**: Proofs return within seconds and use background cross-chain propagation.
- **Reliability**: Per‑chain retries and idempotent relays; stalled spokes recover automatically.
- **Operations**: Daily budgets, observability, and adjustable target chains. Optional L1 anchoring when needed.

### Security and privacy posture

- **Wallet‑based DID**: Users control identity; no PII required.
- **Selective disclosure**: Reveal only what’s necessary; optional ZK for stronger privacy.
- **Reduced attack surface**: No custodial bridges; fewer moving parts, fewer failure modes.

### Data and benchmarks

This document summarizes multiple live runs across hub and spoke networks, as well as corresponding storage records. Exact numbers vary with network conditions. Maintain a “Live Benchmarks (as‑of)” page to keep figures current without revising this overview.

—

**Performance Summary**: Sub-cent costs with batching, fast confirmations, cross-chain propagation without bridges.

