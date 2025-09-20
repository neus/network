# Building Custom Verifiers

Technical guide for implementing new verification types.

## Architecture

Verifiers validate specific claims and return standardized proofs with consistent interface and data contracts.

### Core Principles

- **Deterministic**: Same inputs + chain state = same outputs  
- **Privacy-first**: No PII in inputs or outputs
- **Minimal surface**: Only essential data in results
- **Standard interface**: Consistent request/response patterns

## Verifier ID Standards

```javascript
// Valid ID format: kebab-case, alphanumeric + hyphens only
const validIds = [
  'ownership-basic',      // Valid
  'nft-ownership',        // Valid  
  'github-contributions', // Valid
];

const invalidIds = [
  'OwnershipBasic',      // Invalid: CamelCase
  'ownership_basic',     // Invalid: Underscores
  'ownership basic',     // Invalid: Spaces
];
```

## Input Schema Design

### Content Verification
```json
{
  "type": "object",
  "required": ["content"],
  "properties": {
    "content": {"type": "string", "maxLength": 10000},
    "reference": {
      "type": "object", 
      "properties": {
        "type": {"enum": ["url", "ipfs", "tx", "other"]},
        "id": {"type": "string"}
      }
    }
  }
}
```

### Asset Verification
```json
{
  "type": "object",
  "required": ["ownerAddress", "contractAddress", "chainId"],
  "properties": {
    "ownerAddress": {"type": "string", "pattern": "^0x[a-fA-F0-9]{40}$"},
    "contractAddress": {"type": "string", "pattern": "^0x[a-fA-F0-9]{40}$"},
    "tokenId": {"type": "string"},
    "chainId": {"type": "integer", "enum": [1, 137, 42161, 10, 8453]},
    "minBalance": {"type": "string"}
  }
}
```

## Output Schema Design

All verifiers return this structure:

```json
{
  "owner": "0x...",           // Required: wallet that owns verified asset
  "timestamp": 1730000000000, // Required: verification timestamp
  "chainId": 1,               // Required: verification context chain
  // Category-specific fields below
}
```

## Implementation Template

```javascript
export class YourVerifier {
  static id = 'your-verifier-id';
  static description = 'What this verifier proves';

  static getConfigRequirements() {
    return ['REQUIRED_ENV_VAR']; // Config dependencies
  }

  constructor(config, services) {
    this.config = config;
    this.services = services;
  }

  async verify(data, options) {
    // 1. Validate inputs
    if (!data.requiredField) {
      throw new Error('Missing required field');
    }

    // 2. Perform verification logic
    const result = await this.performCheck(data);

    // 3. Return standardized result
    return {
      verified: result.success,
      data: {
        owner: data.ownerAddress,
        timestamp: Date.now(),
        chainId: data.chainId || 84532
      },
      status: result.success ? 'verified' : 'failed'
    };
  }

  async performCheck(data) {
    // Your verification logic here
    return { success: true };
  }
}
```

## Testing Framework

```javascript
import { validateVerifierPayload } from '@neus/sdk';

// Validate schema
const validation = validateVerifierPayload('your-verifier-id', testData);
console.log('Valid:', validation.valid);

// Test with live API
const proof = await client.verify({
  verifier: 'your-verifier-id',
  data: testData
});
```

## Security Guidelines

### Input Validation
```javascript
function sanitizeInput(data) {
  return {
    ownerAddress: normalizeAddress(data.ownerAddress),
    contractAddress: normalizeAddress(data.contractAddress),
    tokenId: String(data.tokenId).slice(0, 100),
    chainId: parseInt(data.chainId)
  };
}
```

### Error Handling
```javascript
try {
  const result = await this.performVerification(data);
  return { verified: true, data: result, status: 'verified' };
} catch (error) {
  return {
    verified: false,
    data: { owner: data.ownerAddress, error: error.message },
    status: 'verification_failed'
  };
}
```

## Submission Process

1. **Propose**: Start a GitHub Discussion with your verifier specification
2. **Review**: Technical and community review process in Discussions
3. **Implement**: Build following the standards above
4. **Submit**: Open a Pull Request targeting the `verifier-staging` branch with spec + schemas
5. **Test**: Include comprehensive test coverage and examples
6. **Merge**: Maintainers will merge from `verifier-staging` to `main` after review

### Proposal Template

```markdown
# Verifier: your-verifier-id

## Purpose
What this verifier proves

## Input Schema
[JSON Schema]

## Output Schema  
[JSON Schema]

## Examples
[SDK usage examples]

## Dependencies
- On-chain: Contract ABIs and RPC endpoints
- External: API endpoints and rate limits

## Testing
[Validation approach]
```

## Support

- **Community Questions & Ideas**: [GitHub Discussions](https://github.com/neus/network/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/neus/network/issues)
- **Implementation Help**: dev@neus.network