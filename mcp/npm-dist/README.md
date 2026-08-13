# @neus/mcp-server

Public discovery metadata for the hosted NEUS MCP server.

**Endpoint:** `https://mcp.neus.network/mcp`

This package does not start a local server. Connect a client with `@neus/sdk`:

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

`server.json` is the public tool catalog and OAuth discovery manifest used by MCP registries.

[Setup and client configuration](https://docs.neus.network/mcp/setup)
