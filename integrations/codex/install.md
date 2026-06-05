# Codex

## Connect NEUS Trust MCP in Codex

```bash
npx -y -p @neus/sdk neus setup --client codex
npx -y -p @neus/sdk neus auth --client codex
```

Codex owns its local OAuth session. `neus auth --client codex` delegates to `codex mcp login neus`.

Config path: `~/.codex/config.toml`

Full docs: [docs.neus.network/install](https://docs.neus.network/install)
