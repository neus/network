# NEUS Core Plugin

**Version:** 1.0.0
**Default Agent:** Zeus

NEUS Core is the flagship plugin for the NEUS Verification Network. It bundles the Zeus governance agent with NEUS MCP tools for verification, proof creation, and agent management.

---

## Quick Install

### Claude Code

```bash
/plugin install github:neus/network/plugins/neus-core
```

### Cursor

```bash
/plugin install github:neus/network/plugins/neus-core
```

---

## What's Included

### Zeus Agent

The default governance agent that orchestrates all NEUS operations:
- Verification flows
- Agent creation
- Gate checks
- Profile resolution

### Skills

| Skill | Purpose |
|-------|---------|
| `/verify` | Check eligibility and guide verification |
| `/create-agent` | Create AI/automation agents |
| `/audit` | Audit proofs and delegations |

### MCP Tools

All 9 NEUS MCP tools are bundled:
- `neus_context` - Get all context in one call
- `neus_proofs_check` - Gate checks
- `neus_verify_or_guide` - Check + guide flow
- `neus_verify` - Proof creation
- `neus_proofs_get` - Get proof history
- `neus_me` - Session context
- `neus_agent_link` - Check agent status
- `neus_agent_create` - Create agents
- `neus_verifiers_catalog` - List verifiers

---

## Quick Start

1. Install plugin
2. Zeus activates automatically
3. Start with: `Call neus_context to load NEUS configuration`

---

## Configuration

No configuration required. The plugin connects to the public NEUS MCP endpoint:

```
https://mcp.neus.network/mcp
```

For authenticated requests, set `NEUS_AUTH_TOKEN` in your environment.

---

## Documentation

- [NEUS Docs](https://docs.neus.network)
- [MCP Reference](https://docs.neus.network/mcp/overview)
- [Verifier Catalog](https://docs.neus.network/verification/verifiers)

---

## License

Apache-2.0