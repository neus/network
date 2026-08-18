# CAIP-380 offline verification

The CAIP-380 specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). The reference fixtures and code in this directory are Apache-2.0.

[`minimal-evm.json`](./minimal-evm.json) is a complete, non-sensitive wallet-signed request envelope for Base Sepolia. It uses a test-only key and contains no live user data.

[`minimal-solana.json`](./minimal-solana.json) is a second fixture using a non-EVM native signing scheme. Its signature is a placeholder vector for adapter conformance tests. The envelope accepts any CAIP-2 namespace. Additional ecosystems ship fixtures using the same pattern.

```js
import { verifyPortableProofEnvelope } from '@neus/sdk';
import envelope from './minimal-evm.json' with { type: 'json' };

const result = await verifyPortableProofEnvelope(envelope);

if (!result.valid) {
  throw new Error(result.errors.join('; '));
}
```

The helper performs these checks locally:

1. Canonicalize `did`, `verifierIds`, `data`, `signedTimestamp`, and exactly one chain field.
2. Recompute the 32-byte SHAKE-256 `qHash`.
3. Confirm that `did` matches the wallet and chain context.
4. Rebuild the six-line signing message.
5. Verify the signature using the chain's native scheme.

EIP-1271 smart-account signatures also need chain state. Pass an ethers provider as `options.provider`.

Freshness is reported separately. An old envelope can remain cryptographically valid even though it is no longer valid for replay as a new verification request.
