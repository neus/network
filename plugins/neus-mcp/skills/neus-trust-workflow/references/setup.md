# Setup and project mount

Load this file only when the user needs install, sign-in, access keys, or project mount help.

## Install

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
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

## Connect an agent to a project

After NEUS is connected on the machine:

```bash
neus mount <agentId> --apply cursor
```

| Layer | Command |
|-------|---------|
| **Machine** | `neus setup` (once) |
| **Project** | `neus mount <agentId> --apply cursor` |
| **Session** | `neus_context` → `neus_agent_mount` when acting as the agent |

Use `neus mount` only when acting as a registered profile agent. For proof checks and secrets, `neus setup` plus `neus_context` is enough.

The setup command installs this workflow skill together with the single hosted MCP registration.
