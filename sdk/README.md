# @neus/sdk

[![npm](https://img.shields.io/npm/v/%40neus%2Fsdk?logo=npm&label=%40neus%2Fsdk&color=98C0EF)](https://www.npmjs.com/package/@neus/sdk)

**Ship verification without hosting your own checks.** The JavaScript SDK runs NEUS verification, polling, and **`gateCheck`**. Store **`proofId`** (your **verification ID**) once, then reuse. NEUS runs the checks; you do not fork verifier logic into your repo.

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
- [Widgets](https://docs.neus.network/widgets/overview)
- [API](https://docs.neus.network/api/overview)
- [Hosted Verify](https://docs.neus.network/cookbook/auth-hosted-verify)

## Publishing (`npm publish`)

Maintainers: `prepublishOnly` runs **lint**, **test**, and **build**. From `network/sdk`:

1. Bump `version` in `package.json` (semver).
2. Ensure `@zkpassport/sdk` peer + optional pin matches the NEUS app + protocol verifier stack (`0.12.5` today).
3. `npm ci` (or `npm install`), then `npm run prepublishOnly` locally to match npm’s publish gate.
4. `npm publish` (registry auth + 2FA per org policy).

Consumers get only the `files[]` whitelist (no tests, no private docs). Public API defaults (e.g. `https://api.neus.network`) are intentional product endpoints, not secrets. Transitive dev dependency versions are pinned by **`package-lock.json`** in this package (no root `overrides` in `package.json`).
