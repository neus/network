# NEUS MCP

Hosted NEUS MCP gives assistants and agent tools live trust context.

**Endpoint:** `https://mcp.neus.network/mcp`

## Setup

```bash
npx -y -p @neus/sdk neus setup
```

With a NEUS Profile access key:

```bash
npx -y -p @neus/sdk neus setup --access-key <npk_...>
```

Check the install:

```bash
npx -y -p @neus/sdk neus doctor
```

## Import an agent setup

```bash
npx -y -p @neus/sdk neus import --dry-run
npx -y -p @neus/sdk neus import --from auto
```

## First session

Start with `neus_context`. If you configured a Profile key, call `neus_me` once, then reuse receipts with `neus_proofs_check` before creating new verification.

Create access keys under **Profile -> Account** on [neus.network](https://neus.network/profile?tab=account). Keep keys in MCP or server config only.

## Docs

| Topic                    | Link                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Full setup               | [docs.neus.network/mcp/setup](https://docs.neus.network/mcp/setup)                                     |
| Tool order               | [docs.neus.network/mcp/overview](https://docs.neus.network/mcp/overview)                               |
| Discovery                | [docs.neus.network/mcp/endpoints](https://docs.neus.network/mcp/endpoints)                             |
| Auth and headers         | [docs.neus.network/mcp/auth](https://docs.neus.network/mcp/auth)                                       |
| Claude Code skill bundle | [docs.neus.network/mcp/claude-code-marketplace](https://docs.neus.network/mcp/claude-code-marketplace) |

## License

Apache-2.0
