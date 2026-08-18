# NEUS MCP

The trust harness for AI agents. Set what an agent can do before it accesses data, moves money, or takes action.

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
