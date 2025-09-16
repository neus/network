# NEUS Network Security Policy

## Overview

NEUS Network implements a comprehensive security model designed to protect users, developers, and the protocol infrastructure. This document outlines our security practices, vulnerability reporting procedures, and security guarantees.

## Security Model

### Core Security Guarantees

- **EIP-191/EIP-1271 Signature Authentication**: All API operations require cryptographic wallet signatures
- **Replay Protection**: 5-minute signature freshness window with Redis-backed nonce tracking
- **Rate Limiting**: Strict per-wallet and per-IP limits to prevent abuse
- **Input Validation**: Comprehensive sanitization of all user inputs
- **Privacy by Default**: Private verification settings with explicit public opt-in
- **Quantum-Resistant Hashing**: SHAKE-256 based qHash identifiers

### Authentication Architecture

#### Wallet-Based Authentication (Primary)
- **Method**: EIP-191 signatures for EOA wallets, EIP-1271 for contract wallets
- **Message Format**: Structured, deterministic message construction (6-line canonical format)
- **Freshness**: Maximum 5-minute signature age
- **Replay Protection**: Redis-based signature tracking with TTL
- **Address Normalization**: All wallet addresses normalized to lowercase for signature recovery
- **Data Serialization**: Deterministic JSON.stringify with no extra whitespace

#### Signature Message Format (CRITICAL - Must Match Exactly)
```
NEUS Verification Request
Wallet: {normalized_lowercase_address}
Chain: {chain_id_number}
Verifiers: {comma_separated_verifier_ids}
Data: {json_stringify_no_spaces}
Timestamp: {unix_timestamp_number}
```

**Backend Validation Requirements:**
- Signature must recover to the provided wallet address (case-insensitive)
- Timestamp must be within 5-minute window (prevents replay attacks)
- Message format must match exactly (deterministic serialization)
- All components (wallet, chain, verifiers, data, timestamp) are validated
- Redis-based nonce tracking prevents signature reuse

### Rate Limiting

#### Service Limits (Genesis/Pilot)
- **Verification Requests**: Strict per-wallet windows; abusive traffic is throttled or blocked
- **Status Checks**: High-frequency status checks are rate-limited and back-off enforced
- **Admin Operations**: Administrative operations have enhanced rate limiting

Note: Progressive slowdown and blocking mechanisms protect against abuse.

#### Protection Features
- **Dynamic Blocklists**: Automatic IP/wallet blocking for abuse
- **Progressive Delays**: Exponential backoff for repeated violations
- **Security Event Logging**: Comprehensive audit trail

### Privacy Protection

#### Data Minimization
- **No PII Storage**: No personal identifying information required or stored
- **Wallet-Only Identity**: Cryptographic addresses as sole identity
- **Content Hashing**: Original content optionally hashed, not stored
- **Selective Exposure**: Granular privacy controls per verification

#### Privacy Levels
- **Private**: Owner-only access with signature authentication
- **Public**: Open verification with optional public display

### Cross-Chain Security

#### Hub-Spoke Architecture
- **Hub Chain**: Base Sepolia for all verification processing
- **Spoke Chains**: Ethereum, Polygon, Arbitrum, Optimism testnets for storage
- **Cryptographic Integrity**: Proofs cryptographically linked across chains
- **Relayer Security**: Trusted relayer network with multi-signature controls

#### Asset Verification
- **Mainnet Verification**: Real asset checks on production networks
- **Testnet Storage**: Proof storage on testnet contracts (operational costs apply)
- **Chain Validation**: Strict validation of supported networks

## Vulnerability Reporting

### Responsible Disclosure

We encourage responsible disclosure of security vulnerabilities. Please follow these guidelines:

#### For Security Issues
1. **DO NOT** create public GitHub issues for security vulnerabilities
2. **Email**: dev@neus.network
3. **Include**:
   - Detailed description of the vulnerability
   - Steps to reproduce (if applicable)
   - Potential impact assessment
   - Suggested remediation (if known)

