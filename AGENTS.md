# AGENTS.md

**Updated:** 2026-04-15

This page helps **builders**, **people using NEUS in products**, and **assistants** (for example tools connected via NEUS MCP) find the right starting point. Authoritative product behavior is always the **live NEUS service** and **[docs.neus.network](https://docs.neus.network)**.

## Start here

| Goal | Link |
| --- | --- |
| Overview of NEUS and quick paths | [README.md](./README.md) |
| Full documentation | [docs.neus.network](https://docs.neus.network) |
| Account, app, billing, first proof | [Get started](https://docs.neus.network/get-started) |
| Choose SDK, widgets, HTTP, or MCP | [Choose an integration path](https://docs.neus.network/choose-an-integration-path) |
| Check → verify → save → reuse | [Integration](https://docs.neus.network/integration) |

## Build and ship

| Goal | Link |
| --- | --- |
| JavaScript / TypeScript SDK | [sdk/README.md](./sdk/README.md) · [SDK](https://docs.neus.network/sdks/javascript) |
| React (`VerifyGate`, badges) | [sdk/widgets/README.md](./sdk/widgets/README.md) |
| Runnable examples | [examples/README.md](./examples/README.md) |
| Browser-based verification for users | [Hosted Verify](https://neus.network/verify) · [Hosted verify guide](https://docs.neus.network/cookbook/auth-hosted-verify) |
| Agents and portable identity | [Agents](https://docs.neus.network/agents/overview) |

## Assistants (MCP)

| Step | Action |
| --- | --- |
| Connect | **`https://mcp.neus.network/mcp`** — [Setup](https://docs.neus.network/mcp/setup) |
| First call | **`neus_context`** |
| Browser handoff | Open **`hostedVerifyUrl`** when the tool returns it |
| Account tools | Personal access key from [your Hub account](https://neus.network/profile?tab=account) only when required — [MCP Auth](https://docs.neus.network/mcp/auth) |

## Verifiers

- What you can verify today: [Verifier catalog](https://docs.neus.network/verification/verifiers).
- Machine-readable verifier inputs: **`docs/verifiers/schemas/`** (with related files under **`spec/`**).

## Safety and privacy

- [Security](./SECURITY.md) · [SDK security](./sdk/SECURITY.md)

## Improve this project

Ideas, fixes, and clarifications: [CONTRIBUTING.md](./CONTRIBUTING.md) · [Issues](https://github.com/neus/network/issues) · [Discussions](https://github.com/neus/network/discussions).
