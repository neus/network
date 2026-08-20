---
name: neus-setup
description: Connect an MCP client to NEUS. Use when a user wants NEUS in their host, needs to sign in, or wants to verify their setup is healthy.
license: Apache-2.0
compatibility: Requires an MCP-capable client that can register a remote HTTP server.
---

# Connect NEUS

Register the hosted MCP remote, then click **Connect** in the host:

`https://mcp.neus.network/mcp`

If this host already has the NEUS marketplace plugin or registry listing, install that and click **Connect**. Do not also write a second `neus` entry.

Do not run `neus auth` unless the host cannot start sign-in. Codex: `neus auth --client codex`. `neus auth --oauth` is only the CLI token store.

Optional terminal installer (writes the same URL and the public workflow skill):

```bash
npx -y -p @neus/sdk neus setup
```

Cursor-only: Local and Cloud are separate sessions. If Local shows Logout and Unauthorized, click Logout, then Connect. Do not run `neus auth`.
