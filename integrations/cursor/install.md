# Cursor

## Install NEUS Trust in Cursor

```bash
npx -y -p @neus/sdk neus setup --client cursor
npx -y -p @neus/sdk neus auth
```

Or add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "neus": {
      "type": "http",
      "url": "https://mcp.neus.network/mcp"
    }
  }
}
```

Project scope: `./.cursor/mcp.json`

Full docs: [docs.neus.network/install](https://docs.neus.network/install)