For full policy, scope, and timelines, see the official Security Disclosure policy: https://docs.neus.network/learn/legal/security-disclosure

#### Response Timeline (summary)
- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Resolution**: Based on severity (critical: 7 days, high: 14 days, medium: 30 days)
- **Public Disclosure**: After fix deployment with coordinated disclosure

### Scope

#### In Scope
- **API Endpoints**: All public and authenticated endpoints
- **SDK Components**: Client library (core SDK) and React widgets (separate package)
- **Smart Contracts**: Deployed registry, hub, and spoke contracts
- **Infrastructure**: Rate limiting, authentication, and data validation

#### Out of Scope
- **Third-Party Services**: External APIs (Pinata, Bonsai, etc.)
- **Client Applications**: Applications built using NEUS SDK
- **Social Engineering**: Attacks targeting individual users
- **Physical Security**: Infrastructure access controls

## Security Features

### Input Validation
- **Address Validation**: Ethereum address format verification
- **Signature Validation**: EIP-191/EIP-1271 compliance checking
- **Data Sanitization**: XSS and injection attack prevention
- **Type Checking**: Strict type validation for all parameters

### Network Security
- **HTTPS Enforcement**: All public traffic encrypted
- **CORS Protection**: Strict origin validation
- **Security Headers**: Comprehensive header protection via Helmet
- **DDoS Protection**: Multi-layer rate limiting and traffic analysis

### Smart Contract Security
- **Access Controls**: Role-based permissions with multi-signature requirements
- **Emergency Controls**: Circuit breakers and pause functionality
- **Upgrade Safety**: Immutable core logic with governed parameter updates
- **Fee Protection**: Treasury controls and burn mechanisms

## Security Monitoring

### Real-Time Monitoring
- **Failed Authentication Attempts**: Automatic blocking after threshold
- **Rate Limit Violations**: Progressive escalation and blocklisting
- **Unusual Patterns**: Bot detection and traffic analysis
- **Error Rate Monitoring**: Service health and availability tracking

### Alerting Thresholds
- **Critical**: Authentication bypass attempts, contract exploits
- **High**: Sustained abuse, service degradation
- **Medium**: Rate limit violations, validation failures
- **Low**: Performance issues, configuration warnings

## Standards & Compliance Notes

### Data Protection
- **Data Protection Note**: Designed to minimize personal data processing; integrators are responsible for their own regulatory compliance
- **Privacy by Design**: Default private settings with explicit consent
- **Data Retention**: Minimal data retention with automatic cleanup
- **User Rights**: Full user control over verification data

### Industry Standards
- **EIP Standards**: Implements relevant Ethereum standards (e.g., EIP‑191/EIP‑1271) where applicable
- **Security Best Practices**: Following OWASP and blockchain security guidelines
- **Audit Trail**: Immutable verification records for accountability

## Security Updates

### Update Process
1. **Security patches** released immediately for critical issues
2. **Version updates** follow semantic versioning with security notes
3. **Breaking changes** announced with migration guides
4. **Emergency fixes** deployed with post-incident analysis

### Communication Channels
- **GitHub Security Advisories**: For coordinated disclosure
- **Email Notifications**: dev@neus.network for direct updates
- **Release Notes**: Detailed security change documentation

## Contact Information

### Security Team
- **Email**: dev@neus.network
- **Response Time**: 24 hours for acknowledgment
- **Emergency**: Include "CRITICAL" in subject line

- **General Support**: info@neus.network
- **GitHub Issues**: https://github.com/neus/network/issues
- **Community**: Discord/Telegram (links in README)

## Bug Bounty Program

### Coming Soon
We are preparing a comprehensive bug bounty program for the mainnet launch. Details will be announced on our channels.

### Current Rewards
- **Critical vulnerabilities**: Recognition + potential token rewards
- **Responsible disclosure**: Public acknowledgment and contributor status
- **Community contributions**: Priority support and early access features

---

**Version**: 1.0.0  

For the most current security information, please check our [GitHub Security Advisories](https://github.com/neus/network/security/advisories).
