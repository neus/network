---
name: NEUS Trust Workflow
version: "1.3.1"
description: Portable identity, context, and permissions, reuse trust receipts, and protect secrets across editors and runtimes.
---

NEUS gives agents verifiable identity, limited permissions, and reusable trust receipts. Check trust before an assistant runs sensitive tools.

## Setup

Install the NEUS CLI:

```bash
npm i -g @neus/sdk
neus setup
neus check
```

Or try without installing:

```bash
npx -y -p @neus/sdk neus setup
```

`neus setup` configures hosted NEUS MCP for Cursor, Codex, VS Code, and Claude Code and starts the selected OAuth flow.

Codex-only:

```bash
neus setup --client codex
```

Servers and CI:

```bash
neus setup --access-key <npk_...>
```

Create access keys under **Account → Access keys** on [neus.network](https://neus.network/profile?tab=account). Never paste keys into chat or committed files.

Hosted MCP: **`https://mcp.neus.network/mcp`**

Trust receipts persist **offchain by default**. Do not prompt for wallet connection or on-chain anchoring unless the user explicitly asks; only then pass `options.publishToHub: true` on verify.

## Connect an agent to a project

After NEUS is connected on the machine, load a Trusted Agent into a project:

```bash
neus mount <agentId> --apply cursor
```

Use `neus mount` only when acting as a registered profile agent in a project. For receipt checks and secrets, `neus setup` plus `neus_context` is enough.

| Layer | Command |
|-------|---------|
| **Machine** | `neus setup` (once) |
| **Project** | `neus mount <agentId> --apply cursor` |
| **Session** | `neus_context` → `neus_agent_mount` when acting as the agent |

## Default workflow

1. Run **`neus_context`** once. Use the signed-in profile when present; omit wallet fields on check and verify tools.
2. **Acting as a profile agent:** use **`neus_agent_mount`** (or `neus mount <agentId> --apply cursor` in the project) to load identity, permissions, skills, and context.
3. **Trust before action:** **`neus_proofs_check`** then **`neus_verify_or_guide`**.
4. **Trusted Agent:** **`neus_agent_link`** then **`neus_verify_or_guide`** if needed.
5. **Receipts:** **`neus_proofs_get`** when exact receipt fields are needed.
6. **Vault:** **`neus_secret_create`** / **`neus_secret_list`** / **`neus_secret_revoke`** when signed in.
7. **`neus_me`** only to refresh profile context or look up a wallet/DID.
8. Summarize outcomes as Passed, Action needed, or Blocked. Do not show raw tool output.

## Result format

Summarize NEUS results in plain language. Do not dump raw tool JSON, MCP details, or implementation field names.

**Passed:**

```txt
NEUS Verify: Passed. The required receipt is valid. Continue.
```

**Action needed:**

```txt
NEUS Verify: Action needed. Sign in, then retry.
```

**Blocked:**

```txt
NEUS Verify: Blocked. A required check did not pass. Do not continue.
```

## Receipt Links

Use real receipt identifiers only — take them from tool responses, never invent them.

- App: `https://neus.network/proof/<qHash>`

Never invent qHashes, verifier IDs, or receipt fields.

## Secrets

- Store values only through **`neus_secret_create`**. Never paste raw tokens into chat.
- Confirm with the stored name and receipt ID after creation.
- **Revoke** and recreate if a value may have leaked.

## Integration source

Use the live verifier catalog for check IDs and required fields. Do not hardcode a second catalog in your app. See [docs.neus.network](https://docs.neus.network).