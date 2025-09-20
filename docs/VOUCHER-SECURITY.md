# Voucher Security Model

## Overview

Security measures that prevent fake vouchers and ensure system integrity.

## Voucher Creation Security

### On-Chain Protection
- **Authorized Creation**: Only the VerifierRegistry contract can create vouchers (`onlyRegistry` modifier)
- **Deterministic IDs**: Voucher IDs generated using cryptographic hash of `(qHash, targetChainId, verifierId, block.timestamp, counter)`
- **Collision Detection**: Smart contract prevents voucher ID collisions with explicit validation
- **Immutable Records**: Once created, voucher data is immutably stored on-chain

### Cryptographic Integrity
```solidity
// Voucher ID generation (deterministic and collision-resistant)
bytes32 voucherId = keccak256(abi.encodePacked(
    qHash,           // Original proof hash
    targetChainId,   // Destination chain
    verifierId,      // Verification type
    block.timestamp, // Creation time
    totalVouchersCreated + i // Unique counter
));
```

## Voucher Processing Security

### Off-Chain Validation
- **Event Deduplication**: Relayer service tracks processed events to prevent double-processing
- **State Management**: Redis-based tracking ensures vouchers are only processed once per chain
- **Hub Transaction Validation**: Vouchers are only processed if linked to valid hub transactions
- **Trusted Relayer Network**: Only authorized relayers can fulfill vouchers on spoke chains

### Spoke Chain Protection
- **Relayer Authorization**: Spoke contracts verify relayer is trusted before accepting voucher fulfillment
- **Voucher Validation**: Smart contract validates voucher structure and prevents replay attacks
- **Already-Fulfilled Checks**: Transaction manager validates voucher hasn't been fulfilled before sending transaction

## Attack Prevention

### Against Fake Vouchers
1. **Creation Authority**: Fake vouchers cannot be created - only VerifierRegistry can emit valid VoucherCreated events
2. **Chain Validation**: Relayer service only processes events from official hub contract
3. **Cryptographic Binding**: Voucher ID cryptographically binds to original verification proof
4. **Immutable Audit Trail**: All voucher creation and fulfillment is permanently recorded on-chain

### Against Replay Attacks
1. **One-Time Use**: Each voucher can only be fulfilled once per chain
2. **Deduplication**: Multiple layers of duplicate detection prevent re-processing
3. **State Tracking**: Comprehensive state management prevents race conditions
4. **Timeout Protection**: Stale vouchers are automatically cleaned up

### Against Unauthorized Processing
1. **Trusted Relayers Only**: Spoke contracts only accept fulfillment from authorized relayers
2. **Multi-Layer Validation**: Transaction manager validates permissions before sending transactions
3. **Access Control**: Smart contracts enforce strict access control for all operations

## Monitoring and Auditing

### Real-Time Protection
- **Event Monitoring**: All voucher creation and fulfillment events are logged and monitored
- **Anomaly Detection**: Unusual patterns in voucher processing trigger alerts
- **Health Checks**: Continuous monitoring of relayer service health and performance
- **Balance Monitoring**: Relayer wallet balances monitored to prevent service disruption

### Audit Trail
- **Immutable Records**: All voucher operations recorded on-chain with full traceability
- **Comprehensive Logging**: Detailed off-chain logging for security analysis
- **Metrics Tracking**: Performance and security metrics tracked for analysis
- **Event Correlation**: Cross-chain event correlation ensures consistency

## Security Guarantees

The voucher system provides these security guarantees:

1. **Authenticity**: All vouchers originate from verified proofs on the hub chain
2. **Integrity**: Voucher data cannot be tampered with once created
3. **Non-Repudiation**: All operations are cryptographically signed and recorded
4. **Availability**: Redundant relayer network ensures high availability
5. **Consistency**: Cross-chain state consistency maintained through careful synchronization

## Risk Mitigation

### Operational Risks
- **Relayer Failure**: Multiple trusted relayers provide redundancy
- **Network Congestion**: Intelligent retry logic handles network issues
- **Smart Contract Bugs**: Timelock upgrades and emergency pause functionality

### Security Monitoring
- **Failed Transactions**: All failed voucher operations are logged and analyzed
- **Unauthorized Attempts**: Attempts to process invalid vouchers are blocked and reported
- **Performance Anomalies**: Unusual processing patterns trigger security alerts

---

**Multiple security layers ensure only legitimate vouchers are processed.**
