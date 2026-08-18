---
name: neus-trust-workflow
description: Checks identity, permissions, and reusable proofs before sensitive assistant actions. Use when verifying authority, mounting a Trusted Agent, managing Vault secrets, or when the user asks for NEUS Verify.
license: Apache-2.0
compatibility: Requires hosted NEUS MCP (https://mcp.neus.network/mcp) in Cursor, Claude Code, Codex, or VS Code.
metadata:
  author: NEUS
  version: "1.3.9"
  homepage: https://docs.neus.network/mcp/setup
---

# NEUS Trust Workflow

Reuse existing proofs first. Run a new check only when needed. Summarize as **NEUS Verify**: Passed, Action needed, or Blocked. Never dump raw tool JSON.

Use this before an assistant runs sensitive tools or takes another verification-sensitive step. Answer simple questions directly.

## When to use

- Before sensitive tools, spend, publish, secrets, or agent actions
- When the user asks for NEUS Verify, proofs, Vault, or Trusted Agent setup
- When acting as a registered profile agent in a project

## Workflow

1. **`neus_context`** once per session. Prefer signed-in profile context; omit wallet fields on check/verify tools.
2. **Profile agent:** **`neus_agent_mount`** (or `neus mount <agentId> --apply cursor`) for identity, permissions, skills, and context.
3. **Trust before action:** **`neus_proofs_check`** → **`neus_verify_or_guide`**.
4. **Trusted Agent:** **`neus_agent_link`** → **`neus_verify_or_guide`** if needed.
5. **Proofs:** **`neus_proofs_get`** for exact fields.
6. **Vault:** **`neus_secret_list`** / **`neus_secret_create`** / **`neus_secret_revoke`**.
7. Reuse existing proofs via **`neus_proofs_check`** before creating new ones. When signed in, `neus_context` returns the current profile context; re-call it only after a profile change.
8. Summarize as **NEUS Verify**.

## NEUS Verify format

Use the Passed / Action needed / Blocked guidance from `neus_context`. Never invent proof IDs, check IDs, or statuses.

```txt
NEUS Verify: Passed. Requirement satisfied. Proof on file. Next: Continue.
NEUS Verify: Action needed. Missing: <step>. Next: Complete the secure step, then retry.
NEUS Verify: Blocked. A required trust condition was not satisfied. Next: Do not continue until the check passes.
```

## Hard rules

- Proofs stay **offchain by default**. Do not prompt for wallet connection or a blockchain record unless the user asks.
- Use proof IDs only from tool responses. Prefer “proof ID” / “portable proof” in user text.
- Store secrets only via **`neus_secret_create`**. Confirm stored name + proof ID. Never paste tokens into chat.
- Use live check IDs from **`neus_context`** / **`neus_verifiers_catalog`**. Do not hardcode a second catalog.

## Setup and mount

Install, OAuth, access keys, and project mount: [references/setup.md](references/setup.md)

Docs: [docs.neus.network](https://docs.neus.network). Setup: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)
