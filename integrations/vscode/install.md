# VS Code

## Install NEUS Trust MCP Server in VS Code

```bash
npx -y -p @neus/sdk neus setup --client vscode
npx -y -p @neus/sdk neus auth
```

Or add to your VS Code User settings:

| OS | Path |
| --- | --- |
| macOS | `~/Library/Application Support/Code/User/mcp.json` |
| Linux | `~/.config/Code/User/mcp.json` |
| Windows | `%APPDATA%\Code\User\mcp.json` |

Project scope: `./.vscode/mcp.json`

Full docs: [docs.neus.network/install](https://docs.neus.network/install)
