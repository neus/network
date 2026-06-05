# NEUS Trust Integrations

NEUS Trust is a **remote MCP trust gateway** at `https://mcp.neus.network/mcp`. These folders provide setup files for supported hosts.

## Endpoint

```
NEUS Trust
  Remote MCP Trust Gateway
    Cursor
    Claude Code
    VS Code
    Codex / OpenAI
    Cline
    ChatGPT / OpenAI Apps SDK
    CI / servers
    MCP discovery
```

## Files

| Artifact | Location | Purpose |
|---|---|---|
| MCP discovery metadata | [`mcp/npm-dist/server.json`](../mcp/npm-dist/server.json) | Server metadata |
| OAuth metadata | `https://mcp.neus.network/.well-known/oauth-protected-resource` | Auth discovery per MCP authorization spec |
| Hosted endpoint | `https://mcp.neus.network/mcp` | Remote MCP over HTTP |
| Claude plugin source | [`plugins/neus-trust/`](../plugins/neus-trust/) | Claude plugin |

## Hosts

Each host folder contains setup notes, a config snippet where useful, and a link to the docs.

| Host | Folder |
|---|---|
| Cursor | [`cursor/`](./cursor) |
| Claude Code | [`claude-code/`](./claude-code) |
| VS Code | [`vscode/`](./vscode) |
| Codex | [`codex/`](./codex) |
| Cline | [`cline/`](./cline) |
| OpenAI Apps SDK | [`openai/`](./openai) |
| CI / servers | [`ci/`](./ci) |
| MCP | [`mcp/`](./mcp) |
