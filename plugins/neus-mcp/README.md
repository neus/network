# neus-mcp

Portable trust harness for AI. Bring your NEUS profile, checks, Portable Proofs, permissions, and private context to supported MCP clients.

## Connect

Register the hosted remote, then click **Connect**:

`https://mcp.neus.network/mcp`

This plugin registers that URL. If the host already installed the plugin from a marketplace or registry, do not also add a second `neus` entry in the host MCP config.

Skills in this bundle: `neus-setup`, `neus-trust-workflow`, `neus-integrate`.

## From a terminal

Optional. Writes the same endpoint and installs the public workflow skill when the plugin is not already present:

```bash
npx -y -p @neus/sdk neus setup
```

## Cursor

Cursor Local and Cloud are separate sessions. Leave Cloud off unless you want Cloud Agents to use NEUS. Do not run `neus auth` — that writes `~/.neus` and Cursor does not use it. If Local shows Logout and Unauthorized, click Logout, then Connect.

Docs: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)
