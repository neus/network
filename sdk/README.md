# @neus/sdk

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF)](https://www.npmjs.com/package/@neus/sdk)

**Portable trust, shipped as APIs and widgets.** The JavaScript SDK runs NEUS verification, polling, and **`gateCheck`**. Store **`proofId`** (your **proof ID**) once, then reuse. NEUS runs the checks; you do not fork verifier logic into your repo.

## Install

```bash
npm install @neus/sdk
```

## One-command onboarding

```bash
npx -y -p @neus/sdk neus init
```

Prints the hosted MCP URL and documentation links in your terminal - fast setup in IDEs and agent clients.

## Minimal working example

```javascript
import { NeusClient } from '@neus/sdk';

const client = new NeusClient();

const proof = await client.verify({
  verifier: 'ownership-basic',
  content: 'Hello NEUS',
  wallet: window.ethereum,
});

const proofId = proof.proofId;

const check = await client.gateCheck({
  address: '0x...',
  verifierIds: ['ownership-basic'],
});
```

> [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify) | [Get started](https://docs.neus.network/get-started)

## Core methods

| Method | Purpose |
| --- | --- |
| `client.verify()` | Create proof |
| `client.getProof()` | Fetch by `proofId` |
| `client.pollProofStatus()` | Wait for async completion |
| `client.gateCheck()` | **Server eligibility** (use for real gates) |
| `client.checkGate()` | Local preview only |
| `getHostedCheckoutUrl()` | Hosted verify URL |

## VerifyGate (React)

Defaults: unlisted public create (`privacyLevel: 'public'`, `publicDisplay: false`). Set `proofOptions` for other visibility.

```jsx
import { VerifyGate } from '@neus/sdk/widgets';

<VerifyGate appId="your-app-id" requiredVerifiers={['ownership-basic']}>
  <ProtectedContent />
</VerifyGate>
```

[Widgets README](./widgets/README.md)

## Config

```javascript
const client = new NeusClient({
  apiUrl: 'https://api.neus.network',
  appId: 'my-app',
  timeout: 30000,
});
```

## Docs

- [Quickstart](https://docs.neus.network/quickstart)
- [SDK](https://docs.neus.network/sdks/javascript)
- [MCP](https://docs.neus.network/mcp/overview) (IDEs and assistants)
- [Widgets](https://docs.neus.network/widgets/overview)
- [API](https://docs.neus.network/api/overview)
- [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to propose documentation, SDK, and example changes.
