---
description: Create agent identity + delegation proofs for bots and services.
icon: 🤖
---

# Verifiable agents

Use `agent-identity` and `agent-delegation` to create verifiable identities and scoped authority for services and bots.

## 1) Create an agent identity

The agent signs an identity proof with its own wallet.

```javascript
import { NeusClient } from '@neus/sdk';
import { Wallet } from 'ethers';

const client = new NeusClient();
const agentWallet = new Wallet(process.env.AGENT_PRIVATE_KEY);

const proof = await client.verify({
  verifier: 'agent-identity',
  wallet: agentWallet,
  data: {
    agentId: 'neus-bot-001',
    agentWallet: agentWallet.address,
    agentLabel: 'Automation Agent',
    agentType: 'service',
    description: 'Automated workflow agent',
    capabilities: ['posting', 'execution']
  }
});
```

## 2) Delegate authority (optional)

A controller can issue a scoped delegation proof to the agent wallet.

```javascript
const controllerWallet = new Wallet(process.env.CONTROLLER_PRIVATE_KEY);

const delegationProof = await client.verify({
  verifier: 'agent-delegation',
  wallet: controllerWallet,
  data: {
    controllerWallet: controllerWallet.address,
    agentWallet: agentWallet.address,
    scope: 'posting',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  }
});
```

Use a dedicated controller wallet and keep private keys out of source control and client-side code.

## 3) Verify the agent (server-side)

Use gate checks to require identity and delegation proofs for the agent wallet:

```javascript
const identity = await client.gateCheck({ address: agentWallet.address, verifierIds: ['agent-identity'] });
const delegation = await client.gateCheck({ address: agentWallet.address, verifierIds: ['agent-delegation'] });

const ok = Boolean(identity.data?.eligible && delegation.data?.eligible);
```

## Reference

- Verifier schemas:
  - `docs/verifiers/schemas/agent-identity.json`
  - `docs/verifiers/schemas/agent-delegation.json`
