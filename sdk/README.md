# @neus/sdk

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF)](https://www.npmjs.com/package/@neus/sdk)

**Verify once. Prove everywhere.** JavaScript SDK for portable proof receipts.

## Live catalog and enforcement

- **Verifier definitions and enforcement** come from the NEUS API: `GET /api/v1/verification/verifiers` returns the live catalog (IDs, JSON Schema, flow/access metadata). Fetch the current catalog at runtime; do not treat hardcoded lists in this package as guaranteed.
- **Proof eligibility and validity** are determined by the API (`GET /api/v1/proofs/check` via `client.gateCheck()`, and the verification write path). Client-side checks in the SDK are for UX and faster failure only; **always trust the API response** for access control.
- **Prefer `gateCheck()`** for allow/deny. `checkGate()` is for local preview against proofs you already fetched; it can disagree with the server on edge cases. See `NeusClient` JSDoc.

## Install

```bash
npm install @neus/sdk
```

## CLI (`neus init`)

Prints the hosted **MCP** JSON block (streamable HTTP), verification and account URLs, and deep links to MCP setup, agents, and [LLM docs](https://docs.neus.network/platform/llm-docs). **Does not** write files, create accounts, or generate keys.

```bash
npx -y -p @neus/sdk neus init
```

## 30-second example

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

// Create a proof (defaults: private, unlisted, original content stored)
const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

const proofId = proof.proofId;

// Check eligibility from anywhere
const check = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});
// check.data.eligible → true/false
```

> **No wallet?** [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) · **Shipping:** [Get started](https://docs.neus.network/get-started)

## Core methods

| Method | What it does |
|--------|-------------|
| `client.verify()` | Create a proof |
| `client.getProof()` | Fetch proof record by proof receipt ID |
| `client.pollProofStatus()` | Wait for async completion |
| `client.gateCheck()` | Server eligibility (`GET /api/v1/proofs/check`) — use for allow/deny |
| `client.checkGate()` | Local evaluation against fetched proofs (preview UX; not a substitute for `gateCheck` for security) |
| `getHostedCheckoutUrl()` | Generate a hosted verify URL |

## Gate content in React

`VerifyGate` create mode defaults to **unlisted public** (`privacyLevel: 'public'`, `publicDisplay: false`). Add `proofOptions` only for listed public or private.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate requiredVerifiers={['ownership-basic']}>
  <ProtectedContent />
</VerifyGate>
```

## Configuration

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network', // default
  appId: 'my-app',                    // links to your platform app
  timeout: 30000,
});
```

## Docs

- [**Quickstart (SDK)**](https://docs.neus.network/quickstart)
- [**SDK guide**](https://docs.neus.network/sdks/javascript)
- [**Widgets**](https://docs.neus.network/widgets/overview)
- [**API reference**](https://docs.neus.network/api/overview)
- [**Hosted Verify**](https://docs.neus.network/cookbook/auth-hosted-verify)
