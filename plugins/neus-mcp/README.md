# NEUS MCP

Add identity, private context, and enforceable permissions to any AI agent.

## Connect

Install `neus-mcp` from your host's marketplace. The plugin registers `https://mcp.neus.network/mcp` and bundles the NEUS skills. Click **Connect** to sign in.

CLI setup is available for Cursor, Codex, VS Code, Claude Code, servers, and CI:

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Then ask:

> Before this action, use NEUS to check my agent's identity and permissions. Reuse a current proof if one qualifies.

The assistant should return **Passed**, **Action needed**, or **Blocked**.

## Claude Code

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-mcp@neus
```

## Included skills

- `neus-setup`: connect a host and check the connection
- `neus-trust-workflow`: reuse or create the proof required before an action
- `neus-integrate`: add NEUS access checks to an application

[MCP client setup](https://docs.neus.network/mcp/setup)
