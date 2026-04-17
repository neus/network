# AGENTS.md

**Updated:** 2026-04-16

This page helps **builders**, **people shipping NEUS in products**, and **assistants** (for example tools using NEUS MCP) find the right starting point. Product behavior is defined by the **live NEUS service** and **[docs.neus.network](https://docs.neus.network)**.

**Docs copy SSOT (this repo):** [.cursor/agents/neus-network-docs-positioning.md](./.cursor/agents/neus-network-docs-positioning.md) - [.cursor/rules/10_PUBLIC_DOCS_POSITIONING.mdc](./.cursor/rules/10_PUBLIC_DOCS_POSITIONING.mdc)

## Start here

| Goal | Link |
| --- | --- |
| **Hosted Verify** (fastest user flow) | [neus.network/verify](https://neus.network/verify), [Hosted verify guide](https://docs.neus.network/cookbook/auth-hosted-verify) |
| Overview and navigation | [README.md](./README.md), [Docs home](https://docs.neus.network) |
| Account, app setup, first loop | [Get started](https://docs.neus.network/get-started) |
| SDK, widgets, HTTP, or MCP | [Choose an integration path](https://docs.neus.network/choose-an-integration-path) |
| Check, verify, save, reuse | [Integration](https://docs.neus.network/integration) |

## Build and ship

| Goal | Link |
| --- | --- |
| JavaScript / TypeScript SDK | [sdk/README.md](./sdk/README.md), [SDK](https://docs.neus.network/sdks/javascript) |
| React (`VerifyGate`, badges) | [sdk/widgets/README.md](./sdk/widgets/README.md) |
| Runnable examples | [examples/README.md](./examples/README.md) |
| Browser-based verification | [Hosted Verify](https://neus.network/verify) |
| Agents and linked profiles | [Agents](https://docs.neus.network/agents/overview) |

## Assistants (MCP)

| Step | Action |
| --- | --- |
| Connect | **`https://mcp.neus.network/mcp`** - [Setup](https://docs.neus.network/mcp/setup) |
| First call | **`neus_context`** |
| Browser handoff | Open **`hostedVerifyUrl`** when the tool returns it |
| Account tools | Personal access key from [your profile](https://neus.network/profile?tab=account) only when required - [MCP Auth](https://docs.neus.network/mcp/auth) |

## Verifiers

- Capability reference: [Verification](https://docs.neus.network/verification/verifiers).
- Machine-readable schemas: **`docs/verifiers/schemas/`** (related: **`spec/`**).

## Safety and privacy

- [Security](./SECURITY.md) | [SDK security](./sdk/SECURITY.md)

## Improve this project

Ideas, fixes, and clarifications: [CONTRIBUTING.md](./CONTRIBUTING.md) | [Issues](https://github.com/neus/network/issues) | [Discussions](https://github.com/neus/network/discussions).
