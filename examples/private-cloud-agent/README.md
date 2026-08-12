# Private cloud agent + NEUS MCP

An agent that carries NEUS identity, permissions, proofs, context, and Vault across any environment — laptop, VPS, on-prem, or a TEE-attested confidential VM. Works with any runtime that speaks MCP.

## What this shows

- **NEUS MCP** checks who the agent is and what it is allowed to do before it takes action. The proof history travels with the agent across environments.
- **The environment** runs the agent and its tools. Optionally, a confidential compute runtime proves the environment is genuine before it releases keys.
- The trust chain runs from NEUS identity and authority to the action. Confidential compute is an optional hardening layer on top.

## Files

| File | What it does |
| ---- | ------------ |
| `docker-compose.yml` | The agent definition. Binds system prompt, model, tools, and NEUS config. Runs anywhere. |
| `agent.mjs` | Minimal MCP client that connects to NEUS and calls `neus_context`. |

## Prerequisites

- Somewhere to run a Docker Compose app (laptop, VPS, on-prem, or a confidential VM)
- A NEUS Profile access key (`npk_*`) from [Access Keys](https://neus.network/profile?tab=account)

## Run

```bash
# Set your NEUS access key
export NEUS_ACCESS_KEY=npk_...

# Run anywhere
docker compose up

# Or, to attest the environment first, deploy inside a confidential VM
# (example: Phala dstack)
npx phala deploy
```

The agent connects to NEUS MCP, loads profile context, and is ready to check identity and permissions before sensitive actions. The same trust state travels with the agent when you redeploy on a different backend.

## Verify the trust chain

- **NEUS agent identity:** verify with `neus_proofs_get` or `GET /api/v1/proofs/{qHash}`. Proves who the agent is and what it may do.
- **Binding:** the access key ties the deployed agent to a NEUS Profile.
- **TEE quote (optional):** if you deployed inside a confidential VM, verify with the operator's attestation verifier (for Phala dstack, `@phala/dcap-qvl` against the Phala PCCS). Proves the app hash and hardware.

## Portability

Redeploy the same compose file on any backend (AWS, GCP, Azure, Phala Cloud, bare metal). NEUS carries the same identity, permissions, proofs, context, and Vault across all environments. Confidential compute adds a proof of the environment — the trust state travels regardless.

Docs: [Private cloud agents](https://docs.neus.network/cookbook/private-cloud-agents) · [MCP overview](https://docs.neus.network/mcp/overview) · [Phala dstack](https://phala.com/dstack)