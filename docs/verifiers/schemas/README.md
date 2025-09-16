# Verifier JSON Schemas

Machine-readable validation schemas for NEUS verifiers.

## Available Schemas

- [`ownership-basic.json`](./ownership-basic.json) - Content ownership verification
- [`nft-ownership.json`](./nft-ownership.json) - NFT ownership verification  
- [`token-holding.json`](./token-holding.json) - Token balance verification
- [`ownership-licensed.json`](./ownership-licensed.json) - Licensed content verification

## Usage

### JavaScript Validation

```javascript
import Ajv from 'ajv';
import schema from './schemas/nft-ownership.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

const data = {
  ownerAddress: '0x742d35Cc6634C0532925a3b8D82AB78c0D73C3Db',
  contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  tokenId: '1234',
  chainId: 1
};

const valid = validate(data);
if (!valid) {
  console.log('Validation errors:', validate.errors);
}
```

### SDK Integration

```javascript
import { validateVerifierPayload } from '@neus/sdk';

const validation = validateVerifierPayload('nft-ownership', data);
console.log('Valid:', validation.valid);
console.log('Errors:', validation.error);
```

## Schema Versioning

Current version: v1.0.0 for Genesis verifiers.