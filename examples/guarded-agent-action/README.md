# Guard an agent action

This example loads the current NEUS runtime mount and makes one permission decision before host code runs a tool.

## Setup

```bash
npm install
npx -y -p @neus/sdk neus setup
npx -y -p @neus/sdk neus auth
npx -y -p @neus/sdk neus mount <agentId> --apply codex
```

Replace `codex` with `cursor` or `claude` when that is the host enforcing the decision.

## Check an action

```bash
npm start -- read_proofs
npm start -- send_message --irreversible
```

The process exits with code `0` only when the current permission proof allows the action. A denied action, missing permission proof, expired permission, or required human approval exits with code `2`.

The host remains responsible for stopping the tool call when the decision is not `allowed`.

See [Run your first guarded action](https://docs.neus.network/mcp/guarded-action) for the full flow.
