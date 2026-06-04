# NEUS MCP

Hosted NEUS MCP gives assistants and agent tools live trust context.

**Endpoint:** `https://mcp.neus.network/mcp`

## Setup

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

**OAuth** (`neus auth`) is the default for editors and assistants. For servers and CI, add a Profile access key:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

## npm packages

| Package | Path | Role |
| ------- | ---- | ---- |
| [`@neus/sdk`](https://www.npmjs.com/package/@neus/sdk) | [`sdk/`](../sdk) | JavaScript SDK + `neus` CLI + `@neus/sdk/mcp-hosts` |
| [`@neus/mcp-server`](https://www.npmjs.com/package/@neus/mcp-server) | [`mcp/npm-dist/`](./npm-dist) | MCP registry discovery metadata only |

Install with `npm install @neus/sdk` or `npm install @neus/mcp-server`. Release notes: [CHANGELOG.md](../CHANGELOG.md).

## Docs

| Topic                    | Link                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Full setup               | [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)                                     |
| Tool order               | [docs.neus.network/mcp/overview](https://docs.neus.network/mcp/overview)                               |
| OAuth                    | [docs.neus.network/mcp/oauth](https://docs.neus.network/mcp/oauth)                                   |
| Discovery                | [docs.neus.network/mcp/endpoints](https://docs.neus.network/mcp/endpoints)                             |
| NEUS for AI assistants | [docs.neus.network/mcp/ide-plugin](https://docs.neus.network/mcp/ide-plugin)                             |

## License

Apache-2.0
