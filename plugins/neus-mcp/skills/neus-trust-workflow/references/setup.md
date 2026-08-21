# Setup and project mount

Load this file only when the user needs install, sign-in, access keys, or project mount help.

## Install

Register the hosted MCP remote, then click **Connect** in the host:

`https://mcp.neus.network/mcp`

If the host already has a NEUS marketplace plugin or registry listing, use that Connect path. Do not also write a second `neus` entry in the host MCP config.

If Connect is missing, use the host’s own MCP login after the endpoint is registered.

Optional terminal installer (writes the same URL and this workflow skill when the plugin is not installed):

```bash
npx -y -p @neus/sdk neus setup
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
neus mount <agentId> --apply <host>
```

| Layer | How |
|-------|-----|
| **Machine** | Marketplace, registry, or URL-only MCP config. Terminal installer optional. |
| **Project** | `neus mount <agentId> --apply <host>` |
| **Session** | `neus_context` → `neus_agent_mount` when acting as the agent |

Use `neus mount` only when acting as a registered profile agent. For proof checks and secrets, Connect plus `neus_context` is enough.
