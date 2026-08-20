# @neus/mcp-server

Portable trust harness for AI. Use one NEUS profile for identity, Portable Proofs, permissions, and private context across supported MCP clients.

Public discovery metadata for hosted NEUS MCP. This package does not start a local server.

Thesis: [docs.neus.network/mcp/overview](https://docs.neus.network/mcp/overview)

**Endpoint:** `https://mcp.neus.network/mcp`

Register that URL in the host, then click **Connect**. The terminal installer is optional:

```bash
npx -y -p @neus/sdk neus setup
```

`server.json` is the public tool catalog and OAuth discovery manifest used by MCP registries.

Client config: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)
