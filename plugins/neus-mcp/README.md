# neus-mcp

The portable trust harness for AI. Marketplace plugin for the public NEUS trust skills.

Same install on every host:

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

`neus setup` registers `https://mcp.neus.network/mcp`. This plugin does not register a second MCP server.

Skills in this bundle: `neus-setup`, `neus-trust-workflow`, `neus-integrate`.

Docs: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)
