---
name: neus-trust-workflow
description: Runs the NEUS trust autopilot before sensitive assistant actions — load session context, reuse trust receipts, guide missing checks, connect Trusted Agent context, and protect Vault secrets. Use when verifying identity or permissions, checking trust receipts, mounting a profile agent, storing secrets, or when the user asks for NEUS Verify / trust-before-action.
license: Apache-2.0
compatibility: Requires hosted NEUS MCP (https://mcp.neus.network/mcp) in Cursor, Claude Code, Codex, or VS Code.
metadata:
  author: NEUS
  version: "1.3.3"
  homepage: https://docs.neus.network/install
---

# NEUS Trust Workflow

Reuse existing trust receipts first. Run a new check only when needed. Summarize as **NEUS Verify** — Passed, Action needed, or Blocked. Never dump raw tool JSON.

Use this for verification-sensitive steps. Answer simple questions directly.

## When to use

- Before sensitive tools, spend, publish, secrets, or agent actions
- When the user asks for NEUS Verify, trust receipts, Vault, or Trusted Agent setup
- When acting as a registered profile agent in a project

## Autopilot

1. **`neus_context`** once per session. Prefer signed-in profile context; omit wallet fields on check/verify tools.
2. **Profile agent:** **`neus_agent_mount`** (or `neus mount <agentId> --apply cursor`) for identity, permissions, skills, and context.
3. **Trust before action:** **`neus_proofs_check`** → **`neus_verify_or_guide`**.
4. **Trusted Agent:** **`neus_agent_link`** → **`neus_verify_or_guide`** if needed.
5. **Receipts:** **`neus_proofs_get`** for exact fields.
6. **Vault:** **`neus_secret_list`** / **`neus_secret_create`** / **`neus_secret_revoke`**.
7. **`neus_me`** only to refresh profile context or look up a wallet/DID.
8. Summarize as **NEUS Verify**.

## NEUS Verify format

Use the Passed / Action needed / Blocked guidance from `neus_context`. Never invent receipt IDs, check IDs, or statuses.

```txt
NEUS Verify: Passed. Requirement satisfied. Receipt on file. Next: Continue.
NEUS Verify: Action needed. Missing: <step>. Next: Complete the secure step, then retry.
NEUS Verify: Blocked. A required trust condition was not satisfied. Next: Do not continue until the check passes.
```

## Hard rules

- Receipts stay **offchain by default**. Do not prompt for wallet connection or a blockchain record unless the user asks.
- Use receipt IDs only from tool responses. Prefer “receipt ID” / “trust receipt” in user text.
- Store secrets only via **`neus_secret_create`**. Confirm stored name + receipt ID. Never paste tokens into chat.
- Use live check IDs from **`neus_context`** / **`neus_verifiers_catalog`**. Do not hardcode a second catalog.

## Setup and mount

Install, OAuth, access keys, and project mount: [references/setup.md](references/setup.md)

Docs: [docs.neus.network](https://docs.neus.network) · Install: [docs.neus.network/install](https://docs.neus.network/install)
