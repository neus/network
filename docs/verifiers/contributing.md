# Contributing Verifiers

**For complete contribution guidelines, see [CONTRIBUTING.md](https://github.com/neus/network/blob/main/CONTRIBUTING.md)**

This document provides specific guidance for verifier development and submission.

## How to submit

- Ideas and early proposals: start a **GitHub Discussion** at https://github.com/neus/network/discussions
- Code submissions: open a **Pull Request targeting `verifier-staging`** with spec + JSON Schemas
- Bugs/regressions: file a **GitHub Issue** at https://github.com/neus/network/issues

## Submission Checklist

Include in your PR:

1. **Verifier Summary**
   - ID (kebab‑case): `your-verifier-id`
   - Category: content | nft | token | identity | custom

2. **Input Schema (JSON Schema)**
   - Required fields only
   - Explicit types and formats

3. **Output Schema (JSON Schema)**  
   - Deterministic and minimal
   - Include timestamp and chainId

4. **Examples**
   - SDK usage example
   - Request/response payloads

5. **Dependencies**
   - On‑chain sources (RPC endpoints, ABIs)
   - External APIs with rate limits

6. **Test Plan**
   - Local validation via `validateVerifierPayload`
   - Live API testing with testnet storage
   - Status polling to completion

## Review Process

1. **Technical Review** (7 days) - Code quality, security, gas optimization
2. **Community Review** (7 days) - Use case validation, compatibility  
3. **Final Approval** - Maintainer consensus and security audit

## Acceptance Criteria

**Technical Standards:**
- Follows NEUS verifier interface
- Handles edge cases gracefully
- Optimized for performance
- No external dependencies for core logic

**Documentation Standards:**
- Clear API documentation with examples
- Integration examples and use cases
- Security considerations explained
- Error handling guidelines

**Security Standards:**
- Input validation on all parameters
- No private keys or secrets in code
- Rate limiting for external APIs
- No PII exposure in inputs or outputs

## Testing Requirements

```javascript
import { validateVerifierPayload } from '@neus/sdk';

// Test input validation
const validation = validateVerifierPayload('your-verifier-id', testData);
console.log('Schema valid:', validation.valid);

// Test with live API
const proof = await client.verify({
  verifier: 'your-verifier-id',
  data: testData,
  options: { targetChains: [11155111] } // Testnet only
});

console.log('Verification result:', proof);
```

## High-Priority Verifiers

The community has identified these high-value verifiers for development:

1. **GitHub Repository Ownership** - Prove repository ownership/maintenance  
2. **Discord Server Ownership** - Prove Discord server administration
3. **Professional Credentials** - Verify degrees, certifications, licenses
4. **Geographic Verification** - Location proofs without exact coordinates
5. **Temporal Proofs** - Time-based claims and deadline verification

## Implementation Examples

### On-Chain Verification Pattern
```javascript
import { ethers } from 'ethers';

export class OnChainVerifier {
  async verify(data) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const contract = new ethers.Contract(
      data.contractAddress,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );

    const balance = await contract.balanceOf(data.ownerAddress);
    const meetsThreshold = balance >= ethers.parseEther(data.minBalance);

    return {
      verified: meetsThreshold,
      data: {
        input: data,
        onChainData: {
          requiredMinBalance: data.minBalance
        },
        verificationTimestamp: Date.now()
      },
      status: meetsThreshold ? 'verified' : 'insufficient_balance'
    };
  }
}
```

### API-Based Verification Pattern  
```javascript
export class ApiVerifier {
  async verify(data) {
    try {
      const response = await fetch(`https://api.provider.com/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ credential: data.credential })
      });

      const result = await response.json();

      return {
        verified: result.verified,
        data: {
          owner: data.ownerAddress,
          provider: 'external-service',
          score: result.score,
          timestamp: Date.now()
        },
        status: result.verified ? 'verified' : 'failed'
      };
    } catch (error) {
      return {
        verified: false,
        data: {
          owner: data.ownerAddress,
          error: error.message,
          timestamp: Date.now()
        },
        status: 'api_error'
      };
    }
  }
}
```

## Submission Template

```markdown
# Verifier: your-verifier-id

## Purpose
What this verifier proves

## Input Schema
[JSON Schema]

## Output Schema
[JSON Schema] 

## Examples
[Code examples]

## Dependencies
[External services and requirements]

## Security Considerations
[Security analysis]

## Test Cases
[Validation scenarios]
```

## Support

- **Community Questions & Ideas**: [GitHub Discussions](https://github.com/neus/network/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/neus/network/issues)
- **Technical Integration**: dev@neus.network