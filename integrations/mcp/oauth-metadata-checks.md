# OAuth Metadata Checks

NEUS Trust exposes OAuth 2.1 protected-resource metadata at:

```
https://mcp.neus.network/.well-known/oauth-protected-resource
```

MCP clients use this URL to discover auth requirements before connecting.

## Manual verification

```bash
curl -s https://mcp.neus.network/.well-known/oauth-protected-resource | jq .
```

Expected fields:
- `resource` — the MCP server identifier
- `authorization_servers` — list of authorization server URLs
- `scopes_supported` — available OAuth scopes

## Metadata check

Confirm:
1. `server.json` `authorization.resourceMetadataUrl` points to the `.well-known` URL above.
2. The endpoint returns valid JSON with a 200 status.
3. The `resource` claim matches the server name in `server.json`.

## Reference

- [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-12-11/basic/authorization)
- [OAuth 2.1 Protected Resource Metadata](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-resource-metadata)
