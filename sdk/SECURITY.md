# NEUS SDK Security Guidelines

## Overview

The NEUS Network provides cryptographic verification infrastructure with strong security guarantees at the protocol level. Developers implementing custom verifiers or integrating the SDK must understand and follow security best practices to maintain system integrity.

## Core Security Model

### What NEUS Guarantees

- **EIP-191/EIP-1271 Signature Verification**: All API calls require valid signatures (supports contract wallets)
- **Replay Protection**: 5-minute timestamp windows with anti-replay protections
- **Cross-Chain Integrity**: Cryptographic proofs propagated across multiple chains
- **Immutable Audit Trail**: All verifications stored with quantum-safe qHash identifiers
- **Privacy-Respecting IPFS**: Public snapshots protect sensitive data; signatures never exposed

### Developer Responsibilities

- **Input Validation**: Sanitize all user-provided data before verification
- **Contract Security**: Verify smart contract addresses before interaction
- **API Rate Limiting**: Implement appropriate limits for external service calls
- **Key Management**: Never expose private keys in verifier logic

## Verifier Security Checklist

### 1. Input Validation

```javascript
// CORRECT: Validate inputs
async verify(data, options) {
  // Validate address format
  if (!ethers.isAddress(data.contractAddress)) {
    throw new ValidationError('Invalid contract address');
  }
  
  // Sanitize content
  const sanitizedContent = data.content.trim().slice(0, 1000);
  
  // Verify required fields (owner for ownership-basic/licensed, ownerAddress for nft-ownership/token-holding)
  if ((!data.owner && !data.ownerAddress) || !data.reference) {
    throw new ValidationError('Missing required fields');
  }
}

// WRONG: Direct usage without validation
async verify(data, options) {
  const result = await contract.balanceOf(data.address); // Unsafe!
}
```

### 2. External API Security

```javascript
// CORRECT: Rate limiting and error handling
class ExternalVerifier {
  constructor() {
    this.rateLimiter = new Map();
    this.maxRequests = 100; // per hour
  }
  
  async callExternalAPI(userId) {
    // Check rate limits
    if (this.isRateLimited(userId)) {
      throw new Error('Rate limit exceeded');
    }
    
    try {
      const result = await fetch(url, { timeout: 5000 });
      return result;
    } catch (error) {
      // Don't expose internal errors
      throw new Error('External verification failed');
    }
  }
}
```

### 3. Smart Contract Interaction

```javascript
// CORRECT: Verify contract bytecode
async verifyContract(address, expectedBytecode) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const code = await provider.getCode(address);
  
  if (code === '0x') {
    throw new Error('No contract at address');
  }
  
  // Optionally verify against known bytecode
  if (expectedBytecode && code !== expectedBytecode) {
    throw new Error('Contract bytecode mismatch');
  }
}
```

## Common Attack Vectors

### 1. Proof Spoofing

**Risk**: Malicious users attempting to forge verification results

**Mitigation**:
- Always verify ownership through on-chain data or cryptographic signatures
- Never trust client-provided verification results
- Use the protocol's signature verification for all critical operations
 - Use `verifierContentHash` for proof-of-existence; avoid publishing full content unless explicitly intended

### 2. Replay Attacks

**Risk**: Reusing old signatures or proofs

**Mitigation**:
- Built-in: 5-minute timestamp validation and anti-replay protections
- Additional: Include chain-specific data in verification

### 3. Unintended Data Exposure

**Risk**: Accidentally exposing private content in public snapshots

**Mitigation**:
- Set `privacyLevel: 'private'` and avoid `publicDisplay`/`storeOriginalContent`
- For anchoring without exposure, use `enableIpfs: true` with `publicDisplay: false`, `storeOriginalContent: false`
- Ensure UI defaults use secure privacy settings

### 4. Contract Upgrades

**Risk**: Verified contracts changing implementation

**Mitigation**:
- Store contract address AND block number in proof
- Consider proxy pattern detection
- Document upgrade implications for users

## Rate Limiting Guidelines

### External APIs

| Service Type | Recommended Limit | Timeout |
|-------------|------------------|---------|
| Blockchain RPC | 100 req/sec | 10s |
| Social APIs | 10 req/min | 5s |
| DNS Lookups | 50 req/min | 3s |
| IPFS Gateway | 30 req/min | 30s |

### Implementation Example

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  allow(identifier) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Clean old requests
    const valid = requests.filter(t => now - t < this.windowMs);
    
    if (valid.length >= this.maxRequests) {
      return false;
    }
    
    valid.push(now);
    this.requests.set(identifier, valid);
    return true;
  }
}
```

## Error Handling

### Security-First Error Messages

```javascript
// CORRECT: Generic external errors
catch (error) {
  logger.error('Verification failed', { 
    error: error.message,
    userId: data.owner 
  });
  throw new Error('Verification failed');
}

// WRONG: Exposing internal details
catch (error) {
  throw new Error(`Database query failed: ${error.stack}`);
}
```

## Reporting Security Issues

Found a security vulnerability? Please report it responsibly:

1. **DO NOT** create public GitHub issues for security vulnerabilities
2. Email: dev@neus.network
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)

## Security Updates

Monitor security updates:
- GitHub Security Advisories: https://github.com/neus/network/security
- NPM Audit: Run `npm audit` regularly
- Email updates: dev@neus.network

## Compliance

The NEUS Network is designed for:
- GDPR compliance (no PII storage by default)
- Cryptographic proof integrity
- Decentralized trust model

However, verifier implementations must ensure their own compliance based on data handled.

---