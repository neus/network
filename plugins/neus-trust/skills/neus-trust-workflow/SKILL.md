---
name: NEUS Trust Workflow
version: "1.2.5"
description: Trust infrastructure for agents that act. Verify identity and scoped authority, reuse trust receipts, and protect secrets across IDEs and runtimes.
---

NEUS gives agents verifiable identity, scoped authority, and receipts for every trusted action. Verify trust before your assistant runs tools.

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

`neus setup` configures hosted NEUS MCP for Cursor, Codex, VS Code, and Claude Code. Cursor, VS Code, and Claude Code use browser OAuth. Codex uses its own MCP login after setup.

Codex-only:

```bash
neus setup --client codex
neus auth --client codex
```

Servers and CI:

```bash
neus setup --access-key <npk_...>
```

Create access keys under **Account → Access keys** on [neus.network](https://neus.network/profile?tab=account). Never paste keys into chat or committed files.

Hosted MCP: **`https://mcp.neus.network/mcp`**

Trust receipts persist **offchain by default**. Do not prompt for wallet connection or on-chain anchoring unless the user explicitly asks; only then pass `options.publishToHub: true` on verify.

## Project mount (per repo)

After MCP is connected on the machine, mount an agent into a project:

```bash
neus mount <agentId> --apply cursor
```

Use `neus mount` only when acting as a registered profile agent in a project. For general MCP trust workflow (verification, receipts, secrets), `neus setup` + `neus_context` is enough.

| Layer | Command |
|-------|---------|
| **Machine** | `neus setup` + `neus auth` (once) |
| **Repo** | `neus mount <agentId> --apply cursor` |
| **Session** | `neus_context` → `neus_agent_mount` when acting as the agent |

## Autopilot (default)

1. Run **`neus_context`** once. Use signed-in profile context when present — omit wallet fields on check/verify tools.
2. **Acting as a profile agent:** **`neus_agent_mount`** (or `neus mount <agentId> --apply cursor` in the project) — identity, delegation, and scoped policy in one bundle.
3. **Trust before action:** **`neus_proofs_check`** then **`neus_verify_or_guide`**.
4. **Trusted Agent:** **`neus_agent_link`** then **`neus_verify_or_guide`** if needed.
5. **Receipts:** **`neus_proofs_get`** when exact receipt fields are needed.
6. **Vault:** **`neus_secret_create`** / **`neus_secret_list`** / **`neus_secret_revoke`** when signed in.
7. **`neus_me`** only to refresh profile context or look up a wallet/DID.
8. Summarize outcomes as **Trust Result** for the user — never dump raw tool JSON.

## Trust Result format (assistant output)

Summarize NEUS results in plain language. Do not dump raw tool JSON, MCP details, or implementation field names.

**Passed:**

```txt
NEUS Verify
Status: Passed
Requirement: Identity and permission check
Receipt: Existing trust receipt accepted
Next: Continue
```

**Action needed:**

```txt
NEUS Verify
Status: Action needed
Missing: Sign-in
Next: Connect NEUS, then retry
```

**Blocked:**

```txt
NEUS Verify
Status: Blocked
Reason: Required trust condition was not satisfied
Next: Do not continue until verification is complete
```

## Receipt Links

Use real receipt identifiers only — take them from tool responses, never invent them.

- App: `https://neus.network/proof/<qHash>`

Never invent qHashes, verifier IDs, or receipt fields.

## Secrets

- Store values only through **`neus_secret_create`**. Never paste raw tokens into chat.
- Confirm with **alias + qHash** after create.
- **Revoke** and recreate if a value may have leaked.

## Integrator notes

- **Protocol** is the source of truth for verifiers, gates, receipts, and MCP tool behavior.
- **Product app** (`neus.network`) consumes protocol state — do not duplicate verifier schema in client apps.
- Public docs and SDK: [docs.neus.network](https://docs.neus.network)