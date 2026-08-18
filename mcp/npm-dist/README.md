# @neus/mcp-server

The trust harness for AI agents. Public discovery metadata for the hosted NEUS MCP server. Set what an agent can do before it acts.

**Endpoint:** `https://mcp.neus.network/mcp`

This package does not start a local server. Connect a client with `@neus/sdk`:

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus doctor --live
```

## Or paste this into your agent

Copy the block below into Claude Code, Cursor, Codex, or any coding agent with NEUS MCP. The agent reads it, runs setup, signs you in, and starts carrying your authority.

```text
# NEUS connect in one prompt

You are connecting this editor to NEUS so my identity, provenance, and
authority travel with me. Follow these steps exactly.

## 1. Register NEUS
Run: npx -y -p @neus/sdk neus setup
This installs the public workflow skill and writes MCP config for every
supported host in this project. It does not open a browser.

## 2. Sign in
Run: npx -y -p @neus/sdk neus auth
Or click Connect in the MCP client. Default sign-in is browser OAuth.
No wallet required.

## 3. Confirm the connection
Run: npx -y -p @neus/sdk neus doctor --live
A healthy result confirms the endpoint, auth, and public tools.

## 4. What to do next
After setup, reuse my existing proofs before asking me to verify again.
Before any sensitive action (spend, publish, secrets, agent tool call),
call neus_context once, then neus_proofs_check. Summarize as
NEUS Verify: Passed, Action needed, or Blocked.

Canonical endpoint: https://mcp.neus.network/mcp
Docs: https://docs.neus.network/mcp/setup
```

`server.json` is the public tool catalog and OAuth discovery manifest used by MCP registries.

[Setup and client configuration](https://docs.neus.network/mcp/setup)
