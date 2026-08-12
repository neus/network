# NEUS

Add identity, private context, and enforceable permissions to any AI agent.

Install the **neus-mcp** plugin from your host's marketplace, then click **Connect**. NEUS signs you in automatically. For servers, CI, or automation, use the public CLI.

**[Install](https://docs.neus.network/install)**

```bash
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus doctor --live
```

Ask your assistant: **"Before I take a sensitive action, use NEUS. Reuse what I already have."**

It looks up identity, authority, and saved results first, then summarizes as Passed, Action needed, or Blocked.

Per-client setup: [MCP clients](https://docs.neus.network/mcp/ide-plugin).

Claude Code plugin:

```text
/plugin marketplace add https://github.com/neus/network
/plugin install neus-mcp@neus
```

Skill: `/neus-mcp:neus-trust-workflow` (trust autopilot) · `/neus-mcp:neus-setup` (connect) · `/neus-mcp:neus-integrate` (add NEUS to an app)

This plugin bundles three skills:

- **`neus-setup`**: connect NEUS to your host and verify the setup is healthy.
- **`neus-trust-workflow`**: the trust autopilot: load session context, reuse portable proofs, guide missing checks, and summarize as Passed, Action needed, or Blocked before sensitive actions.
- **`neus-integrate`**: add NEUS access control to a host app: install the SDK, drop in VerifyGate, wire the server check, and test the flow.

All skills are the same ones shipped in `@neus/sdk`; installing the plugin is enough, no separate CLI run required for the skills.