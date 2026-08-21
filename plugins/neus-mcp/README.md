# neus-mcp

Add `https://mcp.neus.network/mcp`, click **Connect**, and see your current profile and proofs.

This plugin registers that URL. If the host already installed the plugin from a marketplace or registry, do not also add a second `neus` entry in the host MCP config.

Skills in this bundle: `neus-setup`, `neus-trust-workflow`, `neus-integrate`.

## From a terminal

Optional. Writes the same endpoint and installs the public workflow skill when the plugin is not already present:

```bash
npx -y -p @neus/sdk neus setup
```

Docs: [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)
